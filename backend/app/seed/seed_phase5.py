"""
Seed script for Phase 5: FPO Aggregation.
1. Seeds 1 FPO: 'Kisan Vikas Farmer Producer Co.' in Latur.
2. Seeds 6 member farmers with realistic member lots:
   - 4 Soybean Grade A lots with harvest dates within 7 days (eligible for aggregation).
   - 1 Soybean Grade B lot (ineligible: different grade).
   - 1 Soybean Grade A lot harvested 22 days prior (ineligible: outside 7-day harvest window).
   - 1 Cotton lot (ineligible: different crop).
3. Seeds 1 already-aggregated lot with an accepted buyer offer and escrow member payout splits,
   demonstrating the complete lifecycle and payout transparency.
4. Ensures bulk buyer procurement requirements to reflect the +₹170/q bulk premium.

Usage: cd backend && python -m app.seed.seed_phase5
"""
import uuid
from datetime import datetime, timedelta
from app.core.supabase_client import get_supabase_admin

FPO_ID = "44444444-0000-0000-0000-000000000001"
MEMBER_1_ID = "44444444-0000-0000-0000-000000000011"
MEMBER_2_ID = "44444444-0000-0000-0000-000000000012"
MEMBER_3_ID = "44444444-0000-0000-0000-000000000013"
MEMBER_4_ID = "44444444-0000-0000-0000-000000000014"
MEMBER_5_ID = "44444444-0000-0000-0000-000000000015"
MEMBER_6_ID = "44444444-0000-0000-0000-000000000016"

# Completed aggregated lot for showcasing payout breakdown
AGG_LOT_ID = "55555555-0000-0000-0000-000000000001"
AGG_OFFER_ID = "55555555-0000-0000-0000-000000000002"

BUYER_APEX_ID = "11111111-0000-0000-0000-000000000001"
BUYER_MGT_ID = "11111111-0000-0000-0000-000000000002"


def seed_phase5():
    sb = get_supabase_admin()
    print("Starting Phase 5 seeding...")

    # Fetch crop IDs
    crops = sb.table("crops").select("id, name").execute().data or []
    crop_map = {c["name"]: c["id"] for c in crops}
    soybean_id = crop_map.get("Soybean")
    cotton_id = crop_map.get("Cotton")

    if not soybean_id:
        print("  [WARN] Soybean crop not found! Please ensure initial crops are seeded.")
        return

    # ─── 1. Seed FPO ─────────────────────────────────────────
    print("\n1. Seeding FPO: Kisan Vikas Farmer Producer Co....")
    fpo_data = {
        "id": FPO_ID,
        "name": "Kisan Vikas Farmer Producer Co.",
        "registration_number": "FPO-MH-2023-0891",
        "district": "Latur",
        "state": "Maharashtra",
        "contact_person": "Balasaheb Shinde (Chairman)",
        "phone": "+91 94231 78901",
        "total_members": 6,
    }
    sb.table("fpos").upsert(fpo_data).execute()
    print("  [OK] FPO seeded.")

    # ─── 2. Seed FPO Members ─────────────────────────────────
    print("\n2. Seeding 6 FPO member farmers...")
    members = [
        {
            "id": MEMBER_1_ID,
            "fpo_id": FPO_ID,
            "farmer_name": "Rameshwar Jadhav",
            "village": "Ausa",
            "district": "Latur",
            "phone": "+91 98221 11001",
            "primary_crop": "Soybean",
            "farm_size_acres": 5.0,
            "avatar_initials": "RJ",
        },
        {
            "id": MEMBER_2_ID,
            "fpo_id": FPO_ID,
            "farmer_name": "Suresh Patil",
            "village": "Renapur",
            "district": "Latur",
            "phone": "+91 98221 11002",
            "primary_crop": "Soybean",
            "farm_size_acres": 6.5,
            "avatar_initials": "SP",
        },
        {
            "id": MEMBER_3_ID,
            "fpo_id": FPO_ID,
            "farmer_name": "Tukaram Kadam",
            "village": "Shirur Anantpal",
            "district": "Latur",
            "phone": "+91 98221 11003",
            "primary_crop": "Soybean",
            "farm_size_acres": 4.0,
            "avatar_initials": "TK",
        },
        {
            "id": MEMBER_4_ID,
            "fpo_id": FPO_ID,
            "farmer_name": "Pandurang Deshmukh",
            "village": "Nilanga",
            "district": "Latur",
            "phone": "+91 98221 11004",
            "primary_crop": "Soybean",
            "farm_size_acres": 7.2,
            "avatar_initials": "PD",
        },
        {
            "id": MEMBER_5_ID,
            "fpo_id": FPO_ID,
            "farmer_name": "Vitthal Shinde",
            "village": "Ausa",
            "district": "Latur",
            "phone": "+91 98221 11005",
            "primary_crop": "Soybean",
            "farm_size_acres": 3.5,
            "avatar_initials": "VS",
        },
        {
            "id": MEMBER_6_ID,
            "fpo_id": FPO_ID,
            "farmer_name": "Eknath Gaikwad",
            "village": "Chakur",
            "district": "Latur",
            "phone": "+91 98221 11006",
            "primary_crop": "Cotton",
            "farm_size_acres": 8.0,
            "avatar_initials": "EG",
        },
    ]
    sb.table("fpo_members").upsert(members).execute()
    print(f"  [OK] Seeded {len(members)} FPO members.")

    # ─── 3. Seed Realistic Member Lots ───────────────────────
    print("\n3. Seeding candidate member lots...")
    today = datetime.utcnow().date()
    
    # Clean up any previous test lots and transaction splits for this FPO
    sb.table("lots").update({"parent_aggregated_lot_id": None}).eq("fpo_id", FPO_ID).execute()
    sb.table("lots").delete().eq("fpo_id", FPO_ID).execute()

    candidate_lots = [
        # Eligible Batch: 4 Soybean Grade A lots harvested within 3 days (window <= 7 days)
        {
            "id": "44444444-0000-0000-0000-000000000101",
            "fpo_id": FPO_ID,
            "fpo_member_id": MEMBER_1_ID,
            "crop_id": soybean_id,
            "quantity": 25.0,
            "quality_grade": "A",
            "harvest_date": str(today - timedelta(days=3)),
            "available_from": str(today - timedelta(days=1)),
            "storage_required": False,
            "is_aggregated": False,
            "status": "active",
            "description": "Rameshwar's clean JS-335 Soybean lot, moisture 10.2%, double-sieved.",
        },
        {
            "id": "44444444-0000-0000-0000-000000000102",
            "fpo_id": FPO_ID,
            "fpo_member_id": MEMBER_2_ID,
            "crop_id": soybean_id,
            "quantity": 30.0,
            "quality_grade": "A",
            "harvest_date": str(today - timedelta(days=5)),
            "available_from": str(today - timedelta(days=2)),
            "storage_required": False,
            "is_aggregated": False,
            "status": "active",
            "description": "Suresh's prime harvest, dried on clean tarpaulins, 99% grain purity.",
        },
        {
            "id": "44444444-0000-0000-0000-000000000103",
            "fpo_id": FPO_ID,
            "fpo_member_id": MEMBER_3_ID,
            "crop_id": soybean_id,
            "quantity": 20.0,
            "quality_grade": "A",
            "harvest_date": str(today - timedelta(days=2)),
            "available_from": str(today),
            "storage_required": False,
            "is_aggregated": False,
            "status": "active",
            "description": "Tukaram's Grade A yellow soybean, freshly bagged in standard 50kg gunny bags.",
        },
        {
            "id": "44444444-0000-0000-0000-000000000104",
            "fpo_id": FPO_ID,
            "fpo_member_id": MEMBER_4_ID,
            "crop_id": soybean_id,
            "quantity": 25.0,
            "quality_grade": "A",
            "harvest_date": str(today - timedelta(days=4)),
            "available_from": str(today - timedelta(days=1)),
            "storage_required": False,
            "is_aggregated": False,
            "status": "active",
            "description": "Pandurang's premium export-ready lot, moisture 9.8%, zero fungal damage.",
        },
        # Ineligible 1: Grade B (Grade mismatch)
        {
            "id": "44444444-0000-0000-0000-000000000105",
            "fpo_id": FPO_ID,
            "fpo_member_id": MEMBER_5_ID,
            "crop_id": soybean_id,
            "quantity": 20.0,
            "quality_grade": "B",
            "harvest_date": str(today - timedelta(days=3)),
            "available_from": str(today - timedelta(days=1)),
            "storage_required": False,
            "is_aggregated": False,
            "status": "active",
            "description": "Vitthal's Grade B lot, minor discoloration from late rain.",
        },
        # Ineligible 2: Harvest date 22 days ago (Harvest date outside 7 days)
        {
            "id": "44444444-0000-0000-0000-000000000106",
            "fpo_id": FPO_ID,
            "fpo_member_id": MEMBER_5_ID,
            "crop_id": soybean_id,
            "quantity": 15.0,
            "quality_grade": "A",
            "harvest_date": str(today - timedelta(days=22)),
            "available_from": str(today - timedelta(days=20)),
            "storage_required": True,
            "is_aggregated": False,
            "status": "active",
            "description": "Vitthal's early-harvest lot stored in local warehouse for 3 weeks.",
        },
    ]

    if cotton_id:
        # Ineligible 3: Different crop (Cotton)
        candidate_lots.append({
            "id": "44444444-0000-0000-0000-000000000107",
            "fpo_id": FPO_ID,
            "fpo_member_id": MEMBER_6_ID,
            "crop_id": cotton_id,
            "quantity": 40.0,
            "quality_grade": "A",
            "harvest_date": str(today - timedelta(days=3)),
            "available_from": str(today),
            "storage_required": False,
            "is_aggregated": False,
            "status": "active",
            "description": "Eknath's long-staple cotton lot.",
        })

    sb.table("lots").upsert(candidate_lots).execute()
    print(f"  [OK] Seeded {len(candidate_lots)} candidate member lots:")
    print("     - 4 eligible Soybean Grade A lots (25q + 30q + 20q + 25q = 100 quintals, harvest span: 3 days)")
    print("     - 1 ineligible Soybean Grade B lot (different grade)")
    print("     - 1 ineligible Soybean Grade A lot (harvested 22 days ago, outside 7-day window)")
    print("     - 1 ineligible Cotton lot (different crop)")

    # ─── 4. Seed 1 Completed Aggregated Lot with Escrow Payouts ──
    print("\n4. Seeding 1 established aggregated lot with accepted offer & escrow payouts...")
    
    # Aggregated parent lot
    agg_lot = {
        "id": AGG_LOT_ID,
        "fpo_id": FPO_ID,
        "crop_id": soybean_id,
        "quantity": 75.0,
        "quality_grade": "A",
        "status": "offer_accepted",
        "harvest_date": str(today - timedelta(days=10)),
        "available_from": str(today - timedelta(days=8)),
        "storage_required": False,
        "is_aggregated": True,
        "member_count": 3,
        "description": "Kisan Vikas FPO Batch #1: 75q Pooled Soybean Grade A (3 members).",
    }
    sb.table("lots").upsert(agg_lot).execute()

    # Winning offer from Apex Agro Processors Ltd.
    agg_offer = {
        "id": AGG_OFFER_ID,
        "lot_id": AGG_LOT_ID,
        "buyer_id": BUYER_APEX_ID,
        "price_per_quintal": 4920,
        "offered_quantity": 75.0,
        "payment_terms": "Escrow on delivery",
        "pickup_terms": "Farmgate Pickup",
        "valid_until": str(today + timedelta(days=3)),
        "status": "accepted",
        "notes": "Premium bulk processor rate accepted. Advance escrow deposited.",
    }
    sb.table("buyer_offers").upsert(agg_offer).execute()

    # Per-member payout splits in fpo_transaction_members
    # 75 quintals @ ₹4,920/q = ₹3,69,000 total pool value
    payout_members = [
        {
            "id": "55555555-0000-0000-0000-000000000011",
            "lot_id": AGG_LOT_ID,
            "offer_id": AGG_OFFER_ID,
            "fpo_member_id": MEMBER_1_ID,
            "farmer_name": "Rameshwar Jadhav",
            "contributed_quantity": 30.0,
            "share_percentage": 40.0,  # 30 / 75 * 100
            "price_per_quintal": 4920,
            "share_amount": 147600.0,  # 30 * 4920
            "payout_status": "escrow",
        },
        {
            "id": "55555555-0000-0000-0000-000000000012",
            "lot_id": AGG_LOT_ID,
            "offer_id": AGG_OFFER_ID,
            "fpo_member_id": MEMBER_2_ID,
            "farmer_name": "Suresh Patil",
            "contributed_quantity": 25.0,
            "share_percentage": 33.33,  # 25 / 75 * 100
            "price_per_quintal": 4920,
            "share_amount": 123000.0,  # 25 * 4920
            "payout_status": "escrow",
        },
        {
            "id": "55555555-0000-0000-0000-000000000013",
            "lot_id": AGG_LOT_ID,
            "offer_id": AGG_OFFER_ID,
            "fpo_member_id": MEMBER_3_ID,
            "farmer_name": "Tukaram Kadam",
            "contributed_quantity": 20.0,
            "share_percentage": 26.67,  # 20 / 75 * 100
            "price_per_quintal": 4920,
            "share_amount": 98400.0,   # 20 * 4920
            "payout_status": "escrow",
        },
    ]
    sb.table("fpo_transaction_members").upsert(payout_members).execute()
    print("  [OK] Seeded Batch #1 aggregated lot with 3 member payout shares (Total: Rs. 3,69,000 in escrow).")

    # ─── 5. Update Buyer Requirements for Bulk Premium ────────
    print("\n5. Ensuring bulk buyer requirements with premium pricing...")
    requirements = [
        {
            "id": "22222222-0000-0000-0000-000000000001",
            "buyer_id": BUYER_APEX_ID,
            "crop_id": soybean_id,
            "quantity_quintals": 100,
            "quality_grade": "A",
            "preferred_district": "Latur",
            "max_price_per_quintal": 4950, # 4,950/q for >=100q
            "status": "open",
            "notes": "Urgent bulk procurement for solvent extraction plant. Premium 4,950/q for batches >= 80q.",
        },
        {
            "id": "22222222-0000-0000-0000-000000000002",
            "buyer_id": BUYER_MGT_ID,
            "crop_id": soybean_id,
            "quantity_quintals": 80,
            "quality_grade": "A",
            "preferred_district": "Any",
            "max_price_per_quintal": 4880,
            "status": "open",
            "notes": "Bulk wholesale orders. Minimum 50 quintals lot size.",
        }
    ]
    sb.table("buyer_requirements").upsert(requirements).execute()
    print("  [OK] Buyer procurement requirements updated (Apex Agro: 100q @ Rs. 4,950/q, MGT: 80q @ Rs. 4,880/q).")

    print("\n[OK] Phase 5 seeding completed successfully!")


if __name__ == "__main__":
    seed_phase5()
