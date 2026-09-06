"""
Data Preparation Utilities for AI Module.
Pure functions to fetch and reshape price/arrival data from Supabase
into structures suitable for regression and rule engine.

No pandas — uses stdlib statistics for lightweight mean/stdev on ~30 rows.
"""
from datetime import datetime, timedelta
from statistics import mean, stdev
from typing import List, Dict, Any, Optional
from app.core.supabase_client import get_supabase_admin


def fetch_price_series(
    crop_id: str,
    market_id: str,
    days: int = 30,
    exclude_last_n: int = 0,
) -> List[Dict[str, Any]]:
    """
    Fetch modal_price time series for a crop-market pair.
    Returns list of {date, modal_price, min_price, max_price} sorted by date asc.

    exclude_last_n: if > 0, hides the last N days (for backtesting).
    """
    sb = get_supabase_admin()
    cutoff = (datetime.utcnow().date() - timedelta(days=days)).isoformat()

    q = sb.table("market_prices") \
        .select("date, modal_price, min_price, max_price") \
        .eq("crop_id", crop_id) \
        .eq("market_id", market_id) \
        .gte("date", cutoff) \
        .order("date", desc=False)

    rows = q.execute().data or []

    if exclude_last_n > 0 and len(rows) > exclude_last_n:
        rows = rows[:-exclude_last_n]

    return rows


def fetch_arrival_series(
    crop_id: str,
    market_id: str,
    days: int = 30,
    exclude_last_n: int = 0,
) -> List[Dict[str, Any]]:
    """
    Fetch arrival volume time series for a crop-market pair.
    Returns list of {date, quantity, demand_level} sorted by date asc.
    """
    sb = get_supabase_admin()
    cutoff = (datetime.utcnow().date() - timedelta(days=days)).isoformat()

    q = sb.table("market_arrivals") \
        .select("date, quantity, demand_level") \
        .eq("crop_id", crop_id) \
        .eq("market_id", market_id) \
        .gte("date", cutoff) \
        .order("date", desc=False)

    rows = q.execute().data or []

    if exclude_last_n > 0 and len(rows) > exclude_last_n:
        rows = rows[:-exclude_last_n]

    return rows


def compute_trend_slope(series: List[float]) -> float:
    """
    Compute the slope of a simple OLS regression on index → value.
    Returns the daily price change (rupees per day).
    Uses manual least-squares to avoid any heavy dependencies.
    """
    n = len(series)
    if n < 2:
        return 0.0

    x_mean = (n - 1) / 2.0
    y_mean = mean(series)

    numerator = sum((i - x_mean) * (y - y_mean) for i, y in enumerate(series))
    denominator = sum((i - x_mean) ** 2 for i in range(n))

    if denominator == 0:
        return 0.0

    return numerator / denominator


def compute_trend_pct(series: List[float], window: int = 7) -> float:
    """
    Compute the percentage change in trend over the last `window` data points.
    Returns percentage (e.g. 4.2 means +4.2%).
    """
    if len(series) < 2:
        return 0.0

    tail = series[-window:] if len(series) >= window else series
    if tail[0] == 0:
        return 0.0

    return ((tail[-1] - tail[0]) / tail[0]) * 100


def compute_arrival_trend_pct(quantities: List[float], window: int = 7) -> float:
    """
    Compute the percentage change in arrival volumes over the last `window` points.
    Positive = arrivals increasing, negative = arrivals decreasing.
    """
    if len(quantities) < 2:
        return 0.0

    tail = quantities[-window:] if len(quantities) >= window else quantities
    if tail[0] == 0:
        return 0.0

    return ((tail[-1] - tail[0]) / tail[0]) * 100


def compute_series_stats(series: List[float]) -> Dict[str, float]:
    """
    Compute basic stats: mean, stdev, coefficient of variation.
    """
    if len(series) < 2:
        m = series[0] if series else 0.0
        return {"mean": m, "stdev": 0.0, "cv": 0.0, "count": len(series)}

    m = mean(series)
    sd = stdev(series)
    cv = (sd / m) * 100 if m != 0 else 0.0

    return {"mean": m, "stdev": sd, "cv": cv, "count": len(series)}


def get_latest_demand_level(arrivals: List[Dict[str, Any]]) -> str:
    """
    Get the most recent demand_level from arrival data.
    Defaults to 'Medium' if no data.
    """
    if not arrivals:
        return "Medium"
    return arrivals[-1].get("demand_level", "Medium")
