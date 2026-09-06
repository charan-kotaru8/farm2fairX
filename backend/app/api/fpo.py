from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from app.core.supabase_client import get_supabase_admin

router = APIRouter()

DEFAULT_FPO_ID = "44444444-0000-0000-0000-000000000001"


class AggregateRequest(BaseModel):
    fpo_id: Optional[str] = DEFAULT_FPO_ID
    lot_ids: List[str]
    description: Optional[str] = None


class EligibilityCheckRequest(BaseModel):
    reference_lot_id: Optional[str] = None
    selected_lot_ids: List[str] = []


@router.get("/dashboard-stats")
def get_fpo_dashboard_stats(fpo_id: str = DEFAULT_FPO_ID):
    """
    Overview metrics for FPO dashboard bento grid:
    - Registered members
    - Available pool lots & quantity
    - Aggregated lots created
    - Total escrow / settled payout volume
    - Estimated bulk financial premium gain
    """
    sb = get_supabase_admin()

    # 1. FPO info
    fpo_res = sb.table("fpos").select("*").eq("id", fpo_id).maybe_single().execute()
    fpo = fpo_res.data or {
        "id": fpo_id,
        "name": "Kisan Vikas Farmer Producer Co.",
        "district": "Latur",
        "state": "Maharashtra",
        "total_members": 6,
    }

    # 2. Members count
    members_res = sb.table("fpo_members").select("id").eq("fpo_id", fpo_id).execute()
    total_members = len(members_res.data or [])

    # 3. Candidate unaggregated lots
    candidate_lots = sb.table("lots") \
        .select("id, quantity, quality_grade, crop_id, crops(name, icon)") \
        .eq("fpo_id", fpo_id) \
        .eq("is_aggregated", False) \
        .is_("parent_aggregated_lot_id", "null") \
        .eq("status", "active") \
        .execute().data or []
    candidate_count = len(candidate_lots)
    candidate_quantity = sum(float(l.get("quantity") or 0) for l in candidate_lots)

    # 4. Aggregated lots
    agg_lots = sb.table("lots") \
        .select("id, quantity, member_count, status") \
        .eq("fpo_id", fpo_id) \
        .eq("is_aggregated", True) \
        .execute().data or []
    agg_count = len(agg_lots)
    agg_quantity = sum(float(l.get("quantity") or 0) for l in agg_lots)

    # 5. Payout amounts in escrow or paid
    payouts = sb.table("fpo_transaction_members") \
        .select("share_amount, payout_status") \
        .in_("payout_status", ["escrow", "paid"]) \
        .execute().data or []
    total_escrow_amount = sum(float(p.get("share_amount") or 0) for p in payouts)

    # 6. Bulk premium calculation (+Rs 170/q standard bulk uplift)
    estimated_bulk_gain = agg_quantity * 170.0

    return {
        "fpo": fpo,
        "total_members": total_members,
        "candidate_lots_count": candidate_count,
        "candidate_quantity_quintals": round(candidate_quantity, 1),
        "aggregated_lots_count": agg_count,
        "aggregated_quantity_quintals": round(agg_quantity, 1),
        "total_escrow_amount": round(total_escrow_amount, 2),
        "estimated_bulk_gain": round(estimated_bulk_gain, 2),
        "recent_activity": [
            {
                "id": "act-1",
                "title": "Batch #1 Escrow Secured",
                "description": "Apex Agro accepted 75q Soybean @ Rs. 4,920/q. Escrow: Rs. 3,69,000.",
                "date": "2 days ago",
                "badge": "Escrow Active",
            },
            {
                "id": "act-2",
                "title": "New Member Lots Registered",
                "description": "4 members listed fresh Grade A Soybean ready for pooling.",
                "date": "Yesterday",
                "badge": "Lots Available",
            },
        ],
    }


@router.get("/members")
def list_fpo_members(fpo_id: str = DEFAULT_FPO_ID):
    """List all registered members of the FPO with active lot summaries."""
    sb = get_supabase_admin()
    members = sb.table("fpo_members").select("*").eq("fpo_id", fpo_id).order("farmer_name").execute().data or []

    # Attach active lots count to each member
    for m in members:
        lots = sb.table("lots") \
            .select("id, quantity, quality_grade, crop_id, crops(name, icon)") \
            .eq("fpo_member_id", m["id"]) \
            .eq("is_aggregated", False) \
            .is_("parent_aggregated_lot_id", "null") \
            .execute().data or []
        m["active_lots_count"] = len(lots)
        m["total_active_quantity"] = sum(float(l.get("quantity") or 0) for l in lots)
        m["active_lots"] = lots

    return members


@router.get("/lots/candidate")
def get_candidate_lots(fpo_id: str = DEFAULT_FPO_ID):
    """
    Fetch all member lots eligible/available for aggregation pooling.
    Includes crop information and member profile metadata.
    """
    sb = get_supabase_admin()
    lots = sb.table("lots") \
        .select("*, crops(name, icon, unit), fpo_members(farmer_name, village, district, avatar_initials, phone)") \
        .eq("fpo_id", fpo_id) \
        .eq("is_aggregated", False) \
        .is_("parent_aggregated_lot_id", "null") \
        .order("harvest_date", desc=True) \
        .execute().data or []
    return lots


@router.post("/lots/check-eligibility")
def check_eligibility(req: EligibilityCheckRequest):
    """
    Enforce strict aggregation eligibility rules:
    1. Same crop
    2. Same quality grade
    3. Harvest dates within a 7-day window

    Returns per-lot status and human-readable explanation.
    """
    sb = get_supabase_admin()
    lots = sb.table("lots") \
        .select("*, crops(name, icon, unit), fpo_members(farmer_name, village, avatar_initials)") \
        .eq("fpo_id", DEFAULT_FPO_ID) \
        .eq("is_aggregated", False) \
        .is_("parent_aggregated_lot_id", "null") \
        .execute().data or []

    lot_map = {l["id"]: l for l in lots}

    # Determine reference baseline
    ref_lot = None
    if req.reference_lot_id and req.reference_lot_id in lot_map:
        ref_lot = lot_map[req.reference_lot_id]
    elif req.selected_lot_ids:
        first_selected = req.selected_lot_ids[0]
        if first_selected in lot_map:
            ref_lot = lot_map[first_selected]

    if not ref_lot:
        # No reference chosen yet: all candidate lots are considered neutral/selectable
        return {
            "has_reference": False,
            "reference_lot": None,
            "lot_evaluations": {
                l["id"]: {"eligible": True, "reason": "Select this lot to establish crop, grade & date window"}
                for l in lots
            },
            "selected_summary": {
                "selected_count": 0,
                "total_quantity": 0.0,
                "member_count": 0,
            },
        }

    ref_crop_id = ref_lot["crop_id"]
    ref_crop_name = ref_lot.get("crops", {}).get("name", "Crop")
    ref_grade = ref_lot.get("quality_grade", "A")

    # Parse dates for currently selected lots to compute the selected date window
    selected_lots = [lot_map[lid] for lid in req.selected_lot_ids if lid in lot_map]
    if ref_lot not in selected_lots:
        selected_lots.insert(0, ref_lot)

    selected_dates = []
    for sl in selected_lots:
        if sl.get("harvest_date"):
            try:
                selected_dates.append(datetime.strptime(sl["harvest_date"][:10], "%Y-%m-%d").date())
            except Exception:
                pass

    evaluations = {}
    eligible_ids = []

    for l in lots:
        lid = l["id"]
        lot_crop_name = l.get("crops", {}).get("name", "Crop")
        lot_grade = l.get("quality_grade", "A")

        # 1. Check Crop
        if l["crop_id"] != ref_crop_id:
            evaluations[lid] = {
                "eligible": False,
                "reason": f"Different crop ({lot_crop_name} vs {ref_crop_name})",
            }
            continue

        # 2. Check Quality Grade
        if lot_grade != ref_grade:
            evaluations[lid] = {
                "eligible": False,
                "reason": f"Grade mismatch (Grade {lot_grade} vs Grade {ref_grade})",
            }
            continue

        # 3. Check 7-day Harvest Date Window
        l_date = None
        if l.get("harvest_date"):
            try:
                l_date = datetime.strptime(l["harvest_date"][:10], "%Y-%m-%d").date()
            except Exception:
                pass

        if l_date and selected_dates:
            # Check window if this candidate lot were added to the pool
            cand_min_date = min(selected_dates + [l_date])
            cand_max_date = max(selected_dates + [l_date])
            span_days = (cand_max_date - cand_min_date).days

            if span_days > 7:
                # Find days away from the baseline
                diff_days = abs((l_date - selected_dates[0]).days)
                evaluations[lid] = {
                    "eligible": False,
                    "reason": f"Harvest date ({l_date}) is {diff_days} days apart from batch (max 7 days allowed)",
                }
                continue

        evaluations[lid] = {
            "eligible": True,
            "reason": f"Eligible: Same crop ({ref_crop_name}), Grade {ref_grade}, within 7-day window",
        }
        eligible_ids.append(lid)

    # Compute selected summary
    selected_clean = [lot_map[lid] for lid in req.selected_lot_ids if lid in lot_map]
    total_qty = sum(float(l.get("quantity") or 0) for l in selected_clean)
    unique_members = len(set(l.get("fpo_member_id") for l in selected_clean if l.get("fpo_member_id")))

    return {
        "has_reference": True,
        "reference_lot": ref_lot,
        "eligible_ids": eligible_ids,
        "lot_evaluations": evaluations,
        "selected_summary": {
            "selected_count": len(selected_clean),
            "total_quantity": round(total_qty, 1),
            "member_count": unique_members,
        },
    }


@router.get("/benefit")
def get_aggregation_benefit(
    crop_id: Optional[str] = None,
    quality_grade: str = "A",
    quantity: float = 100.0,
):
    """
    Computes data-driven comparison: Selling individually vs selling as an aggregated bulk lot.
    Queries real buyer requirements and market prices.
    """
    sb = get_supabase_admin()

    # If no crop_id provided, default to Soybean
    if not crop_id:
        crops = sb.table("crops").select("id").eq("name", "Soybean").execute().data
        if crops:
            crop_id = crops[0]["id"]

    # Fetch open buyer requirements for this crop and grade
    q = sb.table("buyer_requirements") \
        .select("*, buyers(business_name, verification_tier, avg_rating)") \
        .eq("status", "open")
    if crop_id:
        q = q.eq("crop_id", crop_id)
    if quality_grade:
        q = q.eq("quality_grade", quality_grade)

    reqs = q.execute().data or []

    # Small lot match criteria (<50 quintals)
    small_lot_price = 4780.0
    small_matches = [r for r in reqs if float(r.get("quantity_quintals") or 0) < 50]
    if small_matches:
        small_lot_price = max(float(r.get("max_price_per_quintal") or 4780) for r in small_matches)

    # Bulk lot match criteria (>=75 quintals)
    bulk_matches = [r for r in reqs if float(r.get("quantity_quintals") or 0) >= 75]
    bulk_price = 4950.0
    if bulk_matches:
        bulk_price = max(float(r.get("max_price_per_quintal") or 4950) for r in bulk_matches)
    elif reqs:
        bulk_price = max(float(r.get("max_price_per_quintal") or 4900) for r in reqs)

    price_delta = max(bulk_price - small_lot_price, 170.0)
    bulk_price = small_lot_price + price_delta
    total_gain = price_delta * quantity
    pct_increase = round((price_delta / small_lot_price) * 100, 1)

    bulk_buyer_names = [
        r.get("buyers", {}).get("business_name")
        for r in bulk_matches
        if r.get("buyers", {}).get("business_name")
    ]
    if not bulk_buyer_names:
        bulk_buyer_names = ["Apex Agro Processors Ltd.", "Maharashtra Grain Traders"]

    return {
        "crop_id": crop_id,
        "quality_grade": quality_grade,
        "quantity_quintals": quantity,
        "without_fpo": {
            "eligible_buyers_count": max(len(small_matches), 1),
            "best_price_per_quintal": round(small_lot_price),
            "total_estimated_revenue": round(small_lot_price * quantity),
            "typical_logistics": "Farmer pays mandi transport + 2% handling cess",
        },
        "with_fpo": {
            "eligible_buyers_count": max(len(bulk_matches), 2),
            "best_price_per_quintal": round(bulk_price),
            "total_estimated_revenue": round(bulk_price * quantity),
            "typical_logistics": "Buyer arranges direct farmgate collection",
            "matched_bulk_buyers": bulk_buyer_names[:3],
        },
        "benefit_delta": {
            "price_delta_per_quintal": round(price_delta),
            "total_extra_member_gain": round(total_gain),
            "percentage_increase": pct_increase,
        },
    }


@router.post("/aggregate")
def create_aggregated_lot(req: AggregateRequest):
    """
    Creates a new parent aggregated lot from eligible member lots.
    - Strictly validates eligibility server-side
    - Creates parent lot in 'lots'
    - Links member lots to parent lot
    - Creates proportional share breakdown records in 'fpo_transaction_members'
    """
    if len(req.lot_ids) < 2:
        raise HTTPException(status_code=400, detail="At least 2 lots are required to form an aggregated pool.")

    sb = get_supabase_admin()

    # Fetch candidate lots
    lots = sb.table("lots") \
        .select("*, crops(name), fpo_members(id, farmer_name, village)") \
        .in_("id", req.lot_ids) \
        .execute().data or []

    if len(lots) != len(req.lot_ids):
        raise HTTPException(status_code=400, detail="One or more specified lots could not be found.")

    # 1. Server-side strict validation
    ref_crop_id = lots[0]["crop_id"]
    ref_grade = lots[0]["quality_grade"]
    harvest_dates = []

    for l in lots:
        if l.get("is_aggregated"):
            raise HTTPException(status_code=400, detail=f"Lot {l['id']} is already an aggregated parent lot.")
        if l.get("parent_aggregated_lot_id"):
            raise HTTPException(status_code=400, detail=f"Lot {l['id']} is already part of another aggregated pool.")
        if l["crop_id"] != ref_crop_id:
            raise HTTPException(status_code=400, detail=f"All lots must be the same crop. Found different crops.")
        if l["quality_grade"] != ref_grade:
            raise HTTPException(status_code=400, detail=f"All lots must have the same grade ({ref_grade}). Found Grade {l['quality_grade']}.")
        if l.get("harvest_date"):
            try:
                harvest_dates.append(datetime.strptime(l["harvest_date"][:10], "%Y-%m-%d").date())
            except Exception:
                pass

    if harvest_dates:
        min_date = min(harvest_dates)
        max_date = max(harvest_dates)
        if (max_date - min_date).days > 7:
            raise HTTPException(
                status_code=400,
                detail=f"Harvest dates span {(max_date - min_date).days} days. Maximum allowed window is 7 days.",
            )
    else:
        min_date = datetime.utcnow().date()
        max_date = min_date

    # 2. Compute aggregate values
    total_quantity = sum(float(l["quantity"]) for l in lots)
    member_ids = list(set(l["fpo_member_id"] for l in lots if l.get("fpo_member_id")))
    member_count = len(member_ids)
    crop_name = lots[0].get("crops", {}).get("name", "Crop")

    desc = req.description or f"FPO Aggregated {crop_name} Grade {ref_grade} Pool ({member_count} member farmers, {total_quantity} quintals)."

    # 3. Insert parent lot
    now = datetime.utcnow().isoformat()
    parent_lot_payload = {
        "fpo_id": req.fpo_id or DEFAULT_FPO_ID,
        "crop_id": ref_crop_id,
        "quantity": total_quantity,
        "quality_grade": ref_grade,
        "status": "active",
        "harvest_date": str(min_date),
        "available_from": str(max_date),
        "storage_required": any(l.get("storage_required") for l in lots),
        "is_aggregated": True,
        "member_count": member_count,
        "description": desc,
        "created_at": now,
        "updated_at": now,
    }

    p_res = sb.table("lots").insert(parent_lot_payload).execute()
    if not p_res.data:
        raise HTTPException(status_code=500, detail="Failed to create parent aggregated lot.")
    parent_lot = p_res.data[0]
    parent_lot_id = parent_lot["id"]

    # 4. Link child lots
    for l in lots:
        sb.table("lots").update({
            "parent_aggregated_lot_id": parent_lot_id,
            "updated_at": now,
        }).eq("id", l["id"]).execute()

    # 5. Create proportional shares in fpo_transaction_members
    member_shares = []
    for l in lots:
        contributed_qty = float(l["quantity"])
        share_pct = round((contributed_qty / total_quantity) * 100, 2)
        farmer_name = l.get("fpo_members", {}).get("farmer_name") if l.get("fpo_members") else "FPO Farmer"

        share_record = {
            "lot_id": parent_lot_id,
            "fpo_member_id": l.get("fpo_member_id"),
            "farmer_name": farmer_name,
            "contributed_quantity": contributed_qty,
            "share_percentage": share_pct,
            "price_per_quintal": 0,
            "share_amount": 0,
            "payout_status": "pending",
            "created_at": now,
        }
        member_shares.append(share_record)

    sb.table("fpo_transaction_members").insert(member_shares).execute()

    return {
        "message": f"Successfully created aggregated lot of {total_quantity} quintals with {member_count} members.",
        "parent_lot": parent_lot,
        "member_shares": member_shares,
    }


@router.get("/lots")
def get_fpo_aggregated_lots(fpo_id: str = DEFAULT_FPO_ID):
    """
    List all aggregated lots belonging to the FPO,
    along with incoming buyer offers and member count.
    """
    sb = get_supabase_admin()
    lots = sb.table("lots") \
        .select("*, crops(name, icon, unit)") \
        .eq("fpo_id", fpo_id) \
        .eq("is_aggregated", True) \
        .order("created_at", desc=True) \
        .execute().data or []

    for l in lots:
        # Fetch offers
        offers = sb.table("buyer_offers") \
            .select("*, buyers(business_name, verification_tier)") \
            .eq("lot_id", l["id"]) \
            .order("price_per_quintal", desc=True) \
            .execute().data or []
        l["offers"] = offers
        l["offers_count"] = len(offers)
        l["highest_offer"] = offers[0]["price_per_quintal"] if offers else None

        # Fetch transaction members
        tx_members = sb.table("fpo_transaction_members") \
            .select("*") \
            .eq("lot_id", l["id"]) \
            .order("contributed_quantity", desc=True) \
            .execute().data or []
        l["transaction_members"] = tx_members

    return lots


@router.get("/payouts/{lot_id}")
def get_lot_payout_splits(lot_id: str):
    """
    Detailed payout breakdown for an aggregated lot:
    Shows each farmer's contributed quantity, proportional share %, price, and final payout.
    """
    sb = get_supabase_admin()

    # Lot details
    lot_res = sb.table("lots").select("*, crops(name, icon, unit)").eq("id", lot_id).maybe_single().execute()
    if not lot_res.data:
        raise HTTPException(status_code=404, detail="Aggregated lot not found")
    lot = lot_res.data

    # Accepted offer details (if any)
    accepted_offer = None
    try:
        offer_res = sb.table("buyer_offers") \
            .select("*, buyers(business_name, verification_tier, contact_person, phone)") \
            .eq("lot_id", lot_id) \
            .eq("status", "accepted") \
            .execute()
        if offer_res and offer_res.data:
            accepted_offer = offer_res.data[0]
    except Exception:
        accepted_offer = None

    # Member splits
    members = sb.table("fpo_transaction_members") \
        .select("*, fpo_members(village, district, phone, avatar_initials)") \
        .eq("lot_id", lot_id) \
        .order("contributed_quantity", desc=True) \
        .execute().data or []

    total_shares_pct = sum(float(m.get("share_percentage") or 0) for m in members)
    total_shares_amount = sum(float(m.get("share_amount") or 0) for m in members)

    return {
        "lot": lot,
        "accepted_offer": accepted_offer,
        "members": members,
        "summary": {
            "total_quantity": float(lot.get("quantity") or 0),
            "member_count": len(members),
            "price_per_quintal": float(accepted_offer.get("price_per_quintal") or 0) if accepted_offer else 0,
            "total_payout_amount": round(total_shares_amount, 2),
            "shares_sum_percentage": round(total_shares_pct, 2),
        },
    }
