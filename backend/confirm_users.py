"""Confirm all unconfirmed users in Supabase Auth."""
from app.core.supabase_client import get_supabase_admin

def confirm_all_users():
    sb = get_supabase_admin()
    try:
        users_resp = sb.auth.admin.list_users()
        users = users_resp if isinstance(users_resp, list) else getattr(users_resp, 'users', [])
        print(f"Found {len(users)} users in auth.")
        for u in users:
            email = getattr(u, 'email', None) or (u.get('email') if isinstance(u, dict) else None)
            uid = getattr(u, 'id', None) or (u.get('id') if isinstance(u, dict) else None)
            confirmed = getattr(u, 'email_confirmed_at', None) or (u.get('email_confirmed_at') if isinstance(u, dict) else None)
            print(f"User: {email}, ID: {uid}, Confirmed: {bool(confirmed)}")
            if uid and not confirmed:
                print(f"Confirming email for {email}...")
                sb.auth.admin.update_user_by_id(uid, {"email_confirm": True})
                print(f"Confirmed {email}!")
    except Exception as e:
        print("Error confirming users:", e)

if __name__ == "__main__":
    confirm_all_users()
