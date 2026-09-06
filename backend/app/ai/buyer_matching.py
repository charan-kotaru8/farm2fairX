"""
Buyer Matching Module.
Scores buyers against a lot using transparent, weighted factors.
Returns per-factor breakdown with every score — not just the final %.

Weights are imported from ai/weights.py (single source of truth).
"""
from typing import List, Dict, Any
from app.ai.weights import BUYER_MATCH_WEIGHTS, WEIGHT_LABELS, DISTRICT_ADJACENCY
from app.core.supabase_client import get_supabase_admin


# ─── Individual Factor Scoring (each returns 0–100) ─────────────────────

def _score_crop_compatibility(buyer_requirements: List[Dict], lot_crop_id: str) -> int:
    """100 if buyer has an open requirement for this crop, 0 otherwise."""
    for req in buyer_requirements:
        if req.get("crop_id") == lot_crop_id and req.get("status") == "open":
            return 100
    return 0


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

    if buyer_district == lot_market_district:
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

    # Compute individual factor scores
    factors_raw = {
        "crop_compatibility": _score_crop_compatibility(buyer_requirements, lot_crop_id),
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

    # Get market context: latest price for this crop
    latest_price = sb.table("market_prices") \
        .select("modal_price, markets(district)") \
        .eq("crop_id", lot.get("crop_id")) \
        .order("date", desc=True) \
        .limit(1) \
        .execute().data

    market_modal_price = float(latest_price[0]["modal_price"]) if latest_price else 0
    market_district = latest_price[0].get("markets", {}).get("district", "") if latest_price else ""

    # Score each buyer
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

    # Sort by total score descending
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
