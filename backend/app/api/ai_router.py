"""
AI API Endpoints.
/ai/price-recommendation — regression + rule engine + audit logging
/ai/buyer-match — weighted scoring + audit logging

Every call logs to ai_recommendations for full audit trail.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
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
from app.ai.buyer_matching import match_buyers_for_lot
from app.services.weather_service import get_market_weather

router = APIRouter()


@router.get("/ai/price-recommendation")
def get_price_recommendation(
    crop_id: str,
    market_id: str,
    days: int = Query(default=30, ge=7, le=90),
):
    """
    AI Price Recommendation.

    Regression predicts the price range.
    Rule engine decides the action.
    Confidence is computed from volatility + data sparsity.
    Explanation is generated from real numbers — never a static string.
    Every call is logged to ai_recommendations.
    """
    # 1. Fetch data
    price_series = fetch_price_series(crop_id, market_id, days=days)
    arrival_series = fetch_arrival_series(crop_id, market_id, days=days)

    if not price_series:
        raise HTTPException(
            status_code=404,
            detail="No price data found for this crop-market pair."
        )

    prices = [float(r["modal_price"]) for r in price_series]
    arrival_quantities = [float(a["quantity"]) for a in arrival_series]

    # 2. Regression — predicts price range (regression's ONLY job)
    prediction = predict_price_range(prices)

    # 3. Compute signals
    trend_pct = round(compute_trend_pct(prices, window=7), 1)
    arrival_trend_pct = round(compute_arrival_trend_pct(arrival_quantities, window=7), 1)
    demand_level = get_latest_demand_level(arrival_series)

    # 4. Rule engine — decides action (rule engine's ONLY job)
    decision = decide_action(trend_pct, arrival_trend_pct, demand_level)

    # 5. Confidence (real formula, not vibes)
    stats = compute_series_stats(prices)
    confidence = compute_confidence(prices, stats["stdev"], stats["mean"], stats["count"])

    # 6. Explanation from real numbers
    explanation = generate_explanation(
        decision["action"], trend_pct, arrival_trend_pct, demand_level
    )

    # 7. Signal chips (max 3) + Weather
    signals = build_signal_chips(trend_pct, arrival_trend_pct, demand_level)
    weather_info = None
    try:
        sb = get_supabase_admin()
        m_row = sb.table("markets").select("name").eq("id", market_id).execute().data
        m_name = m_row[0]["name"] if m_row else "Latur APMC"
        weather_info = get_market_weather(m_name)
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

    # 8. Fetch backtest note if available
    sb = get_supabase_admin()
    backtest_note = None
    try:
        bt_res = sb.table("ai_recommendations") \
            .select("output_snapshot") \
            .eq("type", "price_recommendation") \
            .order("created_at", desc=True) \
            .limit(1) \
            .execute()
        if bt_res.data:
            snapshot = bt_res.data[0].get("output_snapshot", {})
            if "summary" in snapshot:
                backtest_note = snapshot["summary"]
    except Exception:
        pass

    result = {
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
            "backtest_note": backtest_note,
            "data_points_used": prediction["n"],
            "trend_pct": trend_pct,
            "arrival_trend_pct": arrival_trend_pct,
            "demand_level": demand_level,
        },
    }

    # 9. Audit log — EVERY call logged
    try:
        sb.table("ai_recommendations").insert({
            "type": "price_recommendation",
            "crop_id": crop_id,
            "market_id": market_id,
            "input_snapshot": {
                "prices_count": len(prices),
                "arrivals_count": len(arrival_quantities),
                "days_requested": days,
                "last_price": prices[-1] if prices else None,
                "trend_pct": trend_pct,
                "arrival_trend_pct": arrival_trend_pct,
                "demand_level": demand_level,
            },
            "output_snapshot": result,
        }).execute()
    except Exception as e:
        # Don't fail the request if audit logging fails
        print(f"Warning: Could not log AI recommendation: {e}")

    return result


@router.get("/ai/buyer-match")
def get_buyer_matches(lot_id: str):
    """
    AI Buyer Matching.

    Scores all eligible buyers against a lot using transparent, weighted factors.
    Returns per-factor breakdown with every score, plus the weight config.
    Every call is logged to ai_recommendations.
    """
    result = match_buyers_for_lot(lot_id)

    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])

    # Audit log
    try:
        sb = get_supabase_admin()
        sb.table("ai_recommendations").insert({
            "type": "buyer_match",
            "lot_id": lot_id,
            "input_snapshot": {
                "lot_id": lot_id,
                "crop_name": result.get("crop_name"),
                "buyers_scored": len(result.get("matches", [])),
            },
            "output_snapshot": {
                "matches_count": len(result.get("matches", [])),
                "top_match": result["matches"][0] if result.get("matches") else None,
                "weights": result.get("weights"),
            },
        }).execute()
    except Exception as e:
        print(f"Warning: Could not log AI buyer match: {e}")

    return result
