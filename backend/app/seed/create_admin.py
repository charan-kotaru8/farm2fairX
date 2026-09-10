"""
Admin Provisioning CLI Script.
Allows creating or promoting an administrative user directly via the Supabase Service Role key,
ensuring admin accounts can never be created via public sign-up flows.

Usage:
    python -m app.seed.create_admin --email admin@farm2fair.in --password StrongPassword123 --name "Farm2Fair Administrator"
    or simply:
    python -m app.seed.create_admin
"""
import argparse
import sys
from app.core.supabase_client import get_supabase_admin


def provision_admin(email: str, password: str = None, full_name: str = "Admin User"):
    sb = get_supabase_admin()
    print(f"[*] Provisioning admin account for: {email}")

    user_id = None

    # 1. Check if user already exists in auth.users or profiles
    profile_res = sb.table("profiles").select("id, role, full_name").eq("full_name", full_name).execute()
    
    # Try finding in auth or profiles by email
    try:
        # Check profiles table
        existing_profile = sb.table("profiles").select("*").execute()
        # Look for matching email if stored or check by creating/updating
    except Exception as e:
        print(f"[!] Warning reading profiles: {e}")

    # Try creating user with auth admin API
    try:
        user_attributes = {
            "email": email,
            "email_confirm": True,
            "user_metadata": {
                "full_name": full_name,
                "role": "admin"
            }
        }
        if password:
            user_attributes["password"] = password

        user_res = sb.auth.admin.create_user(user_attributes)
        if hasattr(user_res, "user") and user_res.user:
            user_id = user_res.user.id
            print(f"[+] Created new Supabase Auth user: {user_id}")
        elif isinstance(user_res, dict) and "id" in user_res:
            user_id = user_res["id"]
            print(f"[+] Created new Supabase Auth user: {user_id}")
    except Exception as e:
        error_msg = str(e).lower()
        if "already" in error_msg or "exists" in error_msg:
            print(f"[*] User {email} already exists in Auth. Looking up ID...")
            try:
                users_res = sb.auth.admin.list_users()
                user_list = getattr(users_res, "users", users_res)
                for u in user_list:
                    u_email = getattr(u, "email", None) or (u.get("email") if isinstance(u, dict) else None)
                    if u_email and u_email.lower() == email.lower():
                        user_id = getattr(u, "id", None) or (u.get("id") if isinstance(u, dict) else None)
                        break
            except Exception as lookup_err:
                print(f"[!] Could not list users: {lookup_err}")

            if user_id and password:
                try:
                    sb.auth.admin.update_user_by_id(user_id, {
                        "password": password,
                        "email_confirm": True,
                        "user_metadata": {
                            "full_name": full_name,
                            "role": "admin"
                        }
                    })
                    print(f"[+] Updated existing user password and metadata.")
                except Exception as update_err:
                    print(f"[!] Warning updating user password: {update_err}")
        else:
            print(f"[!] Auth creation failed: {e}")

    if not user_id:
        print("[!] Could not determine user ID. Trying direct profile upsert with email if applicable.")
        # Try checking profiles
        res = sb.table("profiles").select("id").limit(1).execute()
        # If user not found, require valid creation
        print("[!] Please provide a valid user or check your Supabase credentials.")
        return

    # 2. Upsert admin role into profiles table
    profile_data = {
        "id": user_id,
        "full_name": full_name,
        "role": "admin"
    }
    
    upsert_res = sb.table("profiles").upsert(profile_data).execute()
    print(f"[SUCCESS] Admin profile provisioned successfully for user ID {user_id} ({email}) with role 'admin'.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Provision an Admin User for Farm2Fair")
    parser.add_argument("--email", type=str, default="admin@farm2fair.in", help="Admin email address")
    parser.add_argument("--password", type=str, default="AdminFarm2Fair2026!", help="Admin password")
    parser.add_argument("--name", type=str, default="Farm2Fair Admin", help="Admin display name")

    args = parser.parse_args()
    provision_admin(args.email, args.password, args.name)
