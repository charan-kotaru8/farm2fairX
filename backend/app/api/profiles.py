"""
User Profile API.
Allows authenticated users to read and update their own profile data
(full_name, district, phone, state, etc.) stored in the `profiles` table.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.core.supabase_client import get_supabase_admin

router = APIRouter()

MAHARASHTRA_DISTRICTS = [
    "Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara",
    "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli",
    "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban",
    "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar",
    "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara",
    "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"
]


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    village: Optional[str] = None
    land_acres: Optional[float] = None
    primary_crop: Optional[str] = None


@router.get("/profiles/{user_id}")
def get_profile(user_id: str):
    """Get a user's profile by their Supabase auth user_id, enriched with role-specific data."""
    sb = get_supabase_admin()
    res = sb.table("profiles").select("*").eq("id", user_id).limit(1).execute()
    if not res.data or len(res.data) == 0:
        raise HTTPException(status_code=404, detail="Profile not found")
    profile = res.data[0]
    role = profile.get("role", "farmer")
    role_data = None

    # Join role-specific table
    if role == "buyer":
        buyer_res = sb.table("buyers").select("*").eq("profile_id", user_id).limit(1).execute()
        if buyer_res.data and len(buyer_res.data) > 0:
            role_data = buyer_res.data[0]
    elif role == "fpo":
        fpo_res = sb.table("fpos").select("*").eq("profile_id", user_id).limit(1).execute()
        if fpo_res.data and len(fpo_res.data) > 0:
            role_data = fpo_res.data[0]

    return {"profile": profile, "role_data": role_data}


class BuyerRoleUpdate(BaseModel):
    business_name: Optional[str] = None
    business_type: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None


class FpoRoleUpdate(BaseModel):
    name: Optional[str] = None
    registration_number: Optional[str] = None
    contact_person: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class FullProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    village: Optional[str] = None
    land_acres: Optional[float] = None
    primary_crop: Optional[str] = None
    buyer_data: Optional[BuyerRoleUpdate] = None
    fpo_data: Optional[FpoRoleUpdate] = None


@router.patch("/profiles/{user_id}")
def update_profile(user_id: str, updates: FullProfileUpdate):
    """Update a user's profile fields and role-specific table in one call."""
    sb = get_supabase_admin()

    # --- Base profile update ---
    profile_fields = {"full_name", "phone", "district", "state", "village", "land_acres", "primary_crop"}
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None and k in profile_fields}

    now_iso = datetime.utcnow().isoformat()
    if update_data:
        update_data["updated_at"] = now_iso
        check_res = sb.table("profiles").select("id, role").eq("id", user_id).limit(1).execute()
        if check_res.data and len(check_res.data) > 0:
            sb.table("profiles").update(update_data).eq("id", user_id).execute()
        else:
            update_data["id"] = user_id
            update_data["role"] = "farmer"
            sb.table("profiles").insert(update_data).execute()

    # --- Role-specific table update ---
    prof_res = sb.table("profiles").select("role").eq("id", user_id).limit(1).execute()
    role = prof_res.data[0]["role"] if prof_res.data else "farmer"

    if role == "buyer" and updates.buyer_data:
        buyer_update = {k: v for k, v in updates.buyer_data.model_dump().items() if v is not None}
        if buyer_update:
            buyer_update["updated_at"] = now_iso
            existing = sb.table("buyers").select("id").eq("profile_id", user_id).limit(1).execute()
            if existing.data and len(existing.data) > 0:
                sb.table("buyers").update(buyer_update).eq("profile_id", user_id).execute()
            else:
                buyer_update["profile_id"] = user_id
                buyer_update["verification_status"] = "pending"
                buyer_update["verification_tier"] = "basic"
                if "business_name" not in buyer_update:
                    buyer_update["business_name"] = updates.full_name or "Business"
                sb.table("buyers").insert(buyer_update).execute()

    elif role == "fpo" and updates.fpo_data:
        fpo_update = {k: v for k, v in updates.fpo_data.model_dump().items() if v is not None}
        if fpo_update:
            existing = sb.table("fpos").select("id").eq("profile_id", user_id).limit(1).execute()
            if existing.data and len(existing.data) > 0:
                sb.table("fpos").update(fpo_update).eq("profile_id", user_id).execute()
            else:
                fpo_update["profile_id"] = user_id
                if "name" not in fpo_update:
                    fpo_update["name"] = updates.full_name or "FPO"
                fpo_update["state"] = fpo_update.get("state", "Maharashtra")
                fpo_update["total_members"] = 0
                sb.table("fpos").insert(fpo_update).execute()

    # Return enriched profile
    return get_profile(user_id)


@router.get("/profiles/districts/maharashtra")
def get_maharashtra_districts():
    """Return list of Maharashtra districts for backward compatibility."""
    return {"districts": MAHARASHTRA_DISTRICTS}


@router.get("/profiles/districts")
def get_districts(state: Optional[str] = None):
    """Return real districts for any Indian state from canonical geography data."""
    import json
    from pathlib import Path
    geo_path = Path(__file__).resolve().parent.parent / "data" / "indian_states_districts.json"
    if geo_path.exists():
        try:
            with open(geo_path, "r", encoding="utf-8") as f:
                geo = json.load(f)
                if state:
                    # Match case-insensitively
                    for k, v in geo.items():
                        if k.lower() == state.strip().lower():
                            return {"state": k, "districts": v}
                    return {"state": state, "districts": []}
                return {"states": sorted(geo.keys()), "districts_by_state": geo}
        except Exception:
            pass
    return {"state": state or "Maharashtra", "districts": MAHARASHTRA_DISTRICTS}
