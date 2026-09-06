"""
Seed script for Phase 8: Expanded 10 Maharashtra Crops & APMC Benchmarks.
Crops:
1. Soybean (Oilseed)
2. Cotton (Fibre)
3. Tur Dal (Pulse)
4. Wheat (Cereal)
5. Onion (Vegetable)
6. Sugarcane (Commercial)
7. Turmeric (Spice)
8. Groundnut (Oilseed)
9. Bajra (Cereal/Millet)
10. Grapes (Fruit/Horticulture)
"""
import uuid
import random
from datetime import datetime, timedelta
from app.core.supabase_client import get_supabase_admin

CROPS_DATA = [
    {"name": "Soybean", "category": "Oilseed", "unit": "quintal", "icon": "🫘", "base_price": 4850},
    {"name": "Cotton", "category": "Fibre", "unit": "quintal", "icon": "🧶", "base_price": 7200},
    {"name": "Tur Dal", "category": "Pulse", "unit": "quintal", "icon": "🫛", "base_price": 6800},
    {"name": "Wheat", "category": "Cereal", "unit": "quintal", "icon": "🌾", "base_price": 2450},
    {"name": "Onion", "category": "Vegetable", "unit": "quintal", "icon": "🧅", "base_price": 1850},
    {"name": "Sugarcane", "category": "Commercial", "unit": "quintal", "icon": "🎋", "base_price": 3150},
    {"name": "Turmeric", "category": "Spice", "unit": "quintal", "icon": "🟡", "base_price": 13400},
    {"name": "Groundnut", "category": "Oilseed", "unit": "quintal", "icon": "🥜", "base_price": 6100},
    {"name": "Bajra", "category": "Cereal", "unit": "quintal", "icon": "🌾", "base_price": 2350},
    {"name": "Grapes", "category": "Horticulture", "unit": "quintal", "icon": "🍇", "base_price": 5800},
]

MARKETS_DATA = [
    {"name": "Latur APMC", "district": "Latur", "state": "Maharashtra", "lat": 18.4088, "lng": 76.5604, "type": "APMC"},
    {"name": "Pune Market Yard", "district": "Pune", "state": "Maharashtra", "lat": 18.5089, "lng": 73.8300, "type": "APMC"},
    {"name": "Nashik APMC", "district": "Nashik", "state": "Maharashtra", "lat": 19.9975, "lng": 73.7898, "type": "APMC"},
    {"name": "Solapur APMC", "district": "Solapur", "state": "Maharashtra", "lat": 17.6599, "lng": 75.9064, "type": "APMC"},
    {"name": "Nagpur APMC", "district": "Nagpur", "state": "Maharashtra", "lat": 21.1458, "lng": 79.0882, "type": "APMC"},
    {"name": "Kolhapur APMC", "district": "Kolhapur", "state": "Maharashtra", "lat": 16.7050, "lng": 74.2433, "type": "APMC"},
    {"name": "Sangli APMC", "district": "Sangli", "state": "Maharashtra", "lat": 16.8524, "lng": 74.5815, "type": "APMC"},
]


def seed_phase8_crops():
    sb = get_supabase_admin()
    print("=== SEEDING PHASE 8: 10 CROPS & HISTORICAL APMC BENCHMARKS ===")

    # 1. Upsert Crops
    print(f"Upserting {len(CROPS_DATA)} crops...")
    crops_to_insert = [
        {"name": c["name"], "category": c["category"], "unit": c["unit"], "icon": c["icon"]}
        for c in CROPS_DATA
    ]
    sb.table("crops").upsert(crops_to_insert, on_conflict="name").execute()

    # 2. Upsert Markets
    print(f"Upserting {len(MARKETS_DATA)} APMC markets...")
    sb.table("markets").upsert(MARKETS_DATA, on_conflict="name").execute()

    # 3. Retrieve IDs
    db_crops = {c["name"]: c["id"] for c in sb.table("crops").select("id, name").execute().data}
    db_markets = {m["name"]: m["id"] for m in sb.table("markets").select("id, name, district").execute().data}

    print(f"Mapped {len(db_crops)} crops and {len(db_markets)} markets in DB.")

    # 4. Generate 30 days of price & arrival history per crop/market
    print("Populating 30-day realistic price and arrival trends for all 10 crops...")
    today = datetime.utcnow().date()
    price_records = []
    arrival_records = []

    # Market differentials for believable regional variance
    market_factors = {
        "Latur APMC": 1.00,
        "Pune Market Yard": 1.04,
        "Nashik APMC": 1.02,
        "Solapur APMC": 0.98,
        "Nagpur APMC": 1.01,
        "Kolhapur APMC": 1.03,
        "Sangli APMC": 1.05,
    }

    random.seed(42)  # Deterministic seed for reproducible realistic trends

    for crop_info in CROPS_DATA:
        crop_id = db_crops.get(crop_info["name"])
        if not crop_id:
            continue
        base = crop_info["base_price"]

        for m_name, m_factor in market_factors.items():
            market_id = db_markets.get(m_name)
            if not market_id:
                continue

            for day_offset in range(30, -1, -1):
                cur_date = today - timedelta(days=day_offset)
                
                # Believable gentle upward trend over 30 days (+/- sinusoidal noise)
                trend = (30 - day_offset) * 0.002
                variation = random.uniform(-0.03, 0.04)
                modal = round(base * m_factor * (1 + trend + variation), 2)
                min_p = round(modal * random.uniform(0.93, 0.96), 2)
                max_p = round(modal * random.uniform(1.04, 1.08), 2)
                
                price_records.append({
                    "crop_id": crop_id,
                    "market_id": market_id,
                    "date": cur_date.isoformat(),
                    "modal_price": modal,
                    "min_price": min_p,
                    "max_price": max_p,
                })

                # Arrival records
                base_arrival = 120.0 if crop_info["category"] in ["Oilseed", "Cereal"] else 45.0
                arrival_qty = round(base_arrival * random.uniform(0.7, 1.4), 1)
                arrival_records.append({
                    "crop_id": crop_id,
                    "market_id": market_id,
                    "date": cur_date.isoformat(),
                    "quantity": arrival_qty,
                })

    # Chunked upsert to prevent Postgres payload overflow
    chunk_size = 300
    print(f"Upserting {len(price_records)} market price records in chunks...")
    for i in range(0, len(price_records), chunk_size):
        chunk = price_records[i:i + chunk_size]
        sb.table("market_prices").upsert(chunk, on_conflict="crop_id,market_id,date").execute()

    print(f"Upserting {len(arrival_records)} market arrival records in chunks...")
    for i in range(0, len(arrival_records), chunk_size):
        chunk = arrival_records[i:i + chunk_size]
        sb.table("market_arrivals").upsert(chunk, on_conflict="crop_id,market_id,date").execute()

    print("=== 10 CROPS & 30-DAY APMC BENCHMARKS SEEDED SUCCESSFULLY! ===")


if __name__ == "__main__":
    seed_phase8_crops()
