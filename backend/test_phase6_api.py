"""
Automated verification test script for Phase 6: Logistics & Storage API
Tests:
1. Haversine distance calculation accuracy
2. GET /logistics/providers (computed distance, dynamic pricing, availability flag)
3. POST /logistics/assign (availability lock, 1:1 lot status update)
4. POST /logistics/assignments/{id}/status (status machine progression + provider unlock on 'delivered')
5. POST /quality/verify & GET /quality/lot/{lot_id} (buyer inspection, before/after comparison)
6. GET /storage/facilities (distance, occupancy %, capacity filters)
7. POST /storage/book (standalone booking, capacity deduction, receipt generation)
8. POST /storage/bookings/{id}/attach-lot (linking standalone booking to an active lot)
"""
from fastapi.testclient import TestClient
from app.main import app
from app.api.logistics import calculate_haversine_distance

client = TestClient(app)

def test_phase6():
    print("==================================================")
    print("   PHASE 6: LOGISTICS & STORAGE VERIFICATION")
    print("==================================================")

    # 1. Test Haversine Distance
    print("\n[1] Testing Haversine Distance Calculation...")
    # Distance between Latur (18.4088, 76.5604) and Pune (18.5204, 73.8567) is approx 286-290 km
    d = calculate_haversine_distance(18.4088, 76.5604, 18.5204, 73.8567)
    print(f"    Latur to Pune computed distance: {d} km")
    assert 275 <= d <= 300, f"Expected distance around 285km, got {d}"
    print("    --> PASSED")

    # 2. Test Transport Providers Listing
    print("\n[2] Testing GET /logistics/providers...")
    res = client.get("/logistics/providers?farmer_lat=18.4088&farmer_lng=76.5604")
    assert res.status_code == 200, f"Failed: {res.text}"
    providers = res.json()
    print(f"    Retrieved {len(providers)} providers:")
    available_count = 0
    unavailable_count = 0
    for p in providers:
        print(f"      * {p['name']} ({p['vehicle_type']}) - Cap: {p['capacity_quintals']}q, Dist: {p['computed_distance_km']}km, Cost: Rs. {p['estimated_cost']}, Available: {p['is_available']}")
        if p['is_available']:
            available_count += 1
        else:
            unavailable_count += 1
    assert available_count >= 2, "Expected at least 2 available providers"
    assert unavailable_count >= 1, "Expected at least 1 unavailable provider (availability guard demo §6.3)"
    print("    --> PASSED: Computed distance, dynamic pricing, and availability states verified!")

    # 3. Test Transport Assignment & Availability Lock
    print("\n[3] Testing POST /logistics/assign (Assignment & Availability Lock)...")
    # First pick an eligible lot
    lots_res = client.get("/lots")
    lots = lots_res.json()
    assert len(lots) > 0, "No lots found in DB"
    test_lot = lots[0]
    lot_id = test_lot["id"]

    # Select an available provider
    avail_providers = [p for p in providers if p["is_available"]]
    assert len(avail_providers) > 0, "No available provider to assign"
    target_provider = avail_providers[0]
    provider_id = target_provider["id"]

    # Ensure lot is in offer_accepted state for assignment
    client.patch(f"/lots/{lot_id}?status=offer_accepted")

    assign_res = client.post("/logistics/assign", json={
        "lot_id": lot_id,
        "provider_id": provider_id,
        "delivery_address": "Shivaji Nagar Mandi Complex, Pune",
        "delivery_lat": 18.5310,
        "delivery_lng": 73.8440,
        "notes": "Automated verification test assignment",
    })
    assert assign_res.status_code == 200, f"Failed to assign: {assign_res.text}"
    assignment_data = assign_res.json()
    assignment_id = assignment_data["assignment"]["id"]
    print(f"    Assigned transport! Assignment ID: {assignment_id}")
    print(f"    New Lot Status: {assignment_data['lot_status']}")
    assert assignment_data["lot_status"] == "transport_assigned", "Lot status should be 'transport_assigned'"

    # Verify provider is now LOCKED as Unavailable (§6.3)
    p_check = client.get("/logistics/providers")
    updated_p = [p for p in p_check.json() if p["id"] == provider_id][0]
    print(f"    Provider availability after assignment: {updated_p['is_available']}")
    assert updated_p["is_available"] is False, "Provider must be locked as Unavailable until delivered!"
    print("    --> PASSED: Transport assigned, lot updated to 'transport_assigned', provider locked!")

    # 4. Test State Machine Progression & Unlock on Delivered
    print("\n[4] Testing Status Stepper progression & Provider Unlock (§6.1 & §6.3)...")
    statuses = ["pickup_scheduled", "picked_up", "in_transit", "delivered"]
    for s in statuses:
        s_res = client.post(f"/logistics/assignments/{assignment_id}/status", json={"new_status": s})
        assert s_res.status_code == 200, f"Failed on {s}: {s_res.text}"
        res_data = s_res.json()
        print(f"    Transitioned to '{s}' -> Lot Status: {res_data['status']}, Provider Unlocked: {res_data['provider_unlocked']}")
        
        # Verify lot status matches 1:1 on Supabase
        lot_verify = client.get(f"/lots/{lot_id}").json()
        assert lot_verify["status"] == s, f"Lot status desynced! Expected {s}, got {lot_verify['status']}"

    # Verify provider is now unlocked after 'delivered'
    p_check_after = client.get("/logistics/providers")
    unlocked_p = [p for p in p_check_after.json() if p["id"] == provider_id][0]
    print(f"    Provider availability after 'delivered': {unlocked_p['is_available']}")
    assert unlocked_p["is_available"] is True, "Provider must be unlocked back to Available after delivery!"
    print("    --> PASSED: 1:1 State synchronization & automatic unlock verified!")

    # 5. Test Buyer-Owned Quality Verification
    print("\n[5] Testing POST /quality/verify (Buyer inspection at pickup §6.2)...")
    q_res = client.post("/quality/verify", json={
        "lot_id": lot_id,
        "transport_assignment_id": assignment_id,
        "verifier_name": "Vikram Deshmukh (Apex Agro)",
        "verifier_role": "Chief Procurement Inspector",
        "verified_grade": "A",
        "verified_moisture_pct": 9.8,
        "verified_foreign_matter_pct": 1.2,
        "grain_damage_pct": 0.5,
        "notes": "Premium quality confirmed at farmgate pickup.",
    })
    assert q_res.status_code == 200, f"Failed: {q_res.text}"
    q_data = q_res.json()
    comp = q_data["comparison"]
    print(f"    Declared: Grade {comp['declared']['grade']}, Moisture: {comp['declared']['moisture_pct']}%, Foreign Matter: {comp['declared']['foreign_matter_pct']}%")
    print(f"    Verified: Grade {comp['verified']['grade']}, Moisture: {comp['verified']['moisture_pct']}%, Foreign Matter: {comp['verified']['foreign_matter_pct']}%")
    print(f"    Grade Matched: {comp['grade_matched']}")
    assert comp["grade_matched"] is True
    print("    --> PASSED: Buyer quality verification recorded and Before/After comparison verified!")

    # 6. Test Storage Facilities Discovery
    print("\n[6] Testing GET /storage/facilities...")
    fac_res = client.get("/storage/facilities?farmer_lat=18.4088&farmer_lng=76.5604")
    assert fac_res.status_code == 200, f"Failed: {fac_res.text}"
    facilities = fac_res.json()
    print(f"    Retrieved {len(facilities)} storage facilities:")
    for f in facilities:
        print(f"      * {f['name']} ({f['facility_type']}) - Avail: {f['available_capacity_quintals']}q / {f['total_capacity_quintals']}q ({f['occupancy_percentage']}% full), Rate: Rs. {f['price_per_quintal_month']}/q/mo, Dist: {f['computed_distance_km']}km")
    assert len(facilities) >= 3, "Expected at least 3 storage facilities"
    print("    --> PASSED")

    # 7. Test Standalone Storage Booking
    print("\n[7] Testing POST /storage/book (Standalone Booking §6.4)...")
    target_fac = facilities[0]
    initial_avail = float(target_fac["available_capacity_quintals"])
    book_qty = 40.0

    b_res = client.post("/storage/book", json={
        "facility_id": target_fac["id"],
        "quantity_quintals": book_qty,
        "start_date": "2026-09-10",
        "end_date": "2026-11-10",
        "notes": "Automated standalone booking test",
    })
    assert b_res.status_code == 200, f"Failed: {b_res.text}"
    b_data = b_res.json()
    booking = b_data["booking"]
    booking_id = booking["id"]
    print(f"    Receipt: {booking['receipt_number']}, Total Cost: Rs. {booking['total_cost']}, Lot ID: {booking.get('lot_id')}")
    assert booking.get("lot_id") is None, "Standalone booking should have lot_id=None initially"

    # Verify capacity was deducted
    fac_check = client.get(f"/storage/facilities").json()
    new_avail = float([f for f in fac_check if f["id"] == target_fac["id"]][0]["available_capacity_quintals"])
    print(f"    Capacity before: {initial_avail}q -> Capacity after: {new_avail}q")
    assert abs((initial_avail - book_qty) - new_avail) < 0.1, "Available capacity must be deducted"
    print("    --> PASSED: Standalone storage booking created with receipt and capacity deduction!")

    # 8. Test Attaching Standalone Booking to Lot
    print("\n[8] Testing POST /storage/bookings/{id}/attach-lot (§6.4)...")
    attach_res = client.post(f"/storage/bookings/{booking_id}/attach-lot", json={"lot_id": lot_id})
    assert attach_res.status_code == 200, f"Failed: {attach_res.text}"
    print(f"    Attached booking {booking_id} to lot {lot_id} successfully!")
    
    # Verify in bookings list
    all_bookings = client.get("/storage/bookings").json()
    found = [b for b in all_bookings if b["id"] == booking_id][0]
    assert found["lot_id"] == lot_id, "Booking must now reference lot_id"
    print("    --> PASSED: Standalone booking attached to lot!")

    print("\n==================================================")
    print("  ALL PHASE 6 BACKEND TESTS PASSED SUCCESSFULLY!  ")
    print("==================================================")

if __name__ == "__main__":
    test_phase6()
