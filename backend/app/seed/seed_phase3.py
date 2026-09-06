"""
Seed script for Phase 3: Buyer Marketplace and Verification.
Seeds buyers crossing the Trusted Partner thresholds (5+ deals, 4.5+ rating),
runs recompute_verification_tier to establish actual earned tiers,
seeds buyer requirements, and creates competing offers on Ramesh's Soybean lot.

Usage: cd backend && .\\venv\\Scripts\\python.exe -m app.seed.seed_phase3
"""
import uuid
from datetime import datetime, timedelta
from app.core.supabase_client import get_supabase_admin
from app.buyers.verification import recompute_verification_tier


def seed_phase3():
    sb = get_supabase_admin()
    print("Starting Phase 3 seeding...")

    # ─── 1. Seed Buyers ─────────────────────────────────────────
    # Deterministic UUIDs so reruns are idempotent
    buyer_apex_id = "11111111-0000-0000-0000-000000000001"
    buyer_mgt_id = "11111111-0000-0000-0000-000000000002"
    buyer_sahyadri_id = "11111111-0000-0000-0000-000000000003"
    buyer_kisan_id = "11111111-0000-0000-0000-000000000004"

    buyers = [
        # Buyer 1: Meets & crosses Trusted Partner thresholds (8 deals >= 5, 4.9 rating >= 4.5)
        {
            "id": buyer_apex_id,
            "business_name": "Apex Agro Processors Ltd.",
            "business_type": "Processor & Exporter",
            "gst_number": "27AAACA1234F1Z8",
            "pan_number": "AAACA1234F",
            "contact_person": "Sunil Deshmukh",
            "phone": "+91 98230 45678",
            "email": "sunil@apexagro.in",
            "city": "Latur",
            "district": "Latur",
            "state": "Maharashtra",
            "verification_status": "approved",
            "business_info_verified": True,
            "location_verified": True,
            "document_verified": True,
            "completed_transactions": 8,
            "avg_rating": 4.9,
            "admin_note": "Verified by Admin (GST + Mandi License inspected)",
            "document_url": "https://storage.farm2fair.in/docs/apex_license.pdf"
        },
        # Buyer 2: Approved, high rating (4.7) but only 3 deals (< 5 required for Trusted Partner)
        {
            "id": buyer_mgt_id,
            "business_name": "Maharashtra Grain Traders",
            "business_type": "Wholesale Trader",
            "gst_number": "27AABCM5678G2Z1",
            "pan_number": "AABCM5678G",
            "contact_person": "Vikas Agarwal",
            "phone": "+91 98500 12345",
            "email": "vikas@mgtraders.com",
            "city": "Pune",
            "district": "Pune",
            "state": "Maharashtra",
            "verification_status": "approved",
            "business_info_verified": True,
            "location_verified": True,
            "document_verified": True,
            "completed_transactions": 3,
            "avg_rating": 4.7,
            "admin_note": "Verified by Admin (Trade License valid)",
            "document_url": "https://storage.farm2fair.in/docs/mgt_license.pdf"
        },
        # Buyer 3: Pending verification (waiting for document check)
        {
            "id": buyer_sahyadri_id,
            "business_name": "Sahyadri Agro Mart",
            "business_type": "Retailer & Distributor",
            "gst_number": "27AABCS9012H3Z4",
            "pan_number": "AABCS9012H",
            "contact_person": "Rohan Shinde",
            "phone": "+91 97650 98765",
            "email": "rohan@sahyadriagro.in",
            "city": "Nashik",
            "district": "Nashik",
            "state": "Maharashtra",
            "verification_status": "pending",
            "business_info_verified": True,
            "location_verified": True,
            "document_verified": False,
            "completed_transactions": 0,
            "avg_rating": 0.0,
            "admin_note": "Awaiting admin review of uploaded FSSAI certificate",
            "document_url": "https://storage.farm2fair.in/docs/sahyadri_fssai.pdf"
        },
        # Buyer 4: Needs more information
        {
            "id": buyer_kisan_id,
            "business_name": "Kisan Direct Aggregators",
            "business_type": "Aggregator",
            "gst_number": "27AACCK3456J1Z9",
            "pan_number": "AACCK3456J",
            "contact_person": "Anil Gaikwad",
            "phone": "+91 94220 33445",
            "email": "anil@kisandirect.com",
            "city": "Solapur",
            "district": "Solapur",
            "state": "Maharashtra",
            "verification_status": "more_info_requested",
            "business_info_verified": True,
            "location_verified": False,
            "document_verified": False,
            "completed_transactions": 0,
            "avg_rating": 0.0,
            "admin_note": "Please upload clear scanned copy of APMC trade license showing Solapur jurisdiction.",
            "document_url": None
        }
    ]

    print("Upserting buyers...")
    sb.table("buyers").upsert(buyers).execute()

    # ─── 2. Run Recompute Tier Logic on all buyers ─────────────
    print("Executing recompute_verification_tier logic...")
    for b in buyers:
        res = recompute_verification_tier(b["id"])
        print(f"  [{res['business_name']}] Status: {res['verification_status']} -> Tier: {res['current_tier']} ({res['reason'][:75]}...)")

    # ─── 3. Buyer Requirements ─────────────────────────────────
    print("Seeding buyer procurement requirements...")
    crops = sb.table("crops").select("id, name").execute().data
    crop_map = {c["name"]: c["id"] for c in crops}
    soybean_id = crop_map.get("Soybean")
    cotton_id = crop_map.get("Cotton")

    requirements = [
        {
            "id": "22222222-0000-0000-0000-000000000001",
            "buyer_id": buyer_apex_id,
            "crop_id": soybean_id,
            "quantity_quintals": 100,
            "quality_grade": "A",
            "preferred_district": "Latur",
            "max_price_per_quintal": 4900,
            "status": "open",
            "notes": "Urgent requirement for processing plant. Farmgate collection available."
        },
        {
            "id": "22222222-0000-0000-0000-000000000002",
            "buyer_id": buyer_mgt_id,
            "crop_id": soybean_id,
            "quantity_quintals": 80,
            "quality_grade": "A",
            "preferred_district": "Any",
            "max_price_per_quintal": 4800,
            "status": "open",
            "notes": "Weekly procurement for wholesale distribution."
        },
        {
            "id": "22222222-0000-0000-0000-000000000003",
            "buyer_id": buyer_sahyadri_id,
            "crop_id": cotton_id,
            "quantity_quintals": 50,
            "quality_grade": "A",
            "preferred_district": "Nashik",
            "max_price_per_quintal": 7400,
            "status": "open",
            "notes": "Requirement for regional textile supply chain."
        }
    ]
    sb.table("buyer_requirements").upsert(requirements).execute()
    print(f"  Inserted {len(requirements)} buyer requirements.")

    # ─── 4. Competing Offers on Ramesh's Demo Lot ──────────────
    print("Finding Ramesh demo lot...")
    lots = sb.table("lots").select("id, crop_id, quantity, status").execute().data
    if lots:
        target_lot = lots[0]
        lot_id = target_lot["id"]
        today = datetime.utcnow().date()
        validity = str(today + timedelta(days=5))

        offers = [
            {
                "id": "33333333-0000-0000-0000-000000000001",
                "lot_id": lot_id,
                "buyer_id": buyer_apex_id,
                "price_per_quintal": 4850,
                "offered_quantity": target_lot.get("quantity") or 50,
                "payment_terms": "Immediate UPI",
                "pickup_terms": "Farmgate Pickup",
                "valid_until": validity,
                "notes": "Can collect tomorrow morning directly from your farm gate. Instant digital payment upon dispatch.",
                "status": "submitted"
            },
            {
                "id": "33333333-0000-0000-0000-000000000002",
                "lot_id": lot_id,
                "buyer_id": buyer_mgt_id,
                "price_per_quintal": 4780,
                "offered_quantity": target_lot.get("quantity") or 50,
                "payment_terms": "Escrow on delivery",
                "pickup_terms": "Buyer Warehouse",
                "valid_until": validity,
                "notes": "Reliable wholesale trade. Payment held in secure escrow, released upon weighment check at warehouse.",
                "status": "submitted"
            }
        ]
        sb.table("buyer_offers").upsert(offers).execute()
        sb.table("lots").update({"status": "offer_received"}).eq("id", lot_id).execute()
        print(f"  Created 2 competing offers on lot {lot_id} and updated lot status to 'offer_received'.")

    print("\nPhase 3 seed completed successfully!")


if __name__ == "__main__":
    seed_phase3()
