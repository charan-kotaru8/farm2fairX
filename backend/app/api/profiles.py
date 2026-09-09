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
    """Get a user's profile by their Supabase auth user_id."""
    sb = get_supabase_admin()
    res = sb.table("profiles").select("*").eq("id", user_id).maybeSingle().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return res.data


@router.patch("/profiles/{user_id}")
def update_profile(user_id: str, updates: ProfileUpdate):
    """Update a user's profile fields."""
    sb = get_supabase_admin()

    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_data["updated_at"] = datetime.utcnow().isoformat()

    res = sb.table("profiles").update(update_data).eq("id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Profile not found or no changes made")
    return res.data[0]


@router.get("/profiles/districts/maharashtra")
def get_maharashtra_districts():
    """Return list of Maharashtra districts for the profile form dropdown."""
    return {"districts": MAHARASHTRA_DISTRICTS}
