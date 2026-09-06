"""
Seed script for Phase 4: AI Intelligence.
1. Applies the phase4 schema (ai_recommendations table).
2. Seeds a deliberate disagreement case:
   Onion at Nashik APMC — price rising BUT arrivals spike + demand drops to Low
   → Rule engine should output SELL_NOW despite upward trend.
   Proof the system isn't always saying "WAIT".

Usage: cd backend && .\\venv\\Scripts\\python.exe -m app.seed.seed_phase4
"""
from datetime import datetime, timedelta
import random
from app.core.supabase_client import get_supabase_admin


def seed_phase4():
    sb = get_supabase_admin()
    print("Starting Phase 4 seeding...")

    # ─── 1. Apply phase4 schema ─────────────────────────────────
    print("Phase4 schema should be applied via SQL Editor (phase4_schema.sql).")
    print("Attempting to verify ai_recommendations table exists...")

    try:
        sb.table("ai_recommendations").select("id").limit(1).execute()
        print("  ✅ ai_recommendations table exists.")
    except Exception as e:
        print(f"  ⚠️  ai_recommendations table not found: {e}")
        print("  → Please run phase4_schema.sql in Supabase SQL Editor first.")
        return

    # ─── 2. Seed Disagreement Case ──────────────────────────────
    print("\nSeeding deliberate disagreement case (Onion @ Nashik)...")

    # Find Onion crop and Nashik market
    crops = sb.table("crops").select("id, name").execute().data or []
    markets = sb.table("markets").select("id, name, district").execute().data or []

    crop_map = {c["name"]: c["id"] for c in crops}
    market_map = {m["name"]: m["id"] for m in markets}

    onion_id = crop_map.get("Onion")
    nashik_id = market_map.get("Nashik APMC")

    if not onion_id or not nashik_id:
        print("  ⚠️  Could not find Onion or Nashik APMC in the database.")
        return

    today = datetime.utcnow().date()

    # Clear existing Onion/Nashik data for last 7 days to inject our scenario
    seven_days_ago = (today - timedelta(days=7)).isoformat()
    sb.table("market_prices") \
        .delete() \
        .eq("crop_id", onion_id) \
        .eq("market_id", nashik_id) \
        .gte("date", seven_days_ago) \
        .execute()

    sb.table("market_arrivals") \
        .delete() \
        .eq("crop_id", onion_id) \
        .eq("market_id", nashik_id) \
        .gte("date", seven_days_ago) \
        .execute()

    # Inject: Onion prices RISING over last 7 days (looks good for farmer)
    base_price = 2100
    for i in range(7, 0, -1):
        date = today - timedelta(days=i)
        # Steady upward trend: +30/day
        price = base_price + (7 - i) * 30 + random.uniform(-5, 5)
        sb.table("market_prices").insert({
            "crop_id": onion_id,
            "market_id": nashik_id,
            "date": str(date),
            "modal_price": round(price),
            "min_price": round(price * 0.94),
            "max_price": round(price * 1.06),
        }).execute()

    # Inject: Arrivals SPIKING in last 3 days (supply glut incoming)
    # First 4 days: normal arrivals
    for i in range(7, 3, -1):
        date = today - timedelta(days=i)
        sb.table("market_arrivals").insert({
            "crop_id": onion_id,
            "market_id": nashik_id,
            "date": str(date),
            "quantity": random.randint(300, 500),
            "demand_level": "Medium",
        }).execute()

    # Last 3 days: massive spike (3× normal) + demand drops to Low
    for i in range(3, 0, -1):
        date = today - timedelta(days=i)
        sb.table("market_arrivals").insert({
            "crop_id": onion_id,
            "market_id": nashik_id,
            "date": str(date),
            "quantity": random.randint(1200, 1800),  # 3× normal
            "demand_level": "Low",
        }).execute()

    print("  ✅ Disagreement case seeded:")
    print("     Onion @ Nashik: price ↑ rising, BUT arrivals ↑↑↑ spiking + demand Low")
    print("     Expected AI output: SELL_NOW (despite upward price trend)")

    # ─── 3. Verify the disagreement case ────────────────────────
    print("\nVerifying AI output for disagreement case...")
    try:
        from app.ai.data_prep import (
            fetch_price_series, fetch_arrival_series,
            compute_trend_pct, compute_arrival_trend_pct,
            get_latest_demand_level,
        )
        from app.ai.rule_engine import decide_action, generate_explanation

        prices = fetch_price_series(onion_id, nashik_id, days=7)
        arrivals = fetch_arrival_series(onion_id, nashik_id, days=7)

        price_vals = [float(p["modal_price"]) for p in prices]
        arrival_vals = [float(a["quantity"]) for a in arrivals]

        trend_pct = compute_trend_pct(price_vals, window=7)
        arrival_trend_pct = compute_arrival_trend_pct(arrival_vals, window=7)
        demand = get_latest_demand_level(arrivals)

        decision = decide_action(trend_pct, arrival_trend_pct, demand)
        explanation = generate_explanation(
            decision["action"], trend_pct, arrival_trend_pct, demand
        )

        print(f"  Price trend: {trend_pct:+.1f}%")
        print(f"  Arrival trend: {arrival_trend_pct:+.1f}%")
        print(f"  Demand: {demand}")
        print(f"  AI Action: {decision['action']}")
        print(f"  Explanation: {explanation}")

        if decision["action"] == "SELL_NOW":
            print("  ✅ PASS — Counter-intuitive case correctly outputs SELL_NOW!")
        else:
            print(f"  ⚠️  Expected SELL_NOW but got {decision['action']}.")
            print("     Rule table may need adjustment.")

    except Exception as e:
        print(f"  ⚠️  Could not verify: {e}")

    print("\n✅ Phase 4 seed completed!")


if __name__ == "__main__":
    seed_phase4()
