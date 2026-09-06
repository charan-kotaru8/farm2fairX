from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.core.supabase_client import get_supabase_admin

router = APIRouter()


class LotCreate(BaseModel):
    crop_id: str
    quantity: float
    quality_grade: str = "A"
    harvest_date: Optional[str] = None
    available_from: Optional[str] = None
    available_until: Optional[str] = None
    storage_required: bool = False
    description: Optional[str] = None


@router.get("/lots")
def list_lots(farmer_id: Optional[str] = None, status: Optional[str] = None):
    """List lots, optionally filtered by farmer or status."""
    sb = get_supabase_admin()
    q = sb.table("lots").select("*, crops(name, icon)")
    if farmer_id:
        q = q.eq("farmer_id", farmer_id)
    if status:
        q = q.eq("status", status)
    res = q.order("created_at", desc=True).execute()
    return res.data


@router.get("/lots/{lot_id}")
def get_lot(lot_id: str):
    """Get a single lot by ID."""
    sb = get_supabase_admin()
    res = sb.table("lots").select("*, crops(name, icon, unit)").eq("id", lot_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Lot not found")
    return res.data


@router.post("/lots")
def create_lot(lot: LotCreate):
    """Create a new crop lot."""
    sb = get_supabase_admin()
    lot_data = {
        "crop_id": lot.crop_id,
        "quantity": lot.quantity,
        "quality_grade": lot.quality_grade,
        "status": "active",
        "harvest_date": lot.harvest_date,
        "available_from": lot.available_from,
        "available_until": lot.available_until,
        "storage_required": lot.storage_required,
        "description": lot.description,
        "farmer_id": "00000000-0000-0000-0000-000000000001",  # demo farmer for now
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    res = sb.table("lots").insert(lot_data).execute()
    return res.data[0] if res.data else {"message": "Lot created"}


@router.patch("/lots/{lot_id}")
def update_lot_status(lot_id: str, status: str):
    """Update lot status."""
    sb = get_supabase_admin()
    res = sb.table("lots").update({
        "status": status,
        "updated_at": datetime.utcnow().isoformat(),
    }).eq("id", lot_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Lot not found")
    return res.data[0]
