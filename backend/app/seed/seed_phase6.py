"""
Seed script for Phase 6: Logistics & Storage.
Seeds:
1. 4 Transport Providers with realistic Maharashtra locations, vehicle types, and capacity (1 unavailable for demoing lock).
2. 4 Storage Facilities (WDRA warehouse, cold storage, APMC godown, MSWC) with varying capacities and pricing.
3. 1 Completed Quality Verification record (buyer-inspected before/after).
4. 1 Active Transport Assignment demonstrating the unified status tracking.

Usage: cd backend && python -m app.seed.seed_phase6
"""
from datetime import datetime, timedelta
from app.core.supabase_client import get_supabase_admin

PROVIDER_1_ID = "66666666-0000-0000-0000-000000000001"
PROVIDER_2_ID = "66666666-0000-0000-0000-000000000002"
PROVIDER_3_ID = "66666666-0000-0000-0000-000000000003"
PROVIDER_4_ID = "66666666-0000-0000-0000-000000000004"

FACILITY_1_ID = "77777777-0000-0000-0000-000000000001"
FACILITY_2_ID = "77777777-0000-0000-0000-000000000002"
FACILITY_3_ID = "77777777-0000-0000-0000-000000000003"
FACILITY_4_ID = "77777777-0000-0000-0000-000000000004"

def seed_phase6():
    sb = get_supabase_admin()
    print("Starting Phase 6 seeding: Logistics & Storage...")

    # ─── 1. Seed Transport Providers ─────────────────────────
    print("\n1. Seeding Transport Providers...")
    providers = [
        {
            "id": PROVIDER_1_ID,
            "name": "Shree Ganesh Agri Logistics",
            "provider_type": "Fleet Operator",
            "vehicle_type": "Tata 407 (3.5T)",
            "vehicle_number": "MH-24-AG-4412",
            "capacity_quintals": 35.0,
            "base_fee": 750.0,
            "rate_per_km": 32.0,
            "rating": 4.9,
            "total_trips": 128,
            "phone": "+91 98230 45671",
            "district": "Latur",
            "lat": 18.4088,
            "lng": 76.5604,
            "is_available": True,
        },
        {
            "id": PROVIDER_2_ID,
            "name": "Marathwada Rural Freight Services",
            "provider_type": "AgriLogistics Co.",
            "vehicle_type": "Eicher Pro 6T (Mid-Heavy)",
            "vehicle_number": "MH-24-V-8910",
            "capacity_quintals": 60.0,
            "base_fee": 900.0,
            "rate_per_km": 38.0,
            "rating": 4.8,
            "total_trips": 94,
            "phone": "+91 98230 45672",
            "district": "Latur",
            "lat": 18.4200,
            "lng": 76.5800,
            "is_available": True,
        },
        {
            "id": PROVIDER_3_ID,
            "name": "Kisan Express Mini-Trucks",
            "provider_type": "Individual Trucker",
            "vehicle_type": "Mahindra Bolero Pickup (1.5T)",
            "vehicle_number": "MH-24-T-1204",
            "capacity_quintals": 15.0,
            "base_fee": 500.0,
            "rate_per_km": 25.0,
            "rating": 4.7,
            "total_trips": 65,
            "phone": "+91 98230 45673",
            "district": "Ausa",
            "lat": 18.2500,
            "lng": 76.5000,
            "is_available": True,
        },
        {
            "id": PROVIDER_4_ID,
            "name": "Sahyadri Bulk Freightliners",
            "provider_type": "Heavy Fleet Operator",
            "vehicle_type": "10-Wheel Heavy Truck (16T)",
            "vehicle_number": "MH-12-Q-5521",
            "capacity_quintals": 160.0,
            "base_fee": 1500.0,
            "rate_per_km": 55.0,
            "rating": 4.6,
            "total_trips": 210,
            "phone": "+91 98230 45674",
            "district": "Pune",
            "lat": 18.5204,
            "lng": 73.8567,
            # Deliberately unavailable to demo the availability lock guard (§6.3)
            "is_available": False,
        },
    ]
    sb.table("transport_providers").upsert(providers).execute()
    print(f"  [OK] Seeded {len(providers)} transport providers (3 available, 1 locked unavailable).")

    # ─── 2. Seed Storage Facilities ──────────────────────────
    print("\n2. Seeding Storage Facilities...")
    facilities = [
        {
            "id": FACILITY_1_ID,
            "name": "Latur Central WDRA Agri-Warehouse",
            "facility_type": "WDRA Certified Warehouse",
            "district": "Latur",
            "address": "MIDC Phase 2, Near APMC Yard, Latur",
            "lat": 18.4150,
            "lng": 76.5700,
            "total_capacity_quintals": 5000.0,
            "available_capacity_quintals": 2800.0,
            "price_per_quintal_month": 45.0,
            "rating": 4.9,
            "features": ["WDRA Certified", "CCTV 24/7", "Fumigation Control", "Fire Insurance Included", "e-NWR Receipts"],
            "is_available": True,
            "phone": "+91 94221 88901",
        },
        {
            "id": FACILITY_2_ID,
            "name": "Kisan Samruddhi Cold Storage & Silos",
            "facility_type": "Cold Storage Complex",
            "district": "Ausa",
            "address": "Highway Junction, Ausa, Latur District",
            "lat": 18.2450,
            "lng": 76.5100,
            "total_capacity_quintals": 3000.0,
            "available_capacity_quintals": 1400.0,
            "price_per_quintal_month": 65.0,
            "rating": 4.8,
            "features": ["Climate Controlled (4-8°C)", "Humidity Regulation", "Backup Generators", "Moisture Retention"],
            "is_available": True,
            "phone": "+91 94221 88902",
        },
        {
            "id": FACILITY_3_ID,
            "name": "Marathwada APMC Sub-Godown #4",
            "facility_type": "APMC Mandi Godown",
            "district": "Renapur",
            "address": "APMC Market Yard, Renapur",
            "lat": 18.5500,
            "lng": 76.6200,
            "total_capacity_quintals": 4000.0,
            "available_capacity_quintals": 150.0,  # Nearly full (96.25% occupied)
            "price_per_quintal_month": 35.0,
            "rating": 4.4,
            "features": ["Near Mandi Gate", "Standard Bagged Storage", "Daytime Loading Staff"],
            "is_available": True,
            "phone": "+91 94221 88903",
        },
        {
            "id": FACILITY_4_ID,
            "name": "Maharashtra State Warehousing Corp (MSWC)",
            "facility_type": "State Warehouse Godown",
            "district": "Solapur",
            "address": "Railway Goods Shed Road, Solapur",
            "lat": 17.6599,
            "lng": 75.9064,
            "total_capacity_quintals": 10000.0,
            "available_capacity_quintals": 6500.0,
            "price_per_quintal_month": 40.0,
            "rating": 4.7,
            "features": ["Government Backed", "Rail Siding Access", "Weighbridge 50T", "WDRA Negotiable"],
            "is_available": True,
            "phone": "+91 94221 88904",
        },
    ]
    sb.table("storage_facilities").upsert(facilities).execute()
    print(f"  [OK] Seeded {len(facilities)} storage facilities (1 near-capacity, 1 cold storage, 2 standard warehouses).")

    # ─── 3. Seed Existing Lot Transport & Quality Demo ───────
    print("\n3. Attaching quality verification and transport demo...")
    today = datetime.utcnow().date()
    
    # We use established lot AGG_LOT_ID (55555555-0000-0000-0000-000000000001)
    # Update lot with pickup coordinates and quality declarations
    demo_lot_id = "55555555-0000-0000-0000-000000000001"
    sb.table("lots").update({
        "pickup_lat": 18.4088,
        "pickup_lng": 76.5604,
        "pickup_address": "Kisan Vikas FPO Aggregation Hub, Ausa Road, Latur",
        "declared_moisture_pct": 10.0,
        "declared_foreign_matter_pct": 1.5,
    }).eq("id", demo_lot_id).execute()

    # Seed an assignment
    demo_assignment_id = "88888888-0000-0000-0000-000000000001"
    assignment = {
        "id": demo_assignment_id,
        "lot_id": demo_lot_id,
        "provider_id": PROVIDER_1_ID,
        "pickup_address": "Kisan Vikas FPO Aggregation Hub, Ausa Road, Latur",
        "delivery_address": "Apex Agro Solvent Extraction Plant, Plot 14, MIDC Latur",
        "pickup_lat": 18.4088,
        "pickup_lng": 76.5604,
        "delivery_lat": 18.4350,
        "delivery_lng": 76.5820,
        "estimated_distance_km": 4.2,
        "estimated_cost": 884.0, # 750 + (32 * 4.2)
        "status": "in_transit",
        "scheduled_pickup_time": str(today - timedelta(days=1)),
        "picked_up_at": str(today - timedelta(hours=3)),
        "notes": "Direct bulk pickup for solvent plant processing.",
    }
    sb.table("transport_assignments").upsert(assignment).execute()

    # Link assignment to lot and sync lot status (§6.1 single source of truth!)
    sb.table("lots").update({
        "transport_assignment_id": demo_assignment_id,
        "status": "in_transit",
    }).eq("id", demo_lot_id).execute()

    # Seed buyer-owned quality verification record (§6.2)
    quality_verification = {
        "id": "99999999-0000-0000-0000-000000000001",
        "lot_id": demo_lot_id,
        "transport_assignment_id": demo_assignment_id,
        "verifier_name": "Vikram Deshmukh",
        "verifier_role": "Chief Procurement Inspector, Apex Agro",
        "declared_grade": "A",
        "verified_grade": "A",
        "declared_moisture_pct": 10.0,
        "verified_moisture_pct": 9.8,
        "declared_foreign_matter_pct": 1.5,
        "verified_foreign_matter_pct": 1.2,
        "grain_damage_pct": 0.8,
        "grade_matched": True,
        "notes": "Grain moisture meter certified 9.8%. Clean, uniform golden-yellow seed coat. Passed premium standard.",
    }
    sb.table("lot_quality_verifications").upsert(quality_verification).execute()
    print("  [OK] Seeded demo transport assignment ('in_transit') and buyer quality verification (Grade A confirmed).")

    # ─── 4. Seed Standalone Storage Booking ──────────────────
    print("\n4. Seeding standalone storage booking...")
    crops = sb.table("crops").select("id").eq("name", "Soybean").execute().data or []
    soybean_id = crops[0]["id"] if crops else None

    storage_booking = {
        "id": "aaaaaaaa-0000-0000-0000-000000000001",
        "facility_id": FACILITY_1_ID,
        "farmer_id": "00000000-0000-0000-0000-000000000001",
        "lot_id": None, # Standalone booking (§6.4)
        "crop_id": soybean_id,
        "quantity_quintals": 50.0,
        "start_date": str(today),
        "end_date": str(today + timedelta(days=60)),
        "duration_months": 2,
        "monthly_rate_per_quintal": 45.0,
        "total_cost": 4500.0, # 50q * 45 * 2
        "status": "confirmed",
        "receipt_number": "WH-REC-2026-0891",
        "notes": "Pre-booked buffer storage awaiting seasonal peak price window.",
    }
    sb.table("storage_bookings").upsert(storage_booking).execute()
    print("  [OK] Seeded standalone storage booking (50q in Latur WDRA warehouse with e-receipt WH-REC-2026-0891).")

    print("\n[OK] Phase 6 seeding completed successfully!")

if __name__ == "__main__":
    seed_phase6()
