"""
Buyer Matching Module.
Scores buyers against a lot using transparent, weighted factors.
Returns per-factor breakdown with every score — not just the final %.

Crop compatibility is a hard pre-filter applied before scoring runs.
Weights are imported from ai/weights.py (single source of truth).
"""
from typing import List, Dict, Any
from app.ai.weights import BUYER_MATCH_WEIGHTS, WEIGHT_LABELS, DISTRICT_ADJACENCY
from app.core.supabase_client import get_supabase_admin


# ─── Individual Factor Scoring (each returns 0–100) ─────────────────────

def _score_quantity_fit(buyer_requirements: List[Dict], lot_quantity: float, lot_crop_id: str) -> int:
    """
    100 × min(buyer_qty, lot_qty) / max(buyer_qty, lot_qty).
    Penalizes large mismatches in either direction.
    """
    for req in buyer_requirements:
        if req.get("crop_id") == lot_crop_id and req.get("status") == "open":
            buyer_qty = float(req.get("quantity_quintals", 0))
            if buyer_qty == 0 and lot_quantity == 0:
                return 100
            if buyer_qty == 0 or lot_quantity == 0:
                return 0
            ratio = min(buyer_qty, lot_quantity) / max(buyer_qty, lot_quantity)
            return round(ratio * 100)
    return 0


def _score_quality_match(buyer_requirements: List[Dict], lot_quality: str, lot_crop_id: str) -> int:
    """100 if grades match, 60 if one grade apart, 20 if two apart."""
    grade_order = {"A": 0, "B": 1, "C": 2}

    for req in buyer_requirements:
        if req.get("crop_id") == lot_crop_id and req.get("status") == "open":
            buyer_grade = req.get("quality_grade", "A")
            diff = abs(grade_order.get(buyer_grade, 0) - grade_order.get(lot_quality, 0))
            if diff == 0:
                return 100
            elif diff == 1:
                return 60
            else:
                return 20
    # No matching requirement — give neutral score
    return 50


def _score_distance(buyer_district: str, lot_market_district: str) -> int:
    """100 if same district, 70 if neighboring, 40 otherwise."""
    if not buyer_district or not lot_market_district:
        return 40

    if buyer_district.lower() == lot_market_district.lower():
        return 100

    neighbors = DISTRICT_ADJACENCY.get(lot_market_district, set())
    if buyer_district in neighbors:
        return 70

    return 40


def _score_price_fit(
    buyer_requirements: List[Dict],
    lot_crop_id: str,
    market_modal_price: float,
) -> int:
    """
    100 × (buyer_max_price / market_price), clamped 0–100.
    Higher buyer willingness-to-pay relative to market = better fit.
    """
    for req in buyer_requirements:
        if req.get("crop_id") == lot_crop_id and req.get("status") == "open":
            max_price = float(req.get("max_price_per_quintal") or 0)
            if max_price == 0 or market_modal_price == 0:
                return 50
            ratio = max_price / market_modal_price
            return round(min(100, ratio * 100))
    return 50


def _score_reliability(buyer: Dict) -> int:
    """
    Weighted combo of tier + rating.
    Tier: basic=30, verified=60, trusted_partner=100
    Rating: normalized (0-5 scale → 0-100)
    Combined: 60% tier + 40% rating
    """
    tier_scores = {"basic": 30, "verified": 60, "trusted_partner": 100}
    tier_score = tier_scores.get(buyer.get("verification_tier", "basic"), 30)

    rating = float(buyer.get("avg_rating", 0))
    rating_score = min(100, (rating / 5.0) * 100)

    return round(tier_score * 0.6 + rating_score * 0.4)


# ─── Main Scoring Function ──────────────────────────────────────────────

def score_buyer_for_lot(
    buyer: Dict[str, Any],
    buyer_requirements: List[Dict[str, Any]],
    lot: Dict[str, Any],
    market_district: str,
    market_modal_price: float,
) -> Dict[str, Any]:
    """
    Score a single buyer against a lot.
    Returns total_score (0-100) and per-factor breakdown.
    """
    lot_crop_id = lot.get("crop_id", "")
    lot_quantity = float(lot.get("quantity", 0))
    lot_quality = lot.get("quality_grade", "A")
    buyer_district = buyer.get("district", "")

    # Compute individual factor scores (crop compatibility is a hard pre-filter)
    factors_raw = {
        "quantity_fit": _score_quantity_fit(buyer_requirements, lot_quantity, lot_crop_id),
        "quality_match": _score_quality_match(buyer_requirements, lot_quality, lot_crop_id),
        "distance": _score_distance(buyer_district, market_district),
        "price_fit": _score_price_fit(buyer_requirements, lot_crop_id, market_modal_price),
        "reliability": _score_reliability(buyer),
    }

    # Apply weights
    factors = {}
    total_score = 0.0

    for factor_key, raw_score in factors_raw.items():
        weight = BUYER_MATCH_WEIGHTS[factor_key]
        weighted = raw_score * weight
        total_score += weighted
        factors[factor_key] = {
            "score": raw_score,
            "weighted": round(weighted, 1),
            "weight": weight,
            "label": WEIGHT_LABELS[factor_key],
        }

    return {
        "buyer_id": buyer.get("id"),
        "business_name": buyer.get("business_name"),
        "verification_tier": buyer.get("verification_tier", "basic"),
        "total_score": round(total_score),
        "factors": factors,
    }


def match_buyers_for_lot(lot_id: str) -> Dict[str, Any]:
    """
    Find and score all eligible buyers for a given lot.
    Only buyers with an OPEN requirement for the lot's exact crop are
    considered — crop match is a hard filter, not a scored factor.
    Returns sorted matches + weights config for UI transparency.
    """
    sb = get_supabase_admin()

    # Fetch lot with crop info
    lot_res = sb.table("lots") \
        .select("*, crops(name, icon, unit)") \
        .eq("id", lot_id) \
        .maybe_single() \
        .execute()

    if not lot_res.data:
        return {"error": "Lot not found", "matches": [], "weights": BUYER_MATCH_WEIGHTS}

    lot = lot_res.data
    lot_crop_id = lot.get("crop_id", "")

    # Fetch all approved buyers
    buyers = sb.table("buyers") \
        .select("*") \
        .eq("verification_status", "approved") \
        .execute().data or []

    if not buyers:
        return {"matches": [], "weights": BUYER_MATCH_WEIGHTS}

    # Fetch buyer requirements for matching
    all_requirements = sb.table("buyer_requirements") \
        .select("*") \
        .eq("status", "open") \
        .execute().data or []

    # Group requirements by buyer
    req_by_buyer = {}
    for req in all_requirements:
        bid = req.get("buyer_id")
        if bid not in req_by_buyer:
            req_by_buyer[bid] = []
        req_by_buyer[bid].append(req)

    # ── HARD FILTER: only buyers with an open requirement for this exact crop ──
    buyers = [
        b for b in buyers
        if any(r.get("crop_id") == lot_crop_id and r.get("status") == "open"
               for r in req_by_buyer.get(b["id"], []))
    ]
    if not buyers:
        return {
            "lot_id": lot_id,
            "crop_name": lot.get("crops", {}).get("name", ""),
            "matches": [],
            "weights": {
                k: {"value": v, "label": WEIGHT_LABELS[k]}
                for k, v in BUYER_MATCH_WEIGHTS.items()
            },
        }

    # Resolve this lot's own market and district
    market_district = ""
    lot_market_id = lot.get("market_id")

    if not lot_market_id:
        lot_district = ""
        if lot.get("farmer_id"):
            farmer_rows = sb.table("profiles").select("district").eq("id", lot["farmer_id"]).limit(1).execute().data or []
            if farmer_rows and farmer_rows[0].get("district"):
                lot_district = farmer_rows[0]["district"]
        if not lot_district and lot.get("fpo_id"):
            fpo_rows = sb.table("fpos").select("district").eq("id", lot["fpo_id"]).limit(1).execute().data or []
            if fpo_rows and fpo_rows[0].get("district"):
                lot_district = fpo_rows[0]["district"]
        if not lot_district and lot.get("pickup_address"):
            for dist in ["Latur", "Pune", "Nashik", "Solapur", "Nagpur", "Nanded", "Amravati"]:
                if dist.lower() in lot["pickup_address"].lower():
                    lot_district = dist
                    break
        if not lot_district:
            lot_district = "Latur"

        market_res = sb.table("markets").select("id, district").ilike("district", f"%{lot_district}%").limit(1).execute().data or []
        if market_res:
            lot_market_id = market_res[0]["id"]
            market_district = market_res[0]["district"]
        else:
            market_district = lot_district
    else:
        m_rows = sb.table("markets").select("district").eq("id", lot_market_id).limit(1).execute().data or []
        if m_rows:
            market_district = m_rows[0].get("district", "")

    # Market price for THIS lot's own market (not the global latest for the crop)
    market_modal_price = 0
    if lot_market_id:
        price_res = sb.table("market_prices") \
            .select("modal_price") \
            .eq("crop_id", lot_crop_id) \
            .eq("market_id", lot_market_id) \
            .order("date", desc=True) \
            .limit(1) \
            .execute().data
        if price_res:
            market_modal_price = float(price_res[0]["modal_price"])

    # Fallback to latest price for crop if market has no price data for this crop
    if not market_modal_price:
        fallback_price = sb.table("market_prices") \
            .select("modal_price, markets(district)") \
            .eq("crop_id", lot_crop_id) \
            .order("date", desc=True) \
            .limit(1) \
            .execute().data
        if fallback_price:
            market_modal_price = float(fallback_price[0]["modal_price"])
            if not market_district:
                market_district = fallback_price[0].get("markets", {}).get("district", "")

    # Score each (already crop-filtered) buyer
    matches = []
    for buyer in buyers:
        buyer_reqs = req_by_buyer.get(buyer["id"], [])
        match = score_buyer_for_lot(
            buyer=buyer,
            buyer_requirements=buyer_reqs,
            lot=lot,
            market_district=market_district,
            market_modal_price=market_modal_price,
        )
        matches.append(match)

    matches.sort(key=lambda m: m["total_score"], reverse=True)

    return {
        "lot_id": lot_id,
        "crop_name": lot.get("crops", {}).get("name", ""),
        "matches": matches,
        "weights": {
            k: {"value": v, "label": WEIGHT_LABELS[k]}
            for k, v in BUYER_MATCH_WEIGHTS.items()
        },
    }
