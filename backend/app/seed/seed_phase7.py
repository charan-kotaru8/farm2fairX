"""
Seed script for Phase 7: Admin & Grievances.
Seeds:
1. 4 realistic grievances:
   - 1 SLA-breached ticket (>48 hours overdue) to demo the red pulsing SLA alert (§7.3).
   - 2 active tickets within SLA window.
   - 1 resolved ticket with resolution notes (§7.6).
2. Realistic in-app notifications (§7.5).

Usage: cd backend && python -m app.seed.seed_phase7
"""
from datetime import datetime, timedelta
from app.core.supabase_client import get_supabase_admin

def seed_phase7():
    sb = get_supabase_admin()
    print("Starting Phase 7 seeding: Admin & Grievances...")
    now = datetime.utcnow()

    # ─── 1. Seed Grievances ───────────────────────────────────
    print("\n1. Seeding Grievances...")
    grievances = [
        # Ticket 1: OVERDUE / SLA BREACHED (Created 3 days ago, SLA was 48 hrs)
        {
            "id": "bbbbbbbb-0000-0000-0000-000000000001",
            "ticket_number": "GRV-2026-0881",
            "user_name": "Rameshwar Jadhav",
            "user_role": "farmer",
            "user_phone": "+91 98221 11001",
            "category": "Delayed Payment",
            "subject": "UPI remittance not received after delivery confirmation",
            "description": "Buyer accepted lot 3 days ago under Immediate UPI terms, but payment of Rs. 1,47,600 has not reflected in bank account. Mandi receipt has already been signed.",
            "status": "open",
            # Created 72 hours ago, SLA was 48 hours -> Breached!
            "created_at": (now - timedelta(hours=72)).isoformat(),
            "sla_deadline": (now - timedelta(hours=24)).isoformat(),
            "updated_at": (now - timedelta(hours=72)).isoformat(),
        },
        # Ticket 2: Quality Dispute (Within SLA, 42 hrs remaining)
        {
            "id": "bbbbbbbb-0000-0000-0000-000000000002",
            "ticket_number": "GRV-2026-0882",
            "user_name": "Apex Agro Processors Ltd.",
            "user_role": "buyer",
            "user_phone": "+91 94231 99002",
            "category": "Quality Dispute",
            "subject": "Moisture variance observed at farmgate pickup inspection",
            "description": "Inspection at pickup indicated 10.8% moisture against 9.5% declared in lot description. Requesting standardized deduction as per APMC bye-laws.",
            "status": "in_review",
            "created_at": (now - timedelta(hours=6)).isoformat(),
            "sla_deadline": (now + timedelta(hours=42)).isoformat(),
            "updated_at": (now - timedelta(hours=2)).isoformat(),
        },
        # Ticket 3: Pickup Delay (Within SLA, 36 hrs remaining)
        {
            "id": "bbbbbbbb-0000-0000-0000-000000000003",
            "ticket_number": "GRV-2026-0883",
            "user_name": "Suresh Patil",
            "user_role": "farmer",
            "user_phone": "+91 98221 11002",
            "category": "Pickup Delay",
            "subject": "Truck delayed by 6 hours, bags stored outside farmgate",
            "description": "Assigned transporter was scheduled for 9:00 AM pickup. Driver arrived late citing highway checkpost backlog. Risk of rain damage to gunny bags.",
            "status": "open",
            "created_at": (now - timedelta(hours=12)).isoformat(),
            "sla_deadline": (now + timedelta(hours=36)).isoformat(),
            "updated_at": (now - timedelta(hours=12)).isoformat(),
        },
        # Ticket 4: Resolved with Resolution Notes (§7.6)
        {
            "id": "bbbbbbbb-0000-0000-0000-000000000004",
            "ticket_number": "GRV-2026-0880",
            "user_name": "Tukaram Kadam",
            "user_role": "farmer",
            "user_phone": "+91 98221 11003",
            "category": "Price Mismatch",
            "subject": "Deduction of APMC user cess from accepted invoice",
            "description": "Buyer deducted 1.5% market cess from final settlement. Farmer clarified contract terms were farmgate net of cess.",
            "status": "resolved",
            "created_at": (now - timedelta(days=5)).isoformat(),
            "sla_deadline": (now - timedelta(days=3)).isoformat(),
            "resolution_notes": "Admin contacted buyer accounts. Buyer agreed farmgate terms were exclusive of mandi cess and remitted Rs. 1,480 difference directly to farmer account via IMPS. Issue closed.",
            "resolved_by": "Admin Support Officer (Pooja Rao)",
            "resolved_at": (now - timedelta(days=4)).isoformat(),
            "satisfaction_rating": 5,
            "updated_at": (now - timedelta(days=4)).isoformat(),
        },
    ]

    sb.table("grievances").upsert(grievances).execute()
    print(f"  [OK] Seeded {len(grievances)} grievances:")
    print("     - 1 SLA-BREACHED ticket (GRV-2026-0881, 72h old, Delayed Payment)")
    print("     - 2 In-SLA tickets (Quality Dispute, Pickup Delay)")
    print("     - 1 Resolved ticket with audit remarks (Price Mismatch)")

    # ─── 2. Seed Notifications ────────────────────────────────
    print("\n2. Seeding Notifications...")
    notifications = [
        {
            "id": "cccccccc-0000-0000-0000-000000000001",
            "title": "Winning Offer Received",
            "message": "Apex Agro Processors Ltd. offered Rs. 4,920/q for your 25q Soybean lot.",
            "category": "transaction",
            "link_url": "/farmer/lots",
            "is_read": False,
            "created_at": (now - timedelta(hours=2)).isoformat(),
        },
        {
            "id": "cccccccc-0000-0000-0000-000000000002",
            "title": "Transport Assigned",
            "message": "Shree Ganesh Agri Logistics (Tata 407) has been assigned for farmgate collection.",
            "category": "transaction",
            "link_url": "/farmer/logistics",
            "is_read": False,
            "created_at": (now - timedelta(hours=4)).isoformat(),
        },
        {
            "id": "cccccccc-0000-0000-0000-000000000003",
            "title": "Grievance Ticket Resolved",
            "message": "Ticket GRV-2026-0880 has been resolved by Admin Support Desk.",
            "category": "grievance",
            "link_url": "/admin/grievances",
            "is_read": True,
            "created_at": (now - timedelta(days=4)).isoformat(),
        },
        {
            "id": "cccccccc-0000-0000-0000-000000000004",
            "title": "Price Trend Alert",
            "message": "Soybean modal price increased +Rs. 110/q across Latur & Renapur APMC.",
            "category": "price_alert",
            "link_url": "/farmer/market-intel",
            "is_read": True,
            "created_at": (now - timedelta(days=1)).isoformat(),
        },
    ]
    sb.table("notifications").upsert(notifications).execute()
    print(f"  [OK] Seeded {len(notifications)} notifications.")

    print("\n[OK] Phase 7 seeding completed successfully!")

if __name__ == "__main__":
    seed_phase7()
