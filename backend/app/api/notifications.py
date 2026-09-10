from datetime import datetime
from typing import Optional
from fastapi import APIRouter
from app.core.supabase_client import get_supabase_admin

router = APIRouter()


@router.get("")
def list_notifications(user_id: Optional[str] = None, role: Optional[str] = None):
    """
    Returns notifications with unread count.
    Used by the client polling mechanism (every 15-30s, §7.5).
    Separates notifications by role:
    - farmer: lot bids, transport pickups, mandi price trends, weather advisories
    - buyer: accepted offers, transport tracking, verification tier updates
    - admin: grievance triage tickets, buyer verification requests, platform audits
    """
    sb = get_supabase_admin()
    q = sb.table("notifications").select("*")
    if user_id:
        q = q.eq("user_id", user_id)

    notifications = q.order("created_at", desc=True).limit(30).execute().data or []

    # Role-based separation
    if role == "farmer":
        notifications = [
            n for n in notifications
            if n.get("category") in ["transaction", "price_alert", "market", "transport", "weather", "fpo", "system"]
            or "offer" in (n.get("title", "")).lower()
            or "transport" in (n.get("title", "")).lower()
            or "price" in (n.get("title", "")).lower()
            or "fpo" in (n.get("title", "")).lower()
        ]
    elif role == "buyer":
        notifications = [
            n for n in notifications
            if n.get("category") in ["transaction", "transport", "market", "verification", "buyer_verification", "system"]
            or "offer" in (n.get("title", "")).lower()
            or "transport" in (n.get("title", "")).lower()
            or "verification" in (n.get("title", "")).lower()
            or "kyc" in (n.get("title", "")).lower()
        ]
    elif role == "fpo":
        notifications = [
            n for n in notifications
            if n.get("category") in ["fpo", "transaction", "market", "system"]
            or "fpo" in (n.get("title", "")).lower()
            or "member" in (n.get("title", "")).lower()
            or "join" in (n.get("title", "")).lower()
        ]
    elif role == "admin":
        notifications = [
            n for n in notifications
            if n.get("category") in ["grievance", "admin", "verification", "audit", "system"]
            or (n.get("link_url") or "").startswith("/admin")
            or "grievance" in (n.get("title", "")).lower()
            or "verification" in (n.get("title", "")).lower()
        ]

    unread_count = len([n for n in notifications if not n.get("is_read")])

    return {
        "notifications": notifications,
        "unread_count": unread_count,
        "role": role,
        "polling_interval_seconds": 15,
        "mechanism": "Role-separated polling / refetch-on-navigation (§7.5)",
    }



@router.post("/{notification_id}/read")
def mark_notification_read(notification_id: str):
    """Marks a single notification as read."""
    sb = get_supabase_admin()
    res = sb.table("notifications").update({"is_read": True}).eq("id", notification_id).execute()
    return {"message": "Notification marked as read", "success": True}


@router.post("/mark-all-read")
def mark_all_notifications_read(user_id: Optional[str] = None):
    """Marks all notifications as read."""
    sb = get_supabase_admin()
    q = sb.table("notifications").update({"is_read": True})
    if user_id:
        q = q.eq("user_id", user_id)
    q.execute()
    return {"message": "All notifications marked as read", "success": True}
