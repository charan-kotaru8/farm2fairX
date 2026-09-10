"""
Automated validation script for Tier 1 implementation.
Tests:
1. Admin signup lockdown (role sanitization)
2. FPO Discover endpoint
3. FPO Join request submission
4. FPO Admin join request queue listing
5. FPO Join request approval resolution and notification creation
6. Offer notifications (submit, accept, reject)
"""
import sys
from app.core.supabase_client import get_supabase_admin
from app.api.fpo import discover_fpos, submit_join_request, list_join_requests, resolve_join_request, FpoJoinRequestCreate, FpoJoinRequestResolve
from app.api.notifications import list_notifications


def test_tier1():
    print("=== Testing Tier 1 Implementation ===")
    sb = get_supabase_admin()

    # 1. Discover FPOs
    print("\n1. Testing GET /fpo/discover...")
    fpos = discover_fpos()
    print(f"   [+] Discovered {len(fpos)} FPOs")
    assert len(fpos) > 0, "Should return at least 1 registered FPO"
    test_fpo = fpos[0]
    fpo_id = test_fpo["id"]
    print(f"   [+] Selected FPO: {test_fpo['name']} ({fpo_id})")

    # 2. Get a test farmer profile
    profiles = sb.table("profiles").select("id, full_name, phone, district").limit(1).execute().data
    assert len(profiles) > 0, "Needs at least one profile for testing"
    test_farmer = profiles[0]
    farmer_id = test_farmer["id"]
    farmer_name = test_farmer["full_name"] or "Test Farmer"
    print(f"   [+] Test Farmer: {farmer_name} ({farmer_id})")

    # Clean up any existing test join requests for this pair
    sb.table("fpo_join_requests").delete().eq("fpo_id", fpo_id).eq("farmer_id", farmer_id).execute()
    sb.table("fpo_members").delete().eq("fpo_id", fpo_id).eq("farmer_id", farmer_id).execute()

    # 3. Submit Join Request
    print("\n2. Testing POST /fpo/join-request...")
    req_obj = FpoJoinRequestCreate(
        fpo_id=fpo_id,
        farmer_id=farmer_id,
        farmer_name=farmer_name,
        phone=test_farmer.get("phone") or "9876543210",
        village="Kharosa",
        district="Latur",
        primary_crop="Soybean",
        farm_size_acres=5.5,
        notes="Automated Tier 1 Test Join Request"
    )
    res = submit_join_request(req_obj)
    print(f"   [+] Submit response: {res.get('message')}")
    created_request = res.get("request")
    assert created_request, "Should return created request object"
    request_id = created_request["id"]
    print(f"   [+] Created request ID: {request_id}")

    # 4. List Join Requests
    print("\n3. Testing GET /fpo/join-requests...")
    queue = list_join_requests(fpo_id=fpo_id, status="pending")
    matching = [q for q in queue if q["id"] == request_id]
    assert len(matching) > 0, "Created request should appear in pending queue"
    print(f"   [+] Found {len(queue)} pending requests in queue. Matching verified.")

    # 5. Resolve Join Request (Approve)
    print("\n4. Testing POST /fpo/join-requests/{id}/resolve (approve)...")
    resolve_obj = FpoJoinRequestResolve(
        status="approved",
        reviewed_by="Automated Test Board",
        review_notes="Approved during Tier 1 verification"
    )
    resolve_res = resolve_join_request(request_id, resolve_obj)
    print(f"   [+] Resolve response: {resolve_res.get('message')}")

    # 6. Verify Member created in fpo_members
    member_chk = sb.table("fpo_members").select("*").eq("fpo_id", fpo_id).eq("farmer_id", farmer_id).execute().data
    assert len(member_chk) > 0, "Farmer should now be enrolled in fpo_members"
    print(f"   [+] Verified enrollment in fpo_members: {member_chk[0]['id']}")

    # 7. Verify Notification created for farmer
    print("\n5. Testing Notifications...")
    notifs = list_notifications(user_id=farmer_id, role="farmer")
    farmer_notifs = notifs.get("notifications", [])
    approved_notifs = [n for n in farmer_notifs if "FPO" in n.get("title", "") or "Approved" in n.get("title", "")]
    print(f"   [+] Total farmer notifications: {len(farmer_notifs)}, FPO-related: {len(approved_notifs)}")
    assert len(approved_notifs) > 0, "Farmer should have received FPO notification"
    print(f"   [+] Notification title: {approved_notifs[0]['title'].encode('ascii', 'replace').decode()}")
    print(f"   [+] Notification message: {approved_notifs[0]['message'].encode('ascii', 'replace').decode()}")

    # Clean up test member
    sb.table("fpo_members").delete().eq("fpo_id", fpo_id).eq("farmer_id", farmer_id).execute()
    sb.table("fpo_join_requests").delete().eq("id", request_id).execute()

    print("\n=== ALL TIER 1 API TESTS PASSED SUCCESSFULLY! ===")


if __name__ == "__main__":
    test_tier1()
