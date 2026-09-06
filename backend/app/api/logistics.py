import math
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.core.supabase_client import get_supabase_admin

router = APIRouter()


def calculate_haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Computes great-circle distance between two GPS coordinates in kilometers
    using the Haversine formula (§6.6).
    """
    R = 6371.0  # Earth's radius in kilometers
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lng2 - lng1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    distance = R * c
    return round(distance, 1)


class TransportAssignRequest(BaseModel):
    lot_id: str
    provider_id: str
    delivery_address: str
    delivery_lat: Optional[float] = 18.5204
    delivery_lng: Optional[float] = 73.8567
    notes: Optional[str] = None


class TransportStatusUpdateRequest(BaseModel):
    new_status: str  # 'pickup_scheduled', 'picked_up', 'in_transit', 'delivered'
    notes: Optional[str] = None


@router.get("/providers")
def list_transport_providers(
    lot_id: Optional[str] = None,
    farmer_lat: Optional[float] = 18.4088,
    farmer_lng: Optional[float] = 76.5604,
    min_capacity: Optional[float] = None,
    vehicle_type: Optional[str] = None,
):
    """
    Lists transport providers with computed haversine distance and dynamic pricing (§6.6).
    Unavailable providers are marked with is_available=False (shown grayed in UI, §6.3).
    """
    sb = get_supabase_admin()

    # If lot_id provided, look up lot's pickup coordinates & quantity
    lot_qty = None
    if lot_id:
        lot_res = sb.table("lots").select("pickup_lat, pickup_lng, quantity").eq("id", lot_id).maybe_single().execute()
        if lot_res.data:
            if lot_res.data.get("pickup_lat"):
                farmer_lat = float(lot_res.data["pickup_lat"])
            if lot_res.data.get("pickup_lng"):
                farmer_lng = float(lot_res.data["pickup_lng"])
            lot_qty = float(lot_res.data.get("quantity") or 0)

    # Fetch providers
    q = sb.table("transport_providers").select("*")
    if vehicle_type and vehicle_type != "All":
        q = q.ilike("vehicle_type", f"%{vehicle_type}%")
    providers = q.execute().data or []

    results = []
    for p in providers:
        p_cap = float(p.get("capacity_quintals") or 0)
        if min_capacity and p_cap < min_capacity:
            continue
        if lot_qty and p_cap < lot_qty:
            p["capacity_sufficient"] = False
        else:
            p["capacity_sufficient"] = True

        # Haversine distance from farmer/lot pickup point to provider base
        p_lat = float(p.get("lat") or 18.4088)
        p_lng = float(p.get("lng") or 76.5604)
        dist_km = calculate_haversine_distance(farmer_lat, farmer_lng, p_lat, p_lng)
        # Ensure minimum realistic distance of 3.5 km for local depot
        dist_km = max(dist_km, 3.5)

        base_fee = float(p.get("base_fee") or 750.0)
        rate_per_km = float(p.get("rate_per_km") or 32.0)
        estimated_cost = round(base_fee + (rate_per_km * dist_km), 2)

        p["computed_distance_km"] = dist_km
        p["estimated_cost"] = estimated_cost
        results.append(p)

    # Sort available first, then by computed distance / cost
    results.sort(key=lambda x: (not x.get("is_available", True), x.get("estimated_cost", 999999)))
    return results


@router.post("/assign")
def assign_transport(req: TransportAssignRequest):
    """
    Assigns transport provider to an accepted lot.
    - Locks provider as Unavailable (§6.3)
    - Updates lot status to 'transport_assigned' (§6.1 single source of truth)
    - Computes distance and dynamic trip cost
    """
    sb = get_supabase_admin()

    # 1. Verify lot exists and is in an eligible status
    lot_res = sb.table("lots").select("*").eq("id", req.lot_id).maybe_single().execute()
    if not lot_res.data:
        raise HTTPException(status_code=404, detail="Lot not found")
    lot = lot_res.data
    if lot.get("status") not in ["offer_accepted", "active", "offer_received"]:
        raise HTTPException(
            status_code=400,
            detail=f"Lot cannot be assigned transport in status '{lot.get('status')}'. Must be 'offer_accepted'."
        )

    # 2. Check provider availability (§6.3)
    p_res = sb.table("transport_providers").select("*").eq("id", req.provider_id).maybe_single().execute()
    if not p_res.data:
        raise HTTPException(status_code=404, detail="Transport provider not found")
    provider = p_res.data
    if not provider.get("is_available"):
        raise HTTPException(
            status_code=400,
            detail=f"Transport provider '{provider.get('name')}' is currently unavailable on another transit job."
        )

    # 3. Calculate distance and cost
    pickup_lat = float(lot.get("pickup_lat") or 18.4088)
    pickup_lng = float(lot.get("pickup_lng") or 76.5604)
    deliv_lat = float(req.delivery_lat or 18.5204)
    deliv_lng = float(req.delivery_lng or 73.8567)

    distance_km = calculate_haversine_distance(pickup_lat, pickup_lng, deliv_lat, deliv_lng)
    distance_km = max(distance_km, 5.0)

    base_fee = float(provider.get("base_fee") or 750.0)
    rate_per_km = float(provider.get("rate_per_km") or 32.0)
    cost = round(base_fee + (rate_per_km * distance_km), 2)

    now = datetime.utcnow().isoformat()

    # 4. Insert transport assignment
    assignment_payload = {
        "lot_id": req.lot_id,
        "provider_id": req.provider_id,
        "pickup_address": lot.get("pickup_address") or "Farm Gate, Ausa, Latur",
        "delivery_address": req.delivery_address,
        "pickup_lat": pickup_lat,
        "pickup_lng": pickup_lng,
        "delivery_lat": deliv_lat,
        "delivery_lng": deliv_lng,
        "estimated_distance_km": distance_km,
        "estimated_cost": cost,
        "status": "assigned",
        "scheduled_pickup_time": now,
        "notes": req.notes,
        "created_at": now,
        "updated_at": now,
    }
    a_res = sb.table("transport_assignments").insert(assignment_payload).execute()
    if not a_res.data:
        raise HTTPException(status_code=500, detail="Failed to create transport assignment")
    assignment = a_res.data[0]

    # 5. Lock provider availability (§6.3)
    sb.table("transport_providers").update({
        "is_available": False,
        "updated_at": now,
    }).eq("id", req.provider_id).execute()

    # 6. Single Source of Truth (§6.1): Update lot status to 'transport_assigned'
    sb.table("lots").update({
        "transport_assignment_id": assignment["id"],
        "status": "transport_assigned",
        "updated_at": now,
    }).eq("id", req.lot_id).execute()

    return {
        "message": f"Transport provider {provider.get('name')} successfully assigned.",
        "assignment": assignment,
        "lot_status": "transport_assigned",
    }


@router.post("/assignments/{assignment_id}/status")
def update_transport_status(assignment_id: str, req: TransportStatusUpdateRequest):
    """
    Updates transport status along the 5-node stepper (§6.1 & §6.8):
    Assigned -> Pickup Scheduled -> Picked Up -> In Transit -> Delivered.
    - Maps 1:1 onto lot status (single source of truth).
    - Unlocks provider availability when status reaches 'delivered' (§6.3).
    """
    valid_statuses = ["assigned", "pickup_scheduled", "picked_up", "in_transit", "delivered"]
    if req.new_status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transport status '{req.new_status}'. Allowed: {valid_statuses}"
        )

    sb = get_supabase_admin()
    a_res = sb.table("transport_assignments").select("*").eq("id", assignment_id).maybe_single().execute()
    if not a_res.data:
        raise HTTPException(status_code=404, detail="Transport assignment not found")
    assignment = a_res.data
    lot_id = assignment["lot_id"]
    provider_id = assignment["provider_id"]

    now = datetime.utcnow().isoformat()
    update_data = {
        "status": req.new_status,
        "updated_at": now,
    }
    if req.notes:
        update_data["notes"] = req.notes
    if req.new_status == "picked_up":
        update_data["picked_up_at"] = now
    elif req.new_status == "delivered":
        update_data["delivered_at"] = now

    # Update assignment
    sb.table("transport_assignments").update(update_data).eq("id", assignment_id).execute()

    # 1:1 Unified Status Update on Lot (§6.1)
    sb.table("lots").update({
        "status": req.new_status,
        "updated_at": now,
    }).eq("id", lot_id).execute()

    # Release provider availability if delivered (§6.3)
    provider_unlocked = False
    if req.new_status == "delivered":
        sb.table("transport_providers").update({
            "is_available": True,
            "updated_at": now,
        }).eq("id", provider_id).execute()
        provider_unlocked = True

    return {
        "message": f"Transport and Lot status successfully updated to '{req.new_status}'.",
        "assignment_id": assignment_id,
        "lot_id": lot_id,
        "status": req.new_status,
        "provider_unlocked": provider_unlocked,
    }


@router.get("/assignments/lot/{lot_id}")
def get_lot_transport_details(lot_id: str):
    """
    Returns the active transport assignment, provider details,
    and any recorded buyer quality verification for the given lot.
    """
    sb = get_supabase_admin()
    lot_res = sb.table("lots").select("*, crops(name, icon, unit)").eq("id", lot_id).maybe_single().execute()
    if not lot_res.data:
        raise HTTPException(status_code=404, detail="Lot not found")
    lot = lot_res.data

    # Fetch assignment
    assign_res = sb.table("transport_assignments") \
        .select("*, transport_providers(name, vehicle_type, vehicle_number, phone, rating, total_trips)") \
        .eq("lot_id", lot_id) \
        .order("created_at", desc=True) \
        .execute()
    assignment = assign_res.data[0] if assign_res.data else None

    # Fetch quality verification
    quality_res = sb.table("lot_quality_verifications") \
        .select("*") \
        .eq("lot_id", lot_id) \
        .order("verified_at", desc=True) \
        .execute()
    quality = quality_res.data[0] if quality_res.data else None

    return {
        "lot": lot,
        "assignment": assignment,
        "quality_verification": quality,
    }
