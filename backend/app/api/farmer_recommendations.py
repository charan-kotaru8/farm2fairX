"""
Per-Farmer AI Recommendations Endpoint.

Returns AI price recommendations for ALL of a farmer's active crops,
not just a single hardcoded crop-market pair.

Each recommendation includes:
- Crop name, icon, and market context
- Action (SELL_NOW / WAIT / COMPARE_BUYERS)
- Price range from regression
- Explanation from real numbers
- Signal chips
- Farmer's lot context (lot IDs, total quantity)
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.core.supabase_client import get_supabase_admin
from app.ai.data_prep import (
    fetch_price_series,
    fetch_arrival_series,
    compute_trend_pct,
    compute_arrival_trend_pct,
    compute_series_stats,
    get_latest_demand_level,
)
from app.ai.regression import predict_price_range, compute_confidence
from app.ai.rule_engine import decide_action, generate_explanation, build_signal_chips
from app.services.live_sync import sync_if_stale, get_sync_state
from app.services.weather_service import get_market_weather

router = APIRouter()


def _get_best_market_for_crop(sb, crop_id: str, farmer_district: str) -> Optional[Dict[str, Any]]:
    """
    Find the best market for a specific crop — one that actually has price data.
    Priority: farmer's district market > any market with recent data > first market.
    """
    markets = sb.table("markets").select("id, name, district").execute().data or []
    if not markets:
        return None

    # Check which markets have price data for this crop
    prices_res = sb.table("market_prices") \
        .select("market_id") \
        .eq("crop_id", crop_id) \
        .order("date", desc=True) \
        .limit(50) \
        .execute().data or []

    markets_with_data = set(p["market_id"] for p in prices_res)
    market_map = {m["id"]: m for m in markets}

    # Priority 1: Farmer's district market with data
    farmer_district_lower = (farmer_district or 'latur').lower()
    for m in markets:
        if m.get("district", "").lower() == farmer_district_lower and m["id"] in markets_with_data:
            return m

    # Priority 2: Any market with data for this crop
    for mid in markets_with_data:
        if mid in market_map:
            return market_map[mid]

    # Priority 3: Farmer's district market (even without data)
    for m in markets:
        if m.get("district", "").lower() == farmer_district_lower:
            return m

    # Priority 4: First market
    return markets[0]


@router.get("/ai/farmer-recommendations")
def get_farmer_recommendations(
    farmer_id: str,
    days: int = Query(default=30, ge=7, le=90),
):
    """
    Per-Farmer AI Recommendations.

    Returns AI price recommendations for ALL of a farmer's active crops.
    Auto-syncs Agmarknet data if stale (>6 hours).
    Each crop gets its own independent recommendation with real data.
    """
    sb = get_supabase_admin()

    # 0. Auto-sync market data if stale
    sync_state = sync_if_stale(max_age_hours=6)

    # 1. Fetch farmer's active lots with crop info
    lots = sb.table("lots") \
        .select("id, crop_id, quantity, quality_grade, status, crops(id, name, icon, unit)") \
        .eq("farmer_id", farmer_id) \
        .in_("status", ["active", "offer_received", "pickup_scheduled"]) \
        .execute().data or []

    if not lots:
        # Try ALL lots for the farmer (including non-active) as fallback
        lots = sb.table("lots") \
            .select("id, crop_id, quantity, quality_grade, status, crops(id, name, icon, unit)") \
            .eq("farmer_id", farmer_id) \
            .order("created_at", desc=True) \
            .limit(10) \
            .execute().data or []

    if not lots:
        return {
            "recommendations": [],
            "sync_status": sync_state,
            "message": "No lots found for this farmer.",
        }

    # 2. Get farmer's district for market matching
    farmer_profile = sb.table("profiles") \
        .select("district") \
        .eq("id", farmer_id) \
        .execute().data
    farmer_district = (farmer_profile[0].get("district") or "Latur" if farmer_profile else "Latur")

    # 3. Group lots by crop_id (deduplicate)
    crop_lots: Dict[str, Dict[str, Any]] = {}
    for lot in lots:
        cid = lot.get("crop_id")
        if not cid:
            continue
        if cid not in crop_lots:
            crop_info = lot.get("crops") or {}
            crop_lots[cid] = {
                "crop_id": cid,
                "crop_name": crop_info.get("name", "Unknown Crop"),
                "crop_icon": crop_info.get("icon", "🌾"),
                "crop_unit": crop_info.get("unit", "quintals"),
                "lot_ids": [],
                "total_quantity": 0.0,
                "statuses": [],
            }
        crop_lots[cid]["lot_ids"].append(lot["id"])
        crop_lots[cid]["total_quantity"] += float(lot.get("quantity") or 0)
        crop_lots[cid]["statuses"].append(lot.get("status", "active"))

    # 4. Generate recommendation for each crop
    recommendations = []
    for cid, crop_info in crop_lots.items():
        market = _get_best_market_for_crop(sb, cid, farmer_district)
        if not market:
            continue

        market_id = market["id"]
        market_name = market.get("name", "Unknown Market")

        # Fetch data series
        price_series = fetch_price_series(cid, market_id, days=days)
        arrival_series = fetch_arrival_series(cid, market_id, days=days)

        if not price_series:
            # No price data — still include but with a "no data" flag
            recommendations.append({
                "crop_name": crop_info["crop_name"],
                "crop_icon": crop_info["crop_icon"],
                "crop_id": cid,
                "market_name": market_name,
                "market_id": market_id,
                "action": None,
                "confidence": 0,
                "price_range": None,
                "explanation": f"No market price data available for {crop_info['crop_name']} at {market_name} yet.",
                "signals": [],
                "details": None,
                "lot_ids": crop_info["lot_ids"],
                "total_quantity": crop_info["total_quantity"],
                "crop_unit": crop_info["crop_unit"],
                "has_data": False,
            })
            continue

        prices = [float(r["modal_price"]) for r in price_series]
        arrival_quantities = [float(a["quantity"]) for a in arrival_series]

        # Regression — predicts price range
        prediction = predict_price_range(prices)

        # Compute signals
        trend_pct = round(compute_trend_pct(prices, window=7), 1)
        arrival_trend_pct = round(compute_arrival_trend_pct(arrival_quantities, window=7), 1)
        demand_level = get_latest_demand_level(arrival_series)

        # Rule engine — decides action
        decision = decide_action(trend_pct, arrival_trend_pct, demand_level)

        # Confidence
        stats = compute_series_stats(prices)
        confidence = compute_confidence(prices, stats["stdev"], stats["mean"], stats["count"])

        # Explanation from real numbers
        explanation = generate_explanation(
            decision["action"], trend_pct, arrival_trend_pct, demand_level
        )

        # Signal chips (market trends + weather)
        signals = build_signal_chips(trend_pct, arrival_trend_pct, demand_level)
        weather_info = None
        try:
            weather_info = get_market_weather(market_name)
            if weather_info:
                w_cond = weather_info.get("condition", "Clear / Favorable")
                w_risk = weather_info.get("risk", "clear")
                w_type = "negative" if w_risk == "warning" else ("positive" if w_risk == "clear" else "neutral")
                signals.append({
                    "label": f"🌦️ {w_cond}",
                    "type": w_type,
                })
        except Exception:
            pass

        rec = {
            "crop_name": crop_info["crop_name"],
            "crop_icon": crop_info["crop_icon"],
            "crop_id": cid,
            "market_name": market_name,
            "market_id": market_id,
            "action": decision["action"],
            "confidence": confidence,
            "price_range": {
                "low": prediction["low"],
                "high": prediction["high"],
                "midpoint": prediction["midpoint"],
            },
            "explanation": explanation,
            "signals": signals,
            "details": {
                "regression": {
                    "slope": prediction["slope"],
                    "r_squared": prediction["r_squared"],
                    "std_dev": prediction["std_dev"],
                },
                "data_points_used": prediction["n"],
                "trend_pct": trend_pct,
                "arrival_trend_pct": arrival_trend_pct,
                "demand_level": demand_level,
                "weather": weather_info,
            },
            "lot_ids": crop_info["lot_ids"],
            "total_quantity": crop_info["total_quantity"],
            "crop_unit": crop_info["crop_unit"],
            "has_data": True,
        }
        recommendations.append(rec)

        # Audit log per crop
        try:
            sb.table("ai_recommendations").insert({
                "type": "price_recommendation",
                "crop_id": cid,
                "market_id": market_id,
                "input_snapshot": {
                    "farmer_id": farmer_id,
                    "crop_name": crop_info["crop_name"],
                    "context": "farmer_crop_recommendation",
                    "prices_count": len(prices),
                    "arrivals_count": len(arrival_quantities),
                    "trend_pct": trend_pct,
                    "arrival_trend_pct": arrival_trend_pct,
                    "demand_level": demand_level,
                },
                "output_snapshot": {
                    "action": decision["action"],
                    "confidence": confidence,
                    "price_range": rec["price_range"],
                },
            }).execute()
        except Exception as e:
            print(f"Warning: Could not log farmer recommendation: {e}")

    # Sort: crops with data first, then by confidence descending
    recommendations.sort(key=lambda r: (not r["has_data"], -(r.get("confidence") or 0)))

    return {
        "recommendations": recommendations,
        "sync_status": sync_state,
        "farmer_id": farmer_id,
        "crops_analyzed": len(recommendations),
    }


@router.get("/weather/current")
def get_current_market_weather(market_name: str = Query(default="Latur APMC")):
    """
    Returns real-time NASA POWER weather condition for the specified APMC market.
    """
    from app.services.weather_service import get_market_weather, DEFAULT_WEATHER_BASELINE
    res = get_market_weather(market_name)
    return res or {**DEFAULT_WEATHER_BASELINE, "market_name": market_name}

