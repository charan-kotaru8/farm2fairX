from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.core.supabase_client import get_supabase_admin

router = APIRouter()


@router.get("/crops")
def list_crops():
    """List all available crops."""
    sb = get_supabase_admin()
    res = sb.table("crops").select("*").order("name").execute()
    return res.data


@router.get("/markets")
def list_markets(district: Optional[str] = None):
    """List all markets, optionally filtered by district."""
    sb = get_supabase_admin()
    q = sb.table("markets").select("*")
    if district:
        q = q.eq("district", district)
    res = q.order("name").execute()
    return res.data


@router.get("/market-prices")
def get_market_prices(
    crop_id: Optional[str] = None,
    market_id: Optional[str] = None,
    days: int = Query(default=30, ge=1, le=90),
):
    """Get market prices, optionally filtered by crop and/or market. Returns last N days."""
    sb = get_supabase_admin()
    from datetime import datetime, timedelta
    cutoff = (datetime.utcnow().date() - timedelta(days=days)).isoformat()

    q = sb.table("market_prices").select("*, crops(name, icon), markets(name, district)")
    if crop_id:
        q = q.eq("crop_id", crop_id)
    if market_id:
        q = q.eq("market_id", market_id)
    q = q.gte("date", cutoff).order("date", desc=False)
    res = q.execute()
    return res.data


@router.get("/market-arrivals")
def get_market_arrivals(
    crop_id: Optional[str] = None,
    market_id: Optional[str] = None,
    days: int = Query(default=30, ge=1, le=90),
):
    """Get market arrival volumes, optionally filtered."""
    sb = get_supabase_admin()
    from datetime import datetime, timedelta
    cutoff = (datetime.utcnow().date() - timedelta(days=days)).isoformat()

    q = sb.table("market_arrivals").select("*, crops(name, icon), markets(name, district)")
    if crop_id:
        q = q.eq("crop_id", crop_id)
    if market_id:
        q = q.eq("market_id", market_id)
    q = q.gte("date", cutoff).order("date", desc=False)
    res = q.execute()
    return res.data


@router.get("/market-comparison")
def compare_markets(crop_id: str):
    """Compare latest prices for a crop across all markets."""
    sb = get_supabase_admin()
    from datetime import datetime, timedelta
    today = datetime.utcnow().date().isoformat()
    week_ago = (datetime.utcnow().date() - timedelta(days=7)).isoformat()

    # Get the latest price per market for this crop
    prices = sb.table("market_prices") \
        .select("*, markets(name, district, lat, lng)") \
        .eq("crop_id", crop_id) \
        .gte("date", week_ago) \
        .order("date", desc=True) \
        .execute().data

    # Group by market, take latest
    market_latest = {}
    for p in prices:
        mid = p["market_id"]
        if mid not in market_latest:
            market_latest[mid] = p

    comparison = list(market_latest.values())
    # Sort by modal_price descending (best price first)
    comparison.sort(key=lambda x: x["modal_price"], reverse=True)

    # Mark the best value
    if comparison:
        comparison[0]["is_best_value"] = True
        for c in comparison[1:]:
            c["is_best_value"] = False

    return comparison
