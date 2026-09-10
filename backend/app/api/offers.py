from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.core.supabase_client import get_supabase_admin
from app.buyers.verification import recompute_verification_tier

router = APIRouter()


class OfferCreate(BaseModel):
    lot_id: str
    buyer_id: str
    price_per_quintal: float
    offered_quantity: float
    payment_terms: str = "Immediate UPI"  # Immediate UPI, Escrow on delivery, Net 7 Days, Advance 50%
    pickup_terms: str = "Farmgate Pickup" # Farmgate Pickup, Delivered to APMC, Buyer Warehouse
    valid_until: Optional[str] = None
    notes: Optional[str] = None


class OfferRejectRequest(BaseModel):
    rejection_reason: Optional[str] = "Price does not meet farmer expectation"


@router.get("/offers")
def list_offers(
    lot_id: Optional[str] = None,
    buyer_id: Optional[str] = None,
    status: Optional[str] = None
):
    """
    List offers with buyer details and verification tier badges.
    Can filter by lot_id (for farmer's lot view) or buyer_id (for buyer's portal).
    """
    sb = get_supabase_admin()
    q = sb.table("buyer_offers").select(
        "*, buyers(business_name, verification_tier, avg_rating, completed_transactions, city, district, contact_person, phone), lots(quantity, quality_grade, harvest_date, status, crops(name, icon, unit))"
    )
    if lot_id:
        q = q.eq("lot_id", lot_id)
    if buyer_id:
        q = q.eq("buyer_id", buyer_id)
    if status:
        q = q.eq("status", status)
        
    res = q.order("price_per_quintal", desc=True).execute()
    return res.data


@router.post("/offers")
def submit_offer(offer: OfferCreate):
    """
    Submit a digital offer on an active lot.
    Checks buyer verification status (Verified/Trusted can offer).
    """
    sb = get_supabase_admin()
    
    # 1. Check buyer verification tier
    b_res = sb.table("buyers").select("verification_tier, verification_status, business_name").eq("id", offer.buyer_id).limit(1).execute()
    if not b_res.data or len(b_res.data) == 0:
        raise HTTPException(status_code=404, detail="Buyer not found")
        
    buyer = b_res.data[0]
    if buyer.get("verification_status") != "approved":
        raise HTTPException(
            status_code=403, 
            detail="Your account is pending admin verification. Only verified buyers can submit offers to farmers."
        )
        
    # 2. Check lot exists and is open for offers
    lot_res = sb.table("lots").select("status").eq("id", offer.lot_id).limit(1).execute()
    if not lot_res.data or len(lot_res.data) == 0:
        raise HTTPException(status_code=404, detail="Lot not found")
        
    if lot_res.data[0].get("status") in ["offer_accepted", "completed"]:
        raise HTTPException(status_code=400, detail="This lot has already accepted an offer.")

    # 3. Create offer
    payload = offer.model_dump()
    payload["status"] = "submitted"
    payload["created_at"] = datetime.utcnow().isoformat()
    payload["updated_at"] = datetime.utcnow().isoformat()
    
    res = sb.table("buyer_offers").insert(payload).execute()
    
    # 4. Update lot status to 'offer_received' if currently 'active' or 'draft'
    sb.table("lots").update({
        "status": "offer_received",
        "updated_at": datetime.utcnow().isoformat()
    }).eq("id", offer.lot_id).execute()

    # 5. Notify farmer of the new offer
    try:
        lot_farmer_res = sb.table("lots").select("farmer_id, crops(name)").eq("id", offer.lot_id).limit(1).execute()
        lot_farmer = lot_farmer_res.data[0] if lot_farmer_res.data and len(lot_farmer_res.data) > 0 else None
        farmer_id = lot_farmer.get("farmer_id") if lot_farmer else None
        crop_info = (lot_farmer.get("crops") or {}).get("name", "produce") if lot_farmer else "produce"

        if farmer_id:
            p_chk = sb.table("profiles").select("id").eq("id", farmer_id).execute()
            if p_chk.data and len(p_chk.data) > 0:
                sb.table("notifications").insert({
                    "user_id": farmer_id,
                    "title": f"New Offer: ₹{offer.price_per_quintal}/q",
                    "message": f"{buyer.get('business_name', 'A verified buyer')} submitted an offer for {offer.offered_quantity} quintals of {crop_info}.",
                    "category": "transaction",
                    "link_url": "/farmer/lots",
                    "is_read": False,
                    "created_at": datetime.utcnow().isoformat(),
                }).execute()
    except Exception as notify_err:
        print(f"[!] Farmer notification failed: {notify_err}")
    
    return res.data[0] if res.data else {"message": "Offer submitted successfully"}


@router.post("/offers/{offer_id}/accept")
def accept_offer(offer_id: str):
    """
    Farmer accepts an offer.
    Lifecycle updates:
      - Accepted offer -> status = 'accepted'
      - Associated lot -> status = 'offer_accepted'
      - Competing submitted offers on the same lot -> status = 'rejected'
      - Recomputes buyer tier (adds deal progress)
    """
    sb = get_supabase_admin()
    
    # Fetch offer
    o_res = sb.table("buyer_offers").select("*").eq("id", offer_id).limit(1).execute()
    if not o_res.data or len(o_res.data) == 0:
        raise HTTPException(status_code=404, detail="Offer not found")
        
    offer = o_res.data[0]
    lot_id = offer["lot_id"]
    buyer_id = offer["buyer_id"]
    
    # 1. Accept this offer
    sb.table("buyer_offers").update({
        "status": "accepted",
        "updated_at": datetime.utcnow().isoformat()
    }).eq("id", offer_id).execute()
    
    # 2. Update lot status to offer_accepted
    sb.table("lots").update({
        "status": "offer_accepted",
        "updated_at": datetime.utcnow().isoformat()
    }).eq("id", lot_id).execute()
    
    # 3. Reject all other submitted offers for this lot
    other_offers = sb.table("buyer_offers").select("id").eq("lot_id", lot_id).neq("id", offer_id).eq("status", "submitted").execute().data or []
    for other in other_offers:
        sb.table("buyer_offers").update({
            "status": "rejected",
            "rejection_reason": "Another competing offer was accepted by the farmer",
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", other["id"]).execute()
        
    # 4. Update buyer completed transactions counter and recompute tier
    buyer_row_res = sb.table("buyers").select("completed_transactions").eq("id", buyer_id).limit(1).execute()
    buyer_row = buyer_row_res.data[0] if buyer_row_res.data and len(buyer_row_res.data) > 0 else {}
    new_tx_count = (buyer_row.get("completed_transactions") or 0) + 1
    sb.table("buyers").update({"completed_transactions": new_tx_count}).eq("id", buyer_id).execute()
    
    tier_info = recompute_verification_tier(buyer_id)

    # 5. If aggregated lot, calculate and update member payout shares in escrow
    lot_data_res = sb.table("lots").select("is_aggregated, quantity").eq("id", lot_id).limit(1).execute()
    lot_data = lot_data_res.data[0] if lot_data_res.data and len(lot_data_res.data) > 0 else {}
    fpo_updated = False
    if lot_data.get("is_aggregated"):
        tx_members = sb.table("fpo_transaction_members").select("*").eq("lot_id", lot_id).execute().data or []
        price_per_q = float(offer["price_per_quintal"])
        for tm in tx_members:
            contributed_qty = float(tm.get("contributed_quantity") or 0)
            share_amt = round(contributed_qty * price_per_q, 2)
            sb.table("fpo_transaction_members").update({
                "offer_id": offer_id,
                "price_per_quintal": price_per_q,
                "share_amount": share_amt,
                "payout_status": "escrow",
            }).eq("id", tm["id"]).execute()
        fpo_updated = True

    # 6. Cross-role notification: Notify accepted buyer
    try:
        buyer_info_res = sb.table("buyers").select("profile_id, business_name").eq("id", buyer_id).limit(1).execute()
        buyer_info = buyer_info_res.data[0] if buyer_info_res.data and len(buyer_info_res.data) > 0 else {}
        buyer_profile_id = buyer_info.get("profile_id")
        if buyer_profile_id:
            p_chk = sb.table("profiles").select("id").eq("id", buyer_profile_id).execute()
            if p_chk.data and len(p_chk.data) > 0:
                sb.table("notifications").insert({
                    "user_id": buyer_profile_id,
                    "title": f"Offer Accepted! (₹{offer['price_per_quintal']}/q)",
                    "message": f"Farmer accepted your offer of ₹{offer['price_per_quintal']}/q. Escrow and logistics are ready to schedule.",
                    "category": "transaction",
                    "link_url": "/buyer/marketplace",
                    "is_read": False,
                    "created_at": datetime.utcnow().isoformat(),
                }).execute()
    except Exception as notify_err:
        print(f"[!] Accepted buyer notification failed: {notify_err}")

    # 7. Notify competing buyers of closure
    try:
        for other in other_offers:
            other_data_res = sb.table("buyer_offers").select("buyer_id, price_per_quintal").eq("id", other["id"]).limit(1).execute()
            other_data = other_data_res.data[0] if other_data_res.data and len(other_data_res.data) > 0 else {}
            if other_data:
                comp_buyer_id = other_data.get("buyer_id")
                comp_buyer_info_res = sb.table("buyers").select("profile_id").eq("id", comp_buyer_id).limit(1).execute()
                comp_buyer_info = comp_buyer_info_res.data[0] if comp_buyer_info_res.data and len(comp_buyer_info_res.data) > 0 else {}
                comp_profile_id = comp_buyer_info.get("profile_id")
                if comp_profile_id:
                    p_chk = sb.table("profiles").select("id").eq("id", comp_profile_id).execute()
                    if p_chk.data and len(p_chk.data) > 0:
                        sb.table("notifications").insert({
                            "user_id": comp_profile_id,
                            "title": "Offer Not Selected",
                            "message": "Another competing offer was accepted by the farmer for this lot.",
                            "category": "transaction",
                            "link_url": "/buyer/marketplace",
                            "is_read": False,
                            "created_at": datetime.utcnow().isoformat(),
                        }).execute()
    except Exception as comp_err:
        print(f"[!] Competing buyer notification failed: {comp_err}")
    
    return {
        "message": "Offer accepted successfully! Lot marked as offer_accepted.",
        "accepted_offer_id": offer_id,
        "lot_id": lot_id,
        "rejected_competing_count": len(other_offers),
        "buyer_tier_info": tier_info,
        "fpo_payouts_updated": fpo_updated,
    }


@router.post("/offers/{offer_id}/reject")
def reject_offer(offer_id: str, req: OfferRejectRequest):
    """Farmer rejects an offer gracefully with reason."""
    sb = get_supabase_admin()
    
    existing_offer_res = sb.table("buyer_offers").select("buyer_id, price_per_quintal, lot_id").eq("id", offer_id).limit(1).execute()
    if not existing_offer_res.data or len(existing_offer_res.data) == 0:
        raise HTTPException(status_code=404, detail="Offer not found")

    existing_offer = existing_offer_res.data[0]

    res = sb.table("buyer_offers").update({
        "status": "rejected",
        "rejection_reason": req.rejection_reason,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("id", offer_id).execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Offer not found")

    # Cross-role notification: Notify buyer of rejection
    buyer_id = existing_offer.get("buyer_id")
    if buyer_id:
        try:
            buyer_info_res = sb.table("buyers").select("profile_id").eq("id", buyer_id).limit(1).execute()
            buyer_info = buyer_info_res.data[0] if buyer_info_res.data and len(buyer_info_res.data) > 0 else {}
            buyer_profile_id = buyer_info.get("profile_id")
            if buyer_profile_id:
                p_chk = sb.table("profiles").select("id").eq("id", buyer_profile_id).execute()
                if p_chk.data and len(p_chk.data) > 0:
                    sb.table("notifications").insert({
                        "user_id": buyer_profile_id,
                        "title": "Offer Declined by Farmer",
                        "message": f"Your offer of ₹{existing_offer.get('price_per_quintal')}/q was declined. Reason: {req.rejection_reason}",
                        "category": "transaction",
                        "link_url": "/buyer/marketplace",
                        "is_read": False,
                        "created_at": datetime.utcnow().isoformat(),
                    }).execute()
        except Exception as notify_err:
            print(f"[!] Buyer rejection notification failed: {notify_err}")
        
    return {
        "message": "Offer rejected.",
        "offer": res.data[0]
    }
