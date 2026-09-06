from datetime import datetime
from typing import Optional
from fastapi import APIRouter
from app.core.supabase_client import get_supabase_admin

router = APIRouter()


@router.get("")
def list_notifications(user_id: Optional[str] = None):
    """
    Returns notifications with unread count.
    Used by the client polling mechanism (every 15-30s, §7.5).
    """
    sb = get_supabase_admin()
    q = sb.table("notifications").select("*")
    if user_id:
        q = q.eq("user_id", user_id)

    notifications = q.order("created_at", desc=True).limit(20).execute().data or []
    unread_count = len([n for n in notifications if not n.get("is_read")])

    return {
        "notifications": notifications,
        "unread_count": unread_count,
        "polling_interval_seconds": 15,
        "mechanism": "Interval polling / refetch-on-navigation (§7.5)",
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
