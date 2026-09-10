from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.core.supabase_client import get_supabase_admin
from app.buyers.verification import recompute_verification_tier

router = APIRouter()


class BuyerProfileUpdate(BaseModel):
    business_name: str
    business_type: str = "Trader"
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = "Pune"
    document_url: Optional[str] = None


class AdminVerifyRequest(BaseModel):
    verification_status: str  # approved, more_info_requested, rejected
    business_info_verified: bool = True
    location_verified: bool = True
    document_verified: bool = True
    admin_note: Optional[str] = None


class BuyerRequirementCreate(BaseModel):
    buyer_id: str
    crop_id: str
    quantity_quintals: float
    quality_grade: str = "A"
    preferred_district: Optional[str] = "Any"
    max_price_per_quintal: Optional[float] = None
    notes: Optional[str] = None


@router.get("/buyers")
def list_buyers(
    status: Optional[str] = None,
    tier: Optional[str] = None,
    district: Optional[str] = None
):
    """List buyers, with optional filters for verification status or tier."""
    sb = get_supabase_admin()
    q = sb.table("buyers").select("*")
    if status:
        q = q.eq("verification_status", status)
    if tier:
        q = q.eq("verification_tier", tier)
    if district:
        q = q.eq("district", district)
    res = q.order("created_at", desc=True).execute()
    return res.data


@router.get("/buyers/{buyer_id}")
def get_buyer(buyer_id: str):
    """Get single buyer details and live tier evaluation."""
    sb = get_supabase_admin()
    res = sb.table("buyers").select("*").eq("id", buyer_id).limit(1).execute()
    if not res.data or len(res.data) == 0:
        raise HTTPException(status_code=404, detail="Buyer not found")
    
    tier_info = recompute_verification_tier(buyer_id)
    return {
        "buyer": res.data[0],
        "tier_computation": tier_info
    }


@router.post("/buyers/profile")
def upsert_buyer_profile(profile: BuyerProfileUpdate, buyer_id: Optional[str] = None):
    """Create or update buyer business profile."""
    sb = get_supabase_admin()
    payload = profile.model_dump()
    payload["updated_at"] = datetime.utcnow().isoformat()
    
    if buyer_id:
        res = sb.table("buyers").update(payload).eq("id", buyer_id).execute()
        updated = res.data[0] if res.data else None
    else:
        payload["verification_tier"] = "basic"
        payload["verification_status"] = "pending"
        res = sb.table("buyers").insert(payload).execute()
        updated = res.data[0] if res.data else None
        
    return updated


@router.post("/buyers/{buyer_id}/verify")
def verify_buyer(buyer_id: str, action: AdminVerifyRequest):
    """Admin endpoint to approve, request more info, or reject buyer verification."""
    sb = get_supabase_admin()
    
    # Check buyer exists
    b_res = sb.table("buyers").select("id").eq("id", buyer_id).limit(1).execute()
    if not b_res.data or len(b_res.data) == 0:
        raise HTTPException(status_code=404, detail="Buyer not found")
        
    update_data = {
        "verification_status": action.verification_status,
        "business_info_verified": action.business_info_verified,
        "location_verified": action.location_verified,
        "document_verified": action.document_verified,
        "admin_note": action.admin_note,
        "updated_at": datetime.utcnow().isoformat()
    }
    
    sb.table("buyers").update(update_data).eq("id", buyer_id).execute()
    
    # Run tier recomputation logic
    tier_result = recompute_verification_tier(buyer_id)
    
    # Return updated buyer
    fresh_buyer = sb.table("buyers").select("*").eq("id", buyer_id).limit(1).execute()
    buyer_row = fresh_buyer.data[0] if fresh_buyer.data and len(fresh_buyer.data) > 0 else {}

    # Cross-role notification: Notify buyer of KYC verification update
    buyer_profile_id = buyer_row.get("profile_id")
    if buyer_profile_id:
        try:
            status_title = action.verification_status.replace("_", " ").title()
            p_chk = sb.table("profiles").select("id").eq("id", buyer_profile_id).execute()
            if p_chk.data:
                sb.table("notifications").insert({
                    "user_id": buyer_profile_id,
                    "title": f"KYC Verification: {status_title}",
                    "message": f"Your business verification status is now '{status_title}'. Current Tier: {tier_result.get('new_tier', 'basic').title()}.",
                    "category": "verification",
                    "link_url": "/buyer/marketplace",
                    "is_read": False,
                    "created_at": datetime.utcnow().isoformat(),
                }).execute()
        except Exception as notify_err:
            print(f"[!] Buyer KYC notification failed: {notify_err}")

    return {
        "message": f"Buyer status updated to '{action.verification_status}'",
        "buyer": fresh_buyer.data,
        "tier_result": tier_result
    }


@router.post("/buyers/{buyer_id}/recompute-tier")
def trigger_recompute_tier(buyer_id: str):
    """Explicitly trigger tier recomputation for a buyer."""
    try:
        result = recompute_verification_tier(buyer_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ─── Buyer Requirements ──────────────────────────────────────
@router.get("/buyer-requirements")
def list_buyer_requirements(
    crop_id: Optional[str] = None,
    buyer_id: Optional[str] = None,
    status: Optional[str] = "open"
):
    """List buyer requirements with crop and buyer details."""
    sb = get_supabase_admin()
    q = sb.table("buyer_requirements").select("*, crops(name, icon, unit), buyers(business_name, verification_tier, avg_rating, city, district)")
    if crop_id:
        q = q.eq("crop_id", crop_id)
    if buyer_id:
        q = q.eq("buyer_id", buyer_id)
    if status:
        q = q.eq("status", status)
    res = q.order("created_at", desc=True).execute()
    return res.data


@router.post("/buyer-requirements")
def create_buyer_requirement(req: BuyerRequirementCreate):
    """Post a new procurement requirement."""
    sb = get_supabase_admin()
    payload = req.model_dump()
    payload["status"] = "open"
    payload["created_at"] = datetime.utcnow().isoformat()
    payload["updated_at"] = datetime.utcnow().isoformat()
    res = sb.table("buyer_requirements").insert(payload).execute()
    return res.data[0] if res.data else {"message": "Requirement created"}
