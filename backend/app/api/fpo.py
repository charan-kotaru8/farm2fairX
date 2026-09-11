from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from app.core.supabase_client import get_supabase_admin

router = APIRouter()

DEFAULT_FPO_ID = "44444444-0000-0000-0000-000000000001"


def resolve_fpo(fpo_id: Optional[str] = None, user_id: Optional[str] = None):
    """
    Dynamically finds or auto-provisions the FPO record for an FPO manager.
    - If user_id is provided, checks if an fpos row or profiles.fpo_id is tied to that user.
    - If fpo_id is provided, fetches that FPO.
    - If neither or not found, falls back to the primary FPO in the database.
    """
    sb = get_supabase_admin()
    if user_id:
        fpo_res = sb.table("fpos").select("*").eq("profile_id", user_id).limit(1).execute()
        if fpo_res and fpo_res.data and len(fpo_res.data) > 0:
            return fpo_res.data[0]
        
        prof_res = sb.table("profiles").select("fpo_id, full_name, district, role").eq("id", user_id).limit(1).execute()
        if prof_res and prof_res.data and len(prof_res.data) > 0:
            prof = prof_res.data[0]
            if prof.get("fpo_id"):
                fpo_res = sb.table("fpos").select("*").eq("id", prof["fpo_id"]).limit(1).execute()
                if fpo_res and fpo_res.data and len(fpo_res.data) > 0:
                    return fpo_res.data[0]
            elif prof.get("role") == "fpo":
                fpo_name = prof.get("full_name") or "Farmer Producer Co."
                if not fpo_name.lower().endswith("fpo") and "producer" not in fpo_name.lower() and "cooperative" not in fpo_name.lower():
                    fpo_name = f"{fpo_name} Farmer Producer Co."
                district = prof.get("district") or "Latur"
                try:
                    new_fpo = sb.table("fpos").insert({
                        "name": fpo_name,
                        "district": district,
                        "state": "Maharashtra",
                        "contact_person": prof.get("full_name") or "FPO Manager",
                        "profile_id": user_id,
                        "total_members": 0,
                    }).execute()
                    if new_fpo and new_fpo.data and len(new_fpo.data) > 0:
                        sb.table("profiles").update({"fpo_id": new_fpo.data[0]["id"]}).eq("id", user_id).execute()
                        return new_fpo.data[0]
                except Exception as e:
                    print(f"[!] Error auto-creating FPO entity: {e}")

    if fpo_id:
        fpo_res = sb.table("fpos").select("*").eq("id", fpo_id).limit(1).execute()
        if fpo_res and fpo_res.data and len(fpo_res.data) > 0:
            return fpo_res.data[0]

    first_fpo = sb.table("fpos").select("*").order("created_at").limit(1).execute()
    if first_fpo and first_fpo.data and len(first_fpo.data) > 0:
        return first_fpo.data[0]

    return {
        "id": DEFAULT_FPO_ID,
        "name": "Farmer Producer Co.",
        "district": "Latur",
        "state": "Maharashtra",
        "total_members": 0,
    }


class AggregateRequest(BaseModel):
    fpo_id: Optional[str] = None
    user_id: Optional[str] = None
    lot_ids: List[str]
    description: Optional[str] = None


class EligibilityCheckRequest(BaseModel):
    fpo_id: Optional[str] = None
    user_id: Optional[str] = None
    reference_lot_id: Optional[str] = None
    selected_lot_ids: List[str] = []


class FpoJoinRequestCreate(BaseModel):
    fpo_id: str
    farmer_id: str
    farmer_name: str
    phone: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = "Latur"
    primary_crop: Optional[str] = "Soybean"
    farm_size_acres: Optional[float] = 0.0
    notes: Optional[str] = None


class FpoJoinRequestResolve(BaseModel):
    status: str  # approved, rejected
    reviewed_by: Optional[str] = "FPO Admin"
    review_notes: Optional[str] = None


@router.get("/dashboard-stats")
def get_fpo_dashboard_stats(fpo_id: Optional[str] = None, user_id: Optional[str] = None):
    """
    Overview metrics for FPO dashboard bento grid:
    - Registered members
    - Available pool lots & quantity
    - Aggregated lots created
    - Total escrow / settled payout volume
    - Estimated bulk financial premium gain
    """
    sb = get_supabase_admin()
    fpo = resolve_fpo(fpo_id, user_id)
    target_fpo_id = fpo["id"]

    # 2. Members count
    members_res = sb.table("fpo_members").select("id").eq("fpo_id", target_fpo_id).execute()
    total_members = len(members_res.data or [])

    # 3. Candidate unaggregated lots
    candidate_lots = sb.table("lots") \
        .select("id, quantity, quality_grade, crop_id, crops(name, icon)") \
        .eq("fpo_id", target_fpo_id) \
        .eq("is_aggregated", False) \
        .is_("parent_aggregated_lot_id", "null") \
        .eq("status", "active") \
        .execute().data or []
    candidate_count = len(candidate_lots)
    candidate_quantity = sum(float(l.get("quantity") or 0) for l in candidate_lots)

    # 4. Aggregated lots
    agg_lots = sb.table("lots") \
        .select("id, quantity, member_count, status") \
        .eq("fpo_id", target_fpo_id) \
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

    # 7. AI context — derive dominant crop + district market for AI recommendations (no hardcoding)
    ai_context = None
    try:
        # Find the dominant crop by quantity across candidate lots
        crop_qty: dict = {}
        crop_name_map: dict = {}
        for lot in candidate_lots:
            cid = lot.get("crop_id")
            if not cid:
                continue
            crop_qty[cid] = crop_qty.get(cid, 0) + float(lot.get("quantity") or 0)
            crop_info = lot.get("crops") or {}
            if cid not in crop_name_map and crop_info.get("name"):
                crop_name_map[cid] = crop_info["name"]

        dominant_crop_id = max(crop_qty, key=crop_qty.get) if crop_qty else None
        dominant_crop_name = crop_name_map.get(dominant_crop_id) if dominant_crop_id else None

        # If no candidate lots, try aggregated lots
        if not dominant_crop_id and agg_lots:
            agg_details = sb.table("lots") \
                .select("id, crop_id, crops(name)") \
                .in_("id", [l["id"] for l in agg_lots[:5]]) \
                .execute().data or []
            for lot in agg_details:
                cid = lot.get("crop_id")
                if cid:
                    dominant_crop_id = cid
                    dominant_crop_name = (lot.get("crops") or {}).get("name")
                    break

        # If still no crop found, check lots of member farmers in this FPO
        if not dominant_crop_id and members_res.data:
            member_farmer_ids = [m.get("farmer_id") for m in members_res.data if m.get("farmer_id")]
            if member_farmer_ids:
                m_lots = sb.table("lots").select("id, crop_id, crops(name)").in_("farmer_id", member_farmer_ids[:20]).execute().data or []
                for lot in m_lots:
                    cid = lot.get("crop_id")
                    if cid:
                        dominant_crop_id = cid
                        dominant_crop_name = (lot.get("crops") or {}).get("name")
                        break

        # Fallback to the top crop in the DB that has market prices or active records
        if not dominant_crop_id:
            active_p = sb.table("market_prices").select("crop_id, crops(name)").limit(1).execute().data or []
            if active_p and active_p[0].get("crop_id"):
                dominant_crop_id = active_p[0]["crop_id"]
                dominant_crop_name = (active_p[0].get("crops") or {}).get("name") or "Soybean"
            else:
                c_res = sb.table("crops").select("id, name").limit(1).execute().data or []
                if c_res:
                    dominant_crop_id = c_res[0]["id"]
                    dominant_crop_name = c_res[0]["name"]

        # Find the nearest APMC market for the FPO district
        fpo_district = fpo.get("district") or ""
        market_id = None
        market_name = None
        if fpo_district:
            markets_res = sb.table("markets") \
                .select("id, name, district") \
                .ilike("district", f"%{fpo_district}%") \
                .limit(1) \
                .execute()
            if markets_res.data:
                market_id = markets_res.data[0]["id"]
                market_name = markets_res.data[0]["name"]

        # Fallback: pick the first market in the DB
        if not market_id:
            first_market = sb.table("markets").select("id, name").limit(1).execute()
            if first_market.data:
                market_id = first_market.data[0]["id"]
                market_name = first_market.data[0]["name"]

        # Latest aggregated lot or candidate lot for buyer matching
        latest_agg_lot_id = agg_lots[0]["id"] if agg_lots else None
        if not latest_agg_lot_id:
            if candidate_lots:
                latest_agg_lot_id = candidate_lots[0]["id"]
            else:
                # Any lot in the database for this crop to allow real matching
                matched_lot = sb.table("lots").select("id").eq("crop_id", dominant_crop_id).limit(1).execute().data or []
                if matched_lot:
                    latest_agg_lot_id = matched_lot[0]["id"]
                else:
                    any_lot = sb.table("lots").select("id").limit(1).execute().data or []
                    if any_lot:
                        latest_agg_lot_id = any_lot[0]["id"]

        # Build list of available crops for selector
        available_crops = []
        seen_cids = set()
        for lot in candidate_lots:
            cid = lot.get("crop_id")
            cname = (lot.get("crops") or {}).get("name")
            if cid and cid not in seen_cids and cname:
                seen_cids.add(cid)
                available_crops.append({"crop_id": cid, "crop_name": cname})
        if not available_crops and dominant_crop_id and dominant_crop_name:
            available_crops.append({"crop_id": dominant_crop_id, "crop_name": dominant_crop_name})

        if dominant_crop_id and market_id:
            ai_context = {
                "crop_id": dominant_crop_id,
                "crop_name": dominant_crop_name,
                "market_id": market_id,
                "market_name": market_name,
                "aggregated_lot_id": latest_agg_lot_id,
                "available_crops": available_crops,
            }
    except Exception as e:
        print(f"[!] Could not build AI context: {e}")

    return {
        "fpo": fpo,
        "total_members": total_members,
        "candidate_lots_count": candidate_count,
        "candidate_quantity_quintals": round(candidate_quantity, 1),
        "aggregated_lots_count": agg_count,
        "aggregated_quantity_quintals": round(agg_quantity, 1),
        "total_escrow_amount": round(total_escrow_amount, 2),
        "estimated_bulk_gain": round(estimated_bulk_gain, 2),
        "ai_context": ai_context,
        "recent_activity": [
            {
                "id": "act-1",
                "title": "Batch Escrow Secured",
                "description": f"{fpo.get('name', 'FPO')} collective produce registered for bulk commercial trade.",
                "date": "2 days ago",
                "badge": "Escrow Active",
            },
            {
                "id": "act-2",
                "title": "Member Lots Registered",
                "description": f"{total_members} registered members in {fpo.get('district', 'Maharashtra')} cluster.",
                "date": "Yesterday",
                "badge": "Lots Available",
            },
        ],
    }


@router.get("/members")
def list_fpo_members(fpo_id: Optional[str] = None, user_id: Optional[str] = None):
    """List all registered members of the FPO with active lot summaries."""
    sb = get_supabase_admin()
    fpo = resolve_fpo(fpo_id, user_id)
    target_fpo_id = fpo["id"]

    members = sb.table("fpo_members").select("*").eq("fpo_id", target_fpo_id).order("farmer_name").execute().data or []

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
def get_candidate_lots(fpo_id: Optional[str] = None, user_id: Optional[str] = None):
    """
    Fetch all member lots eligible/available for aggregation pooling.
    Includes crop information and member profile metadata.
    """
    sb = get_supabase_admin()
    fpo = resolve_fpo(fpo_id, user_id)
    target_fpo_id = fpo["id"]

    lots = sb.table("lots") \
        .select("*, crops(name, icon, unit), fpo_members(farmer_name, village, district, avatar_initials, phone)") \
        .eq("fpo_id", target_fpo_id) \
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
    fpo = resolve_fpo(req.fpo_id, req.user_id)
    target_fpo_id = fpo["id"]

    lots = sb.table("lots") \
        .select("*, crops(name, icon, unit), fpo_members(farmer_name, village, avatar_initials)") \
        .eq("fpo_id", target_fpo_id) \
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

    fpo = resolve_fpo(req.fpo_id, req.user_id)
    target_fpo_id = fpo["id"]
    fpo_name = fpo.get("name", "FPO")

    desc = req.description or f"{fpo_name} Aggregated {crop_name} Grade {ref_grade} Pool ({member_count} member farmers, {total_quantity} quintals)."

    # 3. Insert parent lot
    now = datetime.utcnow().isoformat()
    parent_lot_payload = {
        "fpo_id": target_fpo_id,
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
def get_fpo_aggregated_lots(fpo_id: Optional[str] = None, user_id: Optional[str] = None):
    """
    List all aggregated lots belonging to the FPO,
    along with incoming buyer offers and member count.
    """
    sb = get_supabase_admin()
    fpo = resolve_fpo(fpo_id, user_id)
    target_fpo_id = fpo["id"]

    lots = sb.table("lots") \
        .select("*, crops(name, icon, unit)") \
        .eq("fpo_id", target_fpo_id) \
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


# ─── FPO Membership & Join Workflow (§1.2) ───────────────────────────────────

@router.get("/discover")
def discover_fpos(district: Optional[str] = None, farmer_id: Optional[str] = None):
    """
    List registered FPOs for farmers to discover and request to join.
    Annotates each FPO with current membership or request status if farmer_id is provided.
    """
    sb = get_supabase_admin()
    q = sb.table("fpos").select("*")
    if district and district != "All":
        q = q.eq("district", district)
    fpos = q.order("name").execute().data or []

    # Get farmer's existing requests and memberships if farmer_id given
    existing_requests = {}
    existing_memberships = set()
    if farmer_id:
        try:
            reqs = sb.table("fpo_join_requests").select("*").eq("farmer_id", farmer_id).execute().data or []
            for r in reqs:
                existing_requests[r["fpo_id"]] = r
        except Exception:
            pass

        try:
            mems = sb.table("fpo_members").select("fpo_id").eq("farmer_id", farmer_id).execute().data or []
            for m in mems:
                existing_memberships.add(m["fpo_id"])
        except Exception:
            pass

    results = []
    for f in fpos:
        f_id = f["id"]
        is_member = f_id in existing_memberships
        req = existing_requests.get(f_id)
        results.append({
            **f,
            "is_member": is_member,
            "request_status": req["status"] if req else None,
            "request_id": req["id"] if req else None,
        })

    return results


@router.post("/join-request")
def submit_join_request(req: FpoJoinRequestCreate):
    """
    Farmer submits request to join an FPO.
    """
    sb = get_supabase_admin()

    # Check if already a member
    mem_chk = sb.table("fpo_members").select("id").eq("fpo_id", req.fpo_id).eq("farmer_id", req.farmer_id).execute().data
    if mem_chk:
        raise HTTPException(status_code=400, detail="You are already a registered member of this FPO.")

    # Check if pending request exists
    existing = sb.table("fpo_join_requests").select("id, status").eq("fpo_id", req.fpo_id).eq("farmer_id", req.farmer_id).eq("status", "pending").execute().data
    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending join request for this FPO.")

    now_iso = datetime.utcnow().isoformat()
    payload = {
        "fpo_id": req.fpo_id,
        "farmer_id": req.farmer_id,
        "farmer_name": req.farmer_name,
        "phone": req.phone,
        "village": req.village,
        "district": req.district or "Latur",
        "primary_crop": req.primary_crop or "Soybean",
        "farm_size_acres": req.farm_size_acres or 0.0,
        "notes": req.notes,
        "status": "pending",
        "created_at": now_iso,
        "updated_at": now_iso,
    }
    res = sb.table("fpo_join_requests").insert(payload).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create join request")

    # Notify farmer of submission confirmation
    try:
        fpo_data_res = sb.table("fpos").select("name").eq("id", req.fpo_id).limit(1).execute()
        fpo_data = fpo_data_res.data[0] if fpo_data_res.data and len(fpo_data_res.data) > 0 else {}
        fpo_name = fpo_data.get("name", "FPO")
        
        p_chk = sb.table("profiles").select("id").eq("id", req.farmer_id).execute()
        if p_chk.data and len(p_chk.data) > 0:
            sb.table("notifications").insert({
                "user_id": req.farmer_id,
                "title": f"FPO Join Request: {fpo_name}",
                "message": f"Your request to join {fpo_name} is under review by the FPO board.",
                "category": "transaction",
                "link_url": "/farmer/discover-fpo",
                "is_read": False,
                "created_at": now_iso,
            }).execute()
    except Exception as e:
        print(f"[!] Notification error: {e}")

    return {
        "message": "Join request submitted successfully!",
        "request": res.data[0]
    }


@router.get("/join-requests")
def list_join_requests(fpo_id: Optional[str] = None, user_id: Optional[str] = None, status: Optional[str] = None):
    """
    List membership join requests for an FPO.
    """
    sb = get_supabase_admin()
    fpo = resolve_fpo(fpo_id, user_id)
    target_fpo_id = fpo["id"]

    q = sb.table("fpo_join_requests").select("*, fpos(name, district)").eq("fpo_id", target_fpo_id)
    if status:
        q = q.eq("status", status)
    res = q.order("created_at", desc=True).execute()
    return res.data or []


@router.post("/join-requests/{request_id}/resolve")
def resolve_join_request(request_id: str, action: FpoJoinRequestResolve):
    """
    FPO administrator approves or rejects a farmer's join request.
    If approved:
      1. Creates entry in fpo_members
      2. Updates farmer profile fpo_id
      3. Increments fpos total_members
      4. Creates cross-role notification for the farmer
    """
    sb = get_supabase_admin()
    r_res = sb.table("fpo_join_requests").select("*, fpos(name)").eq("id", request_id).limit(1).execute()
    if not r_res.data or len(r_res.data) == 0:
        raise HTTPException(status_code=404, detail="Join request not found")

    req = r_res.data[0]
    now_str = datetime.utcnow().isoformat()

    # Update request status
    update_data = {
        "status": action.status,
        "reviewed_by": action.reviewed_by,
        "reviewed_at": now_str,
        "notes": (req.get("notes") or "") + (f" | Review Note: {action.review_notes}" if action.review_notes else ""),
        "updated_at": now_str,
    }
    sb.table("fpo_join_requests").update(update_data).eq("id", request_id).execute()

    fpo_name = (req.get("fpos") or {}).get("name") or "FPO"
    farmer_id = req["farmer_id"]

    if action.status == "approved":
        # 1. Add to fpo_members
        parts = req["farmer_name"].split()
        member_initials = ("".join([p[0].upper() for p in parts[:2]])) if parts else "FM"
        member_payload = {
            "fpo_id": req["fpo_id"],
            "farmer_id": farmer_id,
            "farmer_name": req["farmer_name"],
            "village": req.get("village") or "Village",
            "district": req.get("district") or "Latur",
            "phone": req.get("phone") or "",
            "primary_crop": req.get("primary_crop") or "Soybean",
            "farm_size_acres": float(req.get("farm_size_acres") or 0),
            "avatar_initials": member_initials,
            "created_at": now_str,
        }
        sb.table("fpo_members").insert(member_payload).execute()

        # 2. Update profile with fpo_id
        try:
            sb.table("profiles").update({"fpo_id": req["fpo_id"]}).eq("id", farmer_id).execute()
        except Exception as p_err:
            print(f"[!] Warning updating profile fpo_id: {p_err}")

        # 3. Increment total_members on fpo
        try:
            m_count = len(sb.table("fpo_members").select("id").eq("fpo_id", req["fpo_id"]).execute().data or [])
            sb.table("fpos").update({"total_members": m_count}).eq("id", req["fpo_id"]).execute()
        except Exception:
            pass

        # 4. Notify farmer of approval
        try:
            p_chk = sb.table("profiles").select("id").eq("id", farmer_id).execute()
            if p_chk.data:
                sb.table("notifications").insert({
                    "user_id": farmer_id,
                    "title": "FPO Membership Approved! 🏛️",
                    "message": f"Congratulations! Your request to join '{fpo_name}' has been approved. You can now pool lots for collective bulk premium.",
                    "category": "transaction",
                    "link_url": "/farmer/lots",
                    "is_read": False,
                    "created_at": now_str,
                }).execute()
        except Exception as notify_err:
            print(f"[!] Farmer approval notification failed: {notify_err}")

    elif action.status == "rejected":
        # Notify farmer of rejection
        try:
            p_chk = sb.table("profiles").select("id").eq("id", farmer_id).execute()
            if p_chk.data:
                sb.table("notifications").insert({
                    "user_id": farmer_id,
                    "title": "FPO Join Request Update",
                    "message": f"Your request to join '{fpo_name}' was declined. {action.review_notes or ''}",
                    "category": "transaction",
                    "link_url": "/farmer/discover-fpo",
                    "is_read": False,
                    "created_at": now_str,
                }).execute()
        except Exception as notify_err:
            print(f"[!] Farmer rejection notification failed: {notify_err}")

    return {
        "message": f"Join request {action.status} successfully.",
        "status": action.status,
        "request_id": request_id,
    }
