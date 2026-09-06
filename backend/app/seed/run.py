"""
Seed script for Farm2Fair Phase 2.
Creates tables and populates realistic demo data for Maharashtra APMCs.

Usage: cd backend && .\venv\Scripts\python.exe -m app.seed.run
"""
import uuid
import random
from datetime import datetime, timedelta
from app.core.supabase_client import get_supabase_admin


def run_seed():
    sb = get_supabase_admin()

    # ─── 1. Crops ────────────────────────────────────────────
    crops = [
        {"id": str(uuid.uuid4()), "name": "Soybean", "category": "Oilseed", "unit": "quintal", "icon": "🫘"},
        {"id": str(uuid.uuid4()), "name": "Cotton", "category": "Fibre", "unit": "quintal", "icon": "🧶"},
        {"id": str(uuid.uuid4()), "name": "Tur Dal", "category": "Pulse", "unit": "quintal", "icon": "🫛"},
        {"id": str(uuid.uuid4()), "name": "Wheat", "category": "Cereal", "unit": "quintal", "icon": "🌾"},
        {"id": str(uuid.uuid4()), "name": "Onion", "category": "Vegetable", "unit": "quintal", "icon": "🧅"},
    ]

    # ─── 2. Markets (Maharashtra APMCs) ──────────────────────
    markets = [
        {"id": str(uuid.uuid4()), "name": "Latur APMC", "district": "Latur", "state": "Maharashtra",
         "lat": 18.4088, "lng": 76.5604, "type": "APMC"},
        {"id": str(uuid.uuid4()), "name": "Pune Market Yard", "district": "Pune", "state": "Maharashtra",
         "lat": 18.5089, "lng": 73.8300, "type": "APMC"},
        {"id": str(uuid.uuid4()), "name": "Nashik APMC", "district": "Nashik", "state": "Maharashtra",
         "lat": 19.9975, "lng": 73.7898, "type": "APMC"},
        {"id": str(uuid.uuid4()), "name": "Solapur APMC", "district": "Solapur", "state": "Maharashtra",
         "lat": 17.6599, "lng": 75.9064, "type": "APMC"},
        {"id": str(uuid.uuid4()), "name": "Nagpur APMC", "district": "Nagpur", "state": "Maharashtra",
         "lat": 21.1458, "lng": 79.0882, "type": "APMC"},
    ]

    # ─── 3. Upsert crops & markets ───────────────────────────
    print("Seeding crops...")
    sb.table("crops").upsert(crops, on_conflict="name").execute()

    print("Seeding markets...")
    sb.table("markets").upsert(markets, on_conflict="name").execute()

    # Fetch inserted IDs back (in case of conflict, ids may differ)
    fetched_crops = sb.table("crops").select("*").execute().data
    fetched_markets = sb.table("markets").select("*").execute().data

    crop_map = {c["name"]: c["id"] for c in fetched_crops}
    market_map = {m["name"]: m["id"] for m in fetched_markets}

    # ─── 4. Market Prices (30 days per crop-market pair) ─────
    print("Seeding market prices (30 days)...")
    base_prices = {
        "Soybean": 4650, "Cotton": 7200, "Tur Dal": 6800, "Wheat": 2400, "Onion": 1800,
    }
    market_price_offsets = {
        "Latur APMC": 0, "Pune Market Yard": 130, "Nashik APMC": 60,
        "Solapur APMC": -40, "Nagpur APMC": 90,
    }

    all_prices = []
    all_arrivals = []
    today = datetime.utcnow().date()

    for crop_name, base in base_prices.items():
        for mkt_name, offset in market_price_offsets.items():
            running_price = base + offset
            for day_offset in range(30, 0, -1):
                date = today - timedelta(days=day_offset)
                # Slight upward trend for Soybean (demo scenario), random walk otherwise
                if crop_name == "Soybean":
                    change = random.uniform(-15, 30)  # net upward bias
                else:
                    change = random.uniform(-40, 40)
                running_price = max(running_price + change, base * 0.85)
                running_price = min(running_price, base * 1.20)

                all_prices.append({
                    "id": str(uuid.uuid4()),
                    "crop_id": crop_map[crop_name],
                    "market_id": market_map[mkt_name],
                    "date": str(date),
                    "min_price": round(running_price * 0.94),
                    "max_price": round(running_price * 1.06),
                    "modal_price": round(running_price),
                })

                arrivals_qty = random.randint(80, 500) if crop_name != "Onion" else random.randint(200, 1200)
                demand_level = random.choice(["Low", "Medium", "High"])
                all_arrivals.append({
                    "id": str(uuid.uuid4()),
                    "crop_id": crop_map[crop_name],
                    "market_id": market_map[mkt_name],
                    "date": str(date),
                    "quantity": arrivals_qty,
                    "demand_level": demand_level,
                })

    # Batch upsert in chunks of 500
    for i in range(0, len(all_prices), 500):
        sb.table("market_prices").upsert(all_prices[i:i+500]).execute()
    print(f"  Inserted {len(all_prices)} market_prices rows.")

    for i in range(0, len(all_arrivals), 500):
        sb.table("market_arrivals").upsert(all_arrivals[i:i+500]).execute()
    print(f"  Inserted {len(all_arrivals)} market_arrivals rows.")

    # ─── 5. Sample lot for Ramesh scenario ───────────────────
    print("Seeding sample lot (Ramesh / Soybean / 5 tonnes)...")
    sample_lot = {
        "id": str(uuid.uuid4()),
        "farmer_id": "00000000-0000-0000-0000-000000000001",  # placeholder demo farmer
        "crop_id": crop_map["Soybean"],
        "quantity": 50,  # 50 quintals = 5 tonnes
        "quality_grade": "A",
        "status": "active",
        "harvest_date": str(today - timedelta(days=5)),
        "available_from": str(today),
        "available_until": str(today + timedelta(days=15)),
        "storage_required": False,
        "description": "Fresh Soybean harvest, Grade A quality. Ramesh Patil's demo lot.",
        "created_at": datetime.utcnow().isoformat(),
    }
    sb.table("lots").upsert([sample_lot]).execute()

    print("\n✅ Seed complete! All demo data is ready.")


if __name__ == "__main__":
    run_seed()
