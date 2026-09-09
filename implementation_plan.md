# Implementation Plan: Farm2Fair Improvement Plan v2 Upgrade

Upgrade Farm2Fair from a prototype mindset to a robust working model as specified in [Farm2Fair_Improvement_Plan_v2.md](file:///c:/farm2fairX/Farm2Fair_Improvement_Plan_v2.md):
1. **Terminology & Framing**: Precision audit — replace vague "AI-powered" with **"AI/ML-driven"** (linear regression price prediction + weighted rule engine) and "real-time" with **"daily-live"** (Agmarknet syncs daily).
2. **Phase 4 AI/ML Rework**: Integrate **NASA POWER API** for real daily meteorological data (precipitation `PRECTOTCORR`, temperature `T2M`/`T2M_MAX`) as leading indicators for arrival volatility and perishability risks; enrich rule engine, signal chips, and re-run backtesting.
3. **Phase 1 & 8 Full Language Coverage**: Deep **English, Hindi, and Marathi (EN/HI/MR)** localization across all four platform dashboards (**Farmer, Buyer, FPO, and Admin**) and top-bar navigation/status indicators.

---

## User Review Required

> [!IMPORTANT]
> - **Weather Data Source:** NASA POWER API is free and requires no API key. We implement a defensive local cache (`backend/app/data/weather_cache.json`) so external API latency or timeouts never degrade dashboard load times or live presentations.
> - **i18n Architecture:** We are organizing localization into structured namespace dictionaries in `frontend/src/i18n/i18n.js` and wiring `useTranslation()` into Farmer, Buyer, FPO, and Admin dashboards so that language switching works instantly across the entire application without reload.
> - **Terminology Shift:** All UI labels and markdown docs will strictly use *"Daily-live"* instead of *"Real-time"* and *"AI/ML-driven"* instead of *"AI-powered"*, defending against judge scrutiny on model origin and data cadence.

---

## Open Questions

None at this stage; the specifications in `Farm2Fair_Improvement_Plan_v2.md` provide clear parameters for the weather features, terminology rules, and full 4-dashboard language coverage.

---

## Proposed Changes

### 1. Weather Intelligence & AI/ML Signal Integration (Backend)

#### [NEW] [weather_service.py](file:///c:/farm2fairX/backend/app/services/weather_service.py)
- Fetches real daily meteorological data from NASA POWER API (`https://power.larc.nasa.gov/api/temporal/daily/point`) using APMC coordinates (`lat`, `lng`).
- Tracks parameters: `PRECTOTCORR` (precipitation mm/day) and `T2M` (mean temperature °C), `T2M_MAX`.
- Evaluates weather impact:
  - `Rainfall Alert`: Rainfall $> 25\text{ mm}$ signals potential logistics delays and delayed mandi arrivals.
  - `Heat Stress Alert`: Temperature $> 38^\circ\text{C}$ signals accelerated perishability for sensitive horticulture crops.
  - `Clear / Favorable`: Standard holding and transport conditions.
- Implements defensive local file caching (`weather_cache.json`) with stale fallback so calls are instantaneous.

#### [MODIFY] [rule_engine.py](file:///c:/farm2fairX/backend/app/ai/rule_engine.py)
- Incorporates `weather_signal` (rainfall mm, temperature °C, risk category) into decision heuristics.
- Adds weather signal chip generator to `build_signal_chips` (e.g. `🌦️ Weather: 28°C · Clear` or `🌧️ Weather: 34mm · Logistics Alert`).
- Updates `generate_explanation` to articulate weather impact in plain language alongside price trend, arrival velocity, and buyer demand.

#### [MODIFY] [data_prep.py](file:///c:/farm2fairX/backend/app/ai/data_prep.py)
- Connects APMC market coordinates to `weather_service.py` to extract market weather indicators.

#### [MODIFY] [farmer_recommendations.py](file:///c:/farm2fairX/backend/app/api/farmer_recommendations.py)
- Injects weather indicators into each crop recommendation payload (`weather_summary`, `weather_chip`, and audit log snapshot).

#### [MODIFY] [ai_router.py](file:///c:/farm2fairX/backend/app/api/ai_router.py)
- Updates `/ai/price-recommendation` to return weather metrics and factors.

#### [MODIFY] [backtest.py](file:///c:/farm2fairX/backend/app/ai/backtest.py)
- Updates backtest script to evaluate price predictions and rule actions across the enriched feature set (prices + arrivals + weather).
- Produces clean validation report demonstrating empirical accuracy on historical data.

#### [MODIFY] [README.md](file:///c:/farm2fairX/backend/app/ai/README.md)
- Updates AI methodology documentation:
  - Explains regression + rule engine + NASA POWER weather + Agmarknet daily-live inputs.
  - Emphasizes explicit transparency (not an LLM, but grounded predictive regression and multi-criteria weighted scoring).

---

### 2. Full Language Coverage (EN, HI, MR) across All 4 Dashboards (Frontend)

#### [MODIFY] [i18n.js](file:///c:/farm2fairX/frontend/src/i18n/i18n.js)
- Expand comprehensive translation dictionaries for **English (en)**, **Hindi (hi)**, and **Marathi (mr)** covering:
  - `common`: Daily-live indicators, demo modes, navigation links, quick actions.
  - `farmer`: Dashboard welcome, cumulative benefit, active lots, recent lots, action buttons, table columns.
  - `buyer`: Welcome, verification tiers (Basic, Verified, Trusted Partner), active requirements, matched lots, offer status.
  - `fpo`: Welcome, aggregation portal, member directory stats, pooled lots, bulk bonus indicators, commercial buyers.
  - `admin`: Governance overview, cumulative farmer benefit, transactions, buyer queue, grievance triage, daily-live DB sync.

#### [MODIFY] [FarmerDashboard.jsx](file:///c:/farm2fairX/frontend/src/features/farmer-dashboard/FarmerDashboard.jsx)
- Replace all remaining hardcoded English text (`Active Lots`, `Currently listed on market`, `Your Recent Lots`, empty state prompts) with `t()` translation keys.

#### [MODIFY] [CropRecommendationsPanel.jsx](file:///c:/farm2fairX/frontend/src/features/farmer-dashboard/CropRecommendationsPanel.jsx)
- Render the new `🌦️ Weather` signal chip alongside Trend, Arrivals, and Demand.
- Replace any "AI-powered" copy with "AI/ML-driven".
- Localize recommendation tabs and headers.

#### [MODIFY] [BuyerDashboard.jsx](file:///c:/farm2fairX/frontend/src/features/buyer-marketplace/BuyerDashboard.jsx)
- Upgrade from placeholder to a functional overview showing buyer verification badge, quick stats, direct links to Crop Marketplace and Requirements, fully wired with `t()` for EN/HI/MR.

#### [MODIFY] [FpoDashboard.jsx](file:///c:/farm2fairX/frontend/src/features/fpo/FpoDashboard.jsx)
- Wire `useTranslation()` into hero banners, stat cards, member table, and aggregation actions for EN/HI/MR.

#### [MODIFY] [AdminDashboard.jsx](file:///c:/farm2fairX/frontend/src/features/admin/AdminDashboard.jsx)
- Wire `useTranslation()` into admin overview, stat tiles, Recharts labels, and queue summary.
- Correct "Real-time DB Sync" to "Live DB Sync".

---

### 3. Terminology & Precision Copy Audit (Cross-Cutting)

#### [MODIFY] [MarketIntelligence.jsx](file:///c:/farm2fairX/frontend/src/features/market-intel/MarketIntelligence.jsx)
- Update "Real-time prices and analytics" to "Daily-live prices and analytics".

#### [MODIFY] [MarketPriceEditor.jsx](file:///c:/farm2fairX/frontend/src/features/admin/MarketPriceEditor.jsx)
- Update copy from "real-time mandi prices" to "daily-live mandi prices".

#### [MODIFY] [Farm2Fair_Master_Plan.md](file:///c:/farm2fairX/Farm2Fair_Master_Plan.md)
- Incorporate Improvement Plan v2 amendments (§8.8, terminology table, NASA POWER integration, full i18n checklist).

---

## Verification Plan

### Automated Tests
1. **Weather Service Test:**
   ```powershell
   & c:\farm2fairX\backend\venv\Scripts\python.exe -c "from app.services.weather_service import get_market_weather; print(get_market_weather('Latur APMC', 18.4088, 76.5604))"
   ```
2. **AI Rule Engine & Weather Signals Test:**
   ```powershell
   & c:\farm2fairX\backend\venv\Scripts\python.exe -c "from app.ai.rule_engine import decide_action, build_signal_chips; print(decide_action(2.3, 1.2, 'Medium', weather_risk='clear')); print(build_signal_chips(2.3, 1.2, 'Medium', {'rainfall_mm': 0.0, 'temp_c': 28.5, 'risk': 'clear'}))"
   ```
3. **Full Backtest Execution:**
   ```powershell
   & c:\farm2fairX\backend\venv\Scripts\python.exe -m app.ai.backtest
   ```
4. **API Endpoint Verification:**
   ```powershell
   & c:\farm2fairX\backend\venv\Scripts\python.exe -c "from fastapi.testclient import TestClient; from app.main import app; c = TestClient(app); r = c.get('/ai/farmer-recommendations?farmer_id=00000000-0000-0000-0000-000000000001'); print('Status:', r.status_code); print('Signals:', [x.get('signals') for x in r.json().get('recommendations', [])])"
   ```
5. **Frontend Build Validation:**
   ```powershell
   npm run build
   ```

### Manual Verification
- Open `http://localhost:5173` in a browser.
- Toggle between **English**, **हिंदी**, and **मराठी** using the top-bar Language Selector.
- Verify that **Farmer Dashboard**, **Buyer Dashboard**, **FPO Dashboard**, and **Admin Dashboard** translate all headers, metrics, and cards immediately.
- On the Farmer Dashboard, view the "AI Price Insights" panel tabs to verify the new weather chip (`🌦️ Weather: Clear / Rain Alert`) and verify that no strings say "Real-time" or "AI-powered".
