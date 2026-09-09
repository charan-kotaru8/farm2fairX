# 📊 Farm2Fair Data Sources & Data Integrity Specification

This document provides a transparent, verifiable breakdown of all external data sources, refresh cadences, commodity mappings, and defensive fallbacks utilized by the Farm2Fair platform.

---

## 1. Primary Market Data: Agmarknet (Ministry of Agriculture & Farmers Welfare)

| Parameter | Specification |
| :--- | :--- |
| **Provider** | Government of India · Open Government Data (OGD) Platform India (`data.gov.in`) |
| **Dataset Title** | Current Daily Price of Various Commodities from Various Markets (Mandi) |
| **Resource ID** | `9ef84268-d588-465a-a308-a864a43d0070` |
| **API Endpoint** | `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070` |
| **Filters Used** | `filters[state]=Maharashtra` |
| **Data Fields** | `arrival_date`, `state`, `district`, `market`, `commodity`, `variety`, `grade`, `min_price`, `max_price`, `modal_price` |
| **Update Cadence** | **Daily-live** — APMC mandis upload official trade records once per market day (typically late afternoon/evening). We never claim "streaming real-time" because government market observations update once daily. |
| **Sync Policy** | Backend automatically checks timestamp age. If cached data is >6 hours old, it pulls live updates with a 4.0-second defensive timeout. |

### Crop Name Normalization & Mapping Table (§8.1)
Government Agmarknet entries use varied nomenclature across districts. The platform maps application entities to official strings:

```python
CROP_NAME_MAPPING = {
    "Soybean": ["Soyabean", "Soyabean (Yellow)", "Soyabean(Yellow)", "Soyabean (Black)", "Soybean"],
    "Cotton": ["Cotton", "Cotton (Unginned)", "Kapas", "Cotton(Lint)"],
    "Tur Dal": ["Arhar (Tur/Red Gram)(Whole)", "Arhar (Tur)", "Tur", "Red Gram", "Tur Dal"],
    "Wheat": ["Wheat", "Wheat(Kalyan)", "Wheat(Lokwan)", "Wheat(Deshi)"],
    "Onion": ["Onion", "Onion (Red)", "Onion (White)"],
    "Sugarcane": ["Sugarcane", "Gur(Jaggery)"],
    "Turmeric": ["Turmeric", "Turmeric (Raw)", "Turmeric (Finger)"],
    "Groundnut": ["Groundnut", "Groundnut (Split)", "Groundnut Pods (Raw)"],
    "Bajra": ["Bajra(Pearl Millet/Cumbu)", "Bajra", "Pearl Millet"],
    "Grapes": ["Grapes", "Grapes(Black)", "Grapes(Green)"],
}
```

---

## 2. Weather & Agroclimatology: NASA POWER API

| Parameter | Specification |
| :--- | :--- |
| **Provider** | NASA Prediction of Worldwide Energy Resources (POWER) Project |
| **API Endpoint** | `https://power.larc.nasa.gov/api/temporal/daily/point` |
| **Parameters** | `PRECTOTCORR` (Precipitation/Rainfall in mm/day), `T2M` (Temperature at 2 Meters in °C), `T2M_MAX` (Daily Maximum Temperature) |
| **Target Coordinates** | Specific latitude/longitude coordinates for all 7 major Maharashtra APMCs (Latur, Pune, Nashik, Solapur, Nagpur, Kolhapur, Sangli) |
| **Purpose** | Leading indicator for logistics feasibility and supply arrivals. High precipitation signals transport delays and harvest risks, directly informing the AI/ML recommendation engine. |
| **Caching & Fallback** | Defensively cached in `app/data/weather_cache.json` with a 12-hour TTL. Falls back to Maharashtra seasonal agroclimatology baseline if offline. |

---

## 3. e-NAM (National Agriculture Market) Investigation & Trade Data Status

| Investigation Aspect | Findings & Platform Strategy |
| :--- | :--- |
| **Catalog Search** | `data.gov.in` catalog queries for public unauthenticated e-NAM trade endpoints return 0 public REST resources. |
| **Current e-NAM Policy** | e-NAM's direct trade transaction data (`enam.gov.in`) requires captive portal authentication restricted to licensed APMC market committees, authorized commission agents, and institutional members. |
| **Platform Decision** | **Documented as Future Institutional Integration.** For the active working platform, Agmarknet (`9ef84268-d588-465a-a308-a864a43d0070`) serves as the official, publicly verifiable, and reliable government price benchmark. |
| **Future Gateway** | When APMC institutional credentials or state-level open e-NAM gateways become public, Farm2Fair's modular `live_sync.py` adapter will ingest the feed without architectural changes. |

---

## 4. Defensive Stale-Fallback Policy

1. **Zero-Blank Guarantee:** If `data.gov.in` times out or returns 0 records for a commodity, the backend immediately loads the last verified cached feed from `app/data/agmarknet_cached_feed.json`.
2. **Transparent UI Badging:**
   - **`Live · Agmarknet · synced HH:MM`** when connected and synced today.
   - **`Live · stale (last updated DD/MM)`** when running on cached fallback.
   - **`Demo Data`** when generated for synthetic edge-case demonstrations.
3. **No Hallucinated Claims:** UI copy strictly avoids "real-time" and "AI-powered", accurately using **"daily-live"** and **"AI/ML-driven"** (linear regression + weighted rule engine).
