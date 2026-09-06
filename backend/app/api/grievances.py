import random
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.core.supabase_client import get_supabase_admin

router = APIRouter()


class GrievanceCreateRequest(BaseModel):
    user_id: Optional[str] = None
    user_name: str
    user_role: str = "farmer"  # 'farmer', 'buyer'
    user_phone: Optional[str] = None
    lot_id: Optional[str] = None
    offer_id: Optional[str] = None
    category: str  # 'Delayed Payment', 'Quality Dispute', 'Pickup Delay', 'Price Mismatch', 'Platform Issue'
    subject: str
    description: str


class GrievanceResolveRequest(BaseModel):
    resolution_status: str = "resolved"  # 'resolved' or 'rejected'
    resolution_notes: str
    resolved_by: Optional[str] = "Admin Support Desk"
    satisfaction_rating: Optional[int] = 5


@router.get("")
def list_grievances(
    category: Optional[str] = None,
    status: Optional[str] = None,
    breached_only: bool = False,
):
    """
    Lists grievances with real-time SLA breach evaluation (§7.3).
    SLA-breached tickets (>48h without resolution) are pinned to the top with is_sla_breached=True.
    """
    sb = get_supabase_admin()
    q = sb.table("grievances").select("*, lots(id, quantity, crops(name, icon))")

    if category and category != "All":
        q = q.eq("category", category)
    if status and status != "All":
        q = q.eq("status", status)

    grievances = q.execute().data or []
    now = datetime.utcnow()

    filtered = []
    for g in grievances:
        deadline_str = g.get("sla_deadline") or ""
        is_breached = False
        hours_remaining = None
        hours_overdue = 0.0

        if deadline_str:
            try:
                deadline = datetime.fromisoformat(deadline_str.replace("Z", "+00:00")).replace(tzinfo=None)
                is_open = g.get("status") in ["open", "in_review"]
                if is_open and now > deadline:
                    is_breached = True
                    hours_overdue = round((now - deadline).total_seconds() / 3600.0, 1)
                    hours_remaining = 0.0
                elif is_open:
                    hours_remaining = max(round((deadline - now).total_seconds() / 3600.0, 1), 0.0)
                else:
                    hours_remaining = 0.0
            except Exception:
                pass

        g["is_sla_breached"] = is_breached
        g["hours_overdue"] = hours_overdue
        g["hours_remaining"] = hours_remaining

        if breached_only and not is_breached:
            continue

        filtered.append(g)

    # Sort: Breached tickets FIRST (§7.3), then oldest created_at first
    filtered.sort(key=lambda x: (not x.get("is_sla_breached", False), x.get("created_at", "")), reverse=False)

    return filtered


@router.post("")
def file_grievance(req: GrievanceCreateRequest):
    """
    Files a new grievance ticket with an automatic 48-hour SLA window (§7.3).
    """
    valid_categories = ['Delayed Payment', 'Quality Dispute', 'Pickup Delay', 'Price Mismatch', 'Platform Issue']
    if req.category not in valid_categories:
        raise HTTPException(status_code=400, detail=f"Invalid category. Allowed: {valid_categories}")

    sb = get_supabase_admin()
    now = datetime.utcnow()
    sla_deadline = now + timedelta(hours=48)
    ticket_num = f"GRV-2026-{random.randint(1000, 9999)}"

    # Check if user_id exists in profiles; if not or None, keep None to prevent FK violation
    valid_user_id = None
    if req.user_id:
        try:
            chk = sb.table("profiles").select("id").eq("id", req.user_id).execute()
            if chk.data:
                valid_user_id = req.user_id
        except Exception:
            valid_user_id = None

    payload = {
        "ticket_number": ticket_num,
        "user_id": valid_user_id,
        "user_name": req.user_name,
        "user_role": req.user_role,
        "user_phone": req.user_phone,
        "lot_id": req.lot_id or None,
        "offer_id": req.offer_id or None,
        "category": req.category,
        "subject": req.subject,
        "description": req.description,
        "status": "open",
        "sla_deadline": sla_deadline.isoformat(),
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }

    res = sb.table("grievances").insert(payload).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to file grievance")

    # Create confirmation notification
    sb.table("notifications").insert({
        "user_id": valid_user_id,
        "title": f"Grievance Ticket Raised: {ticket_num}",
        "message": f"Your ticket regarding '{req.subject}' has been assigned SLA window (48 hours).",
        "category": "grievance",
        "link_url": "/admin/grievances",
        "is_read": False,
        "created_at": now.isoformat(),
    }).execute()

    return {
        "message": f"Grievance filed successfully! Ticket #{ticket_num}",
        "grievance": res.data[0],
    }


@router.post("/{grievance_id}/resolve")
def resolve_grievance(grievance_id: str, req: GrievanceResolveRequest):
    """
    Audit/status action only (§7.6).
    Updates grievance status and resolution audit notes.
    Does NOT mutate or modify the underlying transaction.
    """
    if req.resolution_status not in ["resolved", "rejected"]:
        raise HTTPException(status_code=400, detail="Status must be 'resolved' or 'rejected'")

    sb = get_supabase_admin()
    g_res = sb.table("grievances").select("*").eq("id", grievance_id).maybe_single().execute()
    if not g_res.data:
        raise HTTPException(status_code=404, detail="Grievance not found")
    grievance = g_res.data

    now = datetime.utcnow().isoformat()
    update_data = {
        "status": req.resolution_status,
        "resolution_notes": req.resolution_notes,
        "resolved_by": req.resolved_by or "Admin Support Officer",
        "resolved_at": now,
        "satisfaction_rating": req.satisfaction_rating or 5,
        "updated_at": now,
    }

    res = sb.table("grievances").update(update_data).eq("id", grievance_id).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to resolve grievance")

    # Create notification for user
    sb.table("notifications").insert({
        "user_id": grievance.get("user_id"),
        "title": f"Grievance Resolved: {grievance.get('ticket_number')}",
        "message": f"Audit resolution: {req.resolution_notes[:80]}...",
        "category": "grievance",
        "link_url": "/admin/grievances",
        "is_read": False,
        "created_at": now,
    }).execute()

    return {
        "message": f"Grievance {grievance.get('ticket_number')} marked as {req.resolution_status}.",
        "grievance": res.data[0],
        "audit_note": req.resolution_notes,
    }
