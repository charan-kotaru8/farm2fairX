from fastapi import APIRouter, Depends, HTTPException, Header
from typing import Optional
from app.core.supabase_client import get_supabase_admin

router = APIRouter()

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    
    token = authorization.split(" ")[1]
    supabase = get_supabase_admin()
    try:
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_response.user
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    user_id = current_user.id
    supabase = get_supabase_admin()
    res = supabase.table("profiles").select("*").eq("id", user_id).execute()
    
    if res.data and len(res.data) > 0:
        return {"user": current_user, "profile": res.data[0]}
    
    # Return user with fallback profile if not yet in database
    return {
        "user": current_user,
        "profile": {
            "id": user_id,
            "email": current_user.email,
            "role": current_user.user_metadata.get("role", "farmer")
        }
    }
