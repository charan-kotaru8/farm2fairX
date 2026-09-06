import random
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.core.supabase_client import get_supabase_admin
from app.api.logistics import calculate_haversine_distance

router = APIRouter()


class StorageBookingRequest(BaseModel):
    facility_id: str
    farmer_id: Optional[str] = "00000000-0000-0000-0000-000000000001"
    lot_id: Optional[str] = None  # Optional: can be standalone booking (§6.4)
    crop_id: Optional[str] = None
    quantity_quintals: float
    start_date: str
    end_date: str
    notes: Optional[str] = None


class AttachLotRequest(BaseModel):
    lot_id: str


@router.get("/facilities")
def list_storage_facilities(
    district: Optional[str] = None,
    facility_type: Optional[str] = None,
    min_capacity: Optional[float] = None,
    farmer_lat: Optional[float] = 18.4088,
    farmer_lng: Optional[float] = 76.5604,
):
    """
    Lists warehouse facilities with computed haversine distance and occupancy stats (§6.6 & §6.8).
    Supports filtering by facility type, district, and minimum capacity.
    """
    sb = get_supabase_admin()
    q = sb.table("storage_facilities").select("*")

    if district and district != "All":
        q = q.eq("district", district)
    if facility_type and facility_type != "All":
        q = q.ilike("facility_type", f"%{facility_type}%")

    facilities = q.execute().data or []
    results = []

    for f in facilities:
        avail_cap = float(f.get("available_capacity_quintals") or 0)
        total_cap = float(f.get("total_capacity_quintals") or 1)

        if min_capacity and avail_cap < min_capacity:
            continue

        # Haversine distance
        f_lat = float(f.get("lat") or 18.4088)
        f_lng = float(f.get("lng") or 76.5604)
        dist_km = calculate_haversine_distance(farmer_lat, farmer_lng, f_lat, f_lng)
        dist_km = max(dist_km, 2.5)

        occupancy_pct = round(((total_cap - avail_cap) / total_cap) * 100, 1)

        f["computed_distance_km"] = dist_km
        f["occupancy_percentage"] = occupancy_pct
        f["is_nearly_full"] = (occupancy_pct >= 95.0)

        results.append(f)

    # Sort by distance
    results.sort(key=lambda x: x.get("computed_distance_km", 999))
    return results


@router.post("/book")
def book_storage_space(req: StorageBookingRequest):
    """
    Creates a storage booking.
    - Can be standalone or attached to a lot (§6.4).
    - Deducts booked capacity from available warehouse capacity.
    - Generates confirmed e-warehouse receipt.
    """
    sb = get_supabase_admin()

    # 1. Fetch facility
    f_res = sb.table("storage_facilities").select("*").eq("id", req.facility_id).maybe_single().execute()
    if not f_res.data:
        raise HTTPException(status_code=404, detail="Storage facility not found")
    facility = f_res.data

    avail_cap = float(facility.get("available_capacity_quintals") or 0)
    if avail_cap < req.quantity_quintals:
        raise HTTPException(
            status_code=400,
            detail=f"Requested {req.quantity_quintals}q exceeds available capacity ({avail_cap}q)."
        )

    # 2. Compute duration in months and total cost
    try:
        d1 = datetime.strptime(req.start_date[:10], "%Y-%m-%d").date()
        d2 = datetime.strptime(req.end_date[:10], "%Y-%m-%d").date()
        days = max((d2 - d1).days, 30)
        months = max(round(days / 30.0), 1)
    except Exception:
        months = 1

    rate = float(facility.get("price_per_quintal_month") or 45.0)
    total_cost = round(req.quantity_quintals * rate * months, 2)

    receipt_num = f"WH-REC-{datetime.utcnow().year}-{random.randint(1000, 9999)}"
    now = datetime.utcnow().isoformat()

    # 3. Create booking
    booking_payload = {
        "facility_id": req.facility_id,
        "farmer_id": req.farmer_id or "00000000-0000-0000-0000-000000000001",
        "lot_id": req.lot_id or None,
        "crop_id": req.crop_id,
        "quantity_quintals": req.quantity_quintals,
        "start_date": req.start_date[:10],
        "end_date": req.end_date[:10],
        "duration_months": months,
        "monthly_rate_per_quintal": rate,
        "total_cost": total_cost,
        "status": "confirmed",
        "receipt_number": receipt_num,
        "notes": req.notes or "Booked via Farm2Fair Storage Network",
        "created_at": now,
        "updated_at": now,
    }

    b_res = sb.table("storage_bookings").insert(booking_payload).execute()
    if not b_res.data:
        raise HTTPException(status_code=500, detail="Failed to create storage booking")
    booking = b_res.data[0]

    # 4. Deduct capacity
    new_avail = max(avail_cap - req.quantity_quintals, 0.0)
    sb.table("storage_facilities").update({
        "available_capacity_quintals": new_avail,
        "updated_at": now,
    }).eq("id", req.facility_id).execute()

    # 5. If lot attached, link lot
    if req.lot_id:
        sb.table("lots").update({
            "storage_booking_id": booking["id"],
            "storage_required": True,
            "updated_at": now,
        }).eq("id", req.lot_id).execute()

    return {
        "message": f"Storage booked successfully! Receipt #{receipt_num}",
        "booking": booking,
        "facility_name": facility.get("name"),
    }


@router.post("/bookings/{booking_id}/attach-lot")
def attach_booking_to_lot(booking_id: str, req: AttachLotRequest):
    """
    Attaches a standalone storage booking to an existing active lot (§6.4).
    """
    sb = get_supabase_admin()

    b_res = sb.table("storage_bookings").select("*").eq("id", booking_id).maybe_single().execute()
    if not b_res.data:
        raise HTTPException(status_code=404, detail="Storage booking not found")

    lot_res = sb.table("lots").select("*").eq("id", req.lot_id).maybe_single().execute()
    if not lot_res.data:
        raise HTTPException(status_code=404, detail="Lot not found")

    now = datetime.utcnow().isoformat()
    # Update booking
    sb.table("storage_bookings").update({
        "lot_id": req.lot_id,
        "updated_at": now,
    }).eq("id", booking_id).execute()

    # Update lot
    sb.table("lots").update({
        "storage_booking_id": booking_id,
        "storage_required": True,
        "updated_at": now,
    }).eq("id", req.lot_id).execute()

    return {
        "message": "Storage booking successfully attached to lot.",
        "booking_id": booking_id,
        "lot_id": req.lot_id,
    }


@router.get("/bookings")
def list_storage_bookings(farmer_id: Optional[str] = None):
    """
    Lists all storage bookings (both standalone and lot-attached) for the farmer.
    """
    sb = get_supabase_admin()
    q = sb.table("storage_bookings").select(
        "*, storage_facilities(name, district, address, phone, rating), crops(name, icon), lots(status, quality_grade)"
    )
    if farmer_id:
        q = q.eq("farmer_id", farmer_id)

    bookings = q.order("created_at", desc=True).execute().data or []
    return bookings
