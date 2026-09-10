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
def list_markets(district: Optional[str] = None, state: Optional[str] = None):
    """List all markets, optionally filtered by district and/or state."""
    sb = get_supabase_admin()
    q = sb.table("markets").select("*")
    if state:
        q = q.eq("state", state)
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
def compare_markets(crop_id: str, state: Optional[str] = None, district: Optional[str] = None):
    """Compare latest prices for a crop across all markets, with optional state/district filter."""
    sb = get_supabase_admin()
    from datetime import datetime, timedelta
    today = datetime.utcnow().date().isoformat()
    week_ago = (datetime.utcnow().date() - timedelta(days=7)).isoformat()

    # Get the latest price per market for this crop
    prices = sb.table("market_prices") \
        .select("*, markets(name, district, state, lat, lng)") \
        .eq("crop_id", crop_id) \
        .gte("date", week_ago) \
        .order("date", desc=True) \
        .execute().data

    # Apply state/district filter on the joined markets data
    if state:
        prices = [p for p in prices if (p.get("markets") or {}).get("state") == state]
    if district:
        prices = [p for p in prices if (p.get("markets") or {}).get("district") == district]

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

@router.get("/markets/price-trend")
def get_price_trend(
    state: Optional[str] = None,
    district: Optional[str] = None,
    commodity: Optional[str] = None,
    crop_id: Optional[str] = None,
    market_id: Optional[str] = None,
    days: int = Query(default=7, ge=1, le=90),
):
    """
    Real 7-day price trend endpoint (§3 Plan v3.1).
    Serves historical price series strictly from local DB — never hits external API per request.
    Filters by state, district, commodity, and timeframe.
    """
    sb = get_supabase_admin()
    from datetime import datetime, timedelta
    cutoff = (datetime.utcnow().date() - timedelta(days=days)).isoformat()

    # Resolve crop_id if commodity name was passed
    resolved_crop_id = crop_id
    if not resolved_crop_id and commodity:
        c_res = sb.table("crops").select("id").ilike("name", f"%{commodity.strip()}%").limit(1).execute()
        if c_res.data:
            resolved_crop_id = c_res.data[0]["id"]

    q = sb.table("market_prices").select("date, min_price, max_price, modal_price, market_id, markets(id, name, district, state)")
    if resolved_crop_id:
        q = q.eq("crop_id", resolved_crop_id)
    if market_id:
        q = q.eq("market_id", market_id)

    q = q.gte("date", cutoff).order("date", desc=False)
    rows = q.execute().data or []

    # Filter by state and district on joined market
    if state:
        rows = [r for r in rows if (r.get("markets") or {}).get("state", "").lower() == state.strip().lower()]
    if district:
        rows = [r for r in rows if (r.get("markets") or {}).get("district", "").lower() == district.strip().lower()]

    # Aggregate by date if multiple markets in the selected district/state
    date_buckets: dict = {}
    for r in rows:
        d = r["date"]
        if d not in date_buckets:
            date_buckets[d] = {
                "date": d,
                "min": r["min_price"],
                "max": r["max_price"],
                "modal": r["modal_price"],
                "count": 1,
            }
        else:
            b = date_buckets[d]
            b["min"] = min(b["min"], r["min_price"])
            b["max"] = max(b["max"], r["max_price"])
            b["modal"] = round((b["modal"] * b["count"] + r["modal_price"]) / (b["count"] + 1), 2)
            b["count"] += 1

    trend = sorted(date_buckets.values(), key=lambda x: x["date"])
    for t in trend:
        t.pop("count", None)
        t["modal_price"] = t["modal"]
        t["min_price"] = t["min"]
        t["max_price"] = t["max"]

    return trend


@router.get("/markets/districts")
def get_distinct_districts(state: Optional[str] = None):
    """
    Returns distinct districts from markets table for the given state.
    """
    sb = get_supabase_admin()
    q = sb.table("markets").select("district")
    if state:
        q = q.ilike("state", state.strip())
    rows = q.execute().data or []
    districts = sorted(set(r["district"] for r in rows if r.get("district")))
    return districts


@router.get("/markets/commodities")
def get_distinct_commodities(state: Optional[str] = None, district: Optional[str] = None):
    """
    Returns distinct crops/commodities available in the database.
    """
    sb = get_supabase_admin()
    crops = sb.table("crops").select("id, name, icon, unit").order("name").execute().data or []
    return crops


@router.get("/markets/meta")
def get_markets_meta():
    """
    Returns distinct states and per-state districts for all India,
    merged with active APMC markets from the database.
    Zero hardcoding. Used by State→District selector and Market Intelligence.
    """
    import json
    from pathlib import Path

    sb = get_supabase_admin()
    rows = sb.table("markets").select("state, district").execute().data or []

    # Load canonical all-India geography data
    geo_path = Path(__file__).resolve().parent.parent / "data" / "indian_states_districts.json"
    canonical_geo = {}
    if geo_path.exists():
        try:
            with open(geo_path, "r", encoding="utf-8") as f:
                canonical_geo = json.load(f)
        except Exception:
            pass

    # Active DB states and districts
    db_state_districts: dict = {}
    for row in rows:
        s = row.get("state") or "Unknown"
        d = row.get("district") or "Unknown"
        db_state_districts.setdefault(s, set()).add(d)

    # Merge canonical geography with any DB-specific entries
    merged_districts = {k: list(v) for k, v in canonical_geo.items()}
    for s, ds in db_state_districts.items():
        if s not in merged_districts:
            merged_districts[s] = sorted(ds)
        else:
            merged_districts[s] = sorted(set(merged_districts[s]).union(ds))

    all_states = sorted(merged_districts.keys())
    if not all_states:
        all_states = sorted(db_state_districts.keys()) or ["Maharashtra"]

    return {
        "states": all_states,
        "districts_by_state": merged_districts,
        "db_states": sorted(db_state_districts.keys()),
        "total_markets_count": len(rows),
    }


from pydantic import BaseModel


class MarketPriceUpdateRequest(BaseModel):
    price_id: Optional[str] = None
    market_id: Optional[str] = None
    crop_id: Optional[str] = None
    modal_price: float
    min_price: Optional[float] = None
    max_price: Optional[float] = None


@router.post("/market-prices/update")
def update_market_price(req: MarketPriceUpdateRequest):
    """
    Live Demo Device (§7.4): Allows admin to edit modal/min/max price for a market/crop row.
    Updates the database directly, immediately driving live updates on the AI Price Recommendation
    without a page reload.
    """
    sb = get_supabase_admin()
    from datetime import datetime

    update_payload = {
        "modal_price": float(req.modal_price),
    }
    if req.min_price is not None:
        update_payload["min_price"] = float(req.min_price)
    else:
        update_payload["min_price"] = float(req.modal_price) * 0.95

    if req.max_price is not None:
        update_payload["max_price"] = float(req.max_price)
    else:
        update_payload["max_price"] = float(req.modal_price) * 1.05

    if req.price_id:
        res = sb.table("market_prices").update(update_payload).eq("id", req.price_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Price record not found")
        return {
            "message": f"Market price updated to Rs. {req.modal_price}/q. AI Price Intelligence will reflect this immediately.",
            "updated_price": res.data[0],
        }

    # Otherwise update latest price for crop & market
    if req.crop_id and req.market_id:
        latest = sb.table("market_prices") \
            .select("id") \
            .eq("crop_id", req.crop_id) \
            .eq("market_id", req.market_id) \
            .order("date", desc=True) \
            .limit(1) \
            .execute().data
        if latest:
            res = sb.table("market_prices").update(update_payload).eq("id", latest[0]["id"]).execute()
            return {
                "message": f"Market price updated to Rs. {req.modal_price}/q for crop/market.",
                "updated_price": res.data[0],
            }
        else:
            # Insert new today record
            today_str = datetime.utcnow().date().isoformat()
            insert_payload = {
                "crop_id": req.crop_id,
                "market_id": req.market_id,
                "date": today_str,
                "modal_price": float(req.modal_price),
                "min_price": float(update_payload["min_price"]),
                "max_price": float(update_payload["max_price"]),
            }
            res = sb.table("market_prices").insert(insert_payload).execute()
            return {
                "message": f"Inserted new price record of Rs. {req.modal_price}/q for today.",
                "updated_price": res.data[0],
            }

    raise HTTPException(status_code=400, detail="Must provide price_id or (crop_id and market_id)")


@router.post("/markets/sync")
def sync_market_data(force_live: bool = Query(False, description="Attempt live fetch before falling back")):
    """
    Defensively syncs APMC market prices from Agmarknet (§8.1).
    Uses crop-name mapping and non-negotiable stale-fallback rule.
    """
    from app.services.live_sync import run_live_sync
    result = run_live_sync(force_live=force_live)
    return result


@router.get("/markets/sync-status")
def get_market_sync_status():
    """
    Returns current sync status, label ('Live · Agmarknet · synced HH:MM' vs 'Live · stale' vs 'Demo Data'), and metadata (§8.1).
    """
    from app.services.live_sync import get_sync_state
    return get_sync_state()

