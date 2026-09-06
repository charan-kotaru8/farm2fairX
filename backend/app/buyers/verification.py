"""
Buyer Verification Logic & Tier Computation Engine.
Implements locked rules for buyer trust tiers:
  - basic: Default on signup or pending/rejected status
  - verified: Admin approved checklist (business info, location, document)
  - trusted_partner: Auto-earned when verification_status == 'approved'
                     AND completed_transactions >= 5
                     AND avg_rating >= 4.5
"""
from datetime import datetime
from typing import Dict, Any
from app.core.supabase_client import get_supabase_admin


# Locked Tier Thresholds
MIN_TRANSACTIONS_FOR_TRUSTED = 5
MIN_RATING_FOR_TRUSTED = 4.5


def recompute_verification_tier(buyer_id: str) -> Dict[str, Any]:
    """
    Evaluates buyer transaction history, ratings, and admin verification status
    to compute and persist their official verification tier.
    
    Returns details including previous tier, updated tier, and reason.
    """
    sb = get_supabase_admin()
    
    # 1. Fetch current buyer record
    res = sb.table("buyers").select("*").eq("id", buyer_id).maybe_single().execute()
    if not res.data:
        raise ValueError(f"Buyer {buyer_id} not found")
        
    buyer = res.data
    old_tier = buyer.get("verification_tier", "basic")
    status = buyer.get("verification_status", "pending")
    completed_tx = int(buyer.get("completed_transactions") or 0)
    avg_rating = float(buyer.get("avg_rating") or 0.0)
    
    new_tier = "basic"
    reason = ""
    
    # 2. Evaluate Tier Logic
    if status != "approved":
        new_tier = "basic"
        if status == "pending":
            reason = "Pending admin verification of business info, location, and documents."
        elif status == "more_info_requested":
            reason = f"Additional information requested: {buyer.get('admin_note', 'Please provide documentation')}."
        elif status == "rejected":
            reason = f"Verification rejected: {buyer.get('admin_note', 'Document or credentials invalid')}."
    else:
        # Status is approved by admin
        has_enough_deals = completed_tx >= MIN_TRANSACTIONS_FOR_TRUSTED
        has_high_rating = avg_rating >= MIN_RATING_FOR_TRUSTED
        
        if has_enough_deals and has_high_rating:
            new_tier = "trusted_partner"
            reason = (
                f"Earned Trusted Partner status with {completed_tx} completed transactions "
                f"(threshold: >={MIN_TRANSACTIONS_FOR_TRUSTED}) and {avg_rating:.1f} rating "
                f"(threshold: >={MIN_RATING_FOR_TRUSTED})."
            )
        else:
            new_tier = "verified"
            missing = []
            if not has_enough_deals:
                needed = MIN_TRANSACTIONS_FOR_TRUSTED - completed_tx
                missing.append(f"{needed} more completed deal(s) needed")
            if not has_high_rating:
                missing.append(f"Rating ({avg_rating:.1f}) must be at least {MIN_RATING_FOR_TRUSTED}")
            reason = f"Admin Verified Buyer. To reach Trusted Partner: {'; '.join(missing)}."

    # 3. Update buyer if tier changed or timestamp
    update_payload = {
        "verification_tier": new_tier,
        "updated_at": datetime.utcnow().isoformat()
    }
    
    sb.table("buyers").update(update_payload).eq("id", buyer_id).execute()
    
    return {
        "buyer_id": buyer_id,
        "business_name": buyer.get("business_name"),
        "verification_status": status,
        "previous_tier": old_tier,
        "current_tier": new_tier,
        "completed_transactions": completed_tx,
        "avg_rating": avg_rating,
        "reason": reason,
        "thresholds": {
            "min_transactions_for_trusted": MIN_TRANSACTIONS_FOR_TRUSTED,
            "min_rating_for_trusted": MIN_RATING_FOR_TRUSTED
        }
    }
