# 🌾 Farm2Fair — Direct APMC Market Linkage & Fair Value Platform

Farm2Fair is a production-grade, full-stack agricultural marketplace platform built for Indian agriculture. It connects smallholder farmers, FPOs (Farmer Producer Organizations), certified institutional buyers, and local transport/storage providers directly into transparent digital trade agreements.

---

## 🌟 Key Architecture & Highlights

1. **Defensive Agmarknet Live Sync (§8.1):** Daily-live integration with the Government of India's `data.gov.in` Agmarknet API (`filters[state]=Maharashtra`, Resource ID: `9ef84268-d588-465a-a308-a864a43d0070`). Includes a commodity mapping table (e.g. `Soybean` → `Soyabean`) and an automatic stale-fallback mechanism so missing daily arrivals never blank out the UI.
2. **AI/ML-Driven Price Intelligence & Multi-Factor Matching (§4):** Dual-tier model:
   - **Linear Regression:** Computes price band, trend slope (₹/day), and R² confidence from official APMC time series.
   - **Rule Engine Decision Table:** Determines *Sell Now*, *Wait*, or *Compare Buyers* from price momentum, arrival volume shifts, and NASA POWER weather signals.
   - **Multi-Factor Buyer Matching:** Weighted scoring (Distance 35%, Quantity 30%, Quality 20%, Reliability 15%).
3. **NASA POWER Agroclimatology Integration:** Live and cached daily meteorological parameters (precipitation/rainfall, ambient temperature) by APMC coordinates as leading indicators for logistics feasibility.
4. **Locked-Down Farmer Benefit Formula (§7.1):** Single source of truth across per-lot cards and admin governance: `(accepted_offer − first_available_offer) × quantity`.
5. **Unified Logistics & Farmgate Quality (§6):** One lot, one source of truth. Transport status transitions directly drive lot status. Buyer agents perform farmgate inspections with Before/After certificates.
6. **10 Supported Maharashtra Crops (§8.3):** Soybean, Cotton, Tur Dal, Wheat, Onion, Sugarcane, Turmeric, Groundnut, Bajra, and Grapes.
7. **Comprehensive Regional Language Localization (§8.4):** First-class support for English, Hindi (हिन्दी), Marathi (मराठी), and Telugu (తెలుగు) across farmer navigation, dashboard, crop intelligence, and landing page.
8. **Guided Demo Mode (§8.6):** Built-in presenter tour overlay navigating judges through the complete 5-act journey from farmer listing to admin governance.

---

## 📊 Data Sources & Verifiability

Full specification available in [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md).

- **Agmarknet (Ministry of Agriculture & Farmers Welfare / data.gov.in):**
  - Daily-live modal prices and market arrivals across Maharashtra APMCs.
  - Resource ID: `9ef84268-d588-465a-a308-a864a43d0070`.
  - Cadence: Daily-live (mandis upload observations once per day).
- **NASA POWER (Prediction of Worldwide Energy Resources):**
  - Daily meteorological precipitation and temperature data for mandi micro-regions.
- **e-NAM Integration Status:**
  - Public REST APIs on data.gov.in currently require captive APMC market committee credentials; documented as a future institutional gateway. Agmarknet provides the authoritative public pricing benchmark.

---

## 🚀 Quickstart Guide (Under 10 Minutes)

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- Free Supabase project (PostgreSQL)

---

### Step 1: Backend Setup
```bash
cd backend

# 1. Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your Supabase URL, Service Role Key, and AGMARKNET_API_KEY

# 4. Seed database (10 crops, APMC benchmarks, buyers, transport, grievances)
python -m app.seed.seed_phase8_crops
python -m app.seed.seed_phase7
python -m app.seed.seed_phase6
python -m app.seed.seed_phase5
python -m app.seed.seed_phase4

# 5. Run AI/ML Model Backtest Verification
python -m app.ai.backtest

# 6. Start development API server
uvicorn app.main:app --reload
```
API runs at `http://127.0.0.1:8000`. Interactive OpenAPI documentation at `http://127.0.0.1:8000/docs`.

---

### Step 2: Frontend Setup
```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
# Set VITE_API_BASE_URL=http://localhost:8000
# Set VITE_DEMO_MODE=true

# 3. Start development UI server
npm run dev
```
UI runs at `http://localhost:5173`.

---

## 🎯 Demo & Judging Playbook

For a comprehensive rehearsed pitch script with the 5 judge-proof evidence beats (Swagger docs, Supabase tables, live price-edit trick, backtesting results, and Agmarknet fallback), see [`docs/DEMO_EVIDENCE_BEATS.md`](docs/DEMO_EVIDENCE_BEATS.md).

Click the **Guided Tour** button in the dashboard top navigation bar to launch the step-by-step 5-act presenter overlay.

---

## 🛠️ Technology Stack
- **Backend:** FastAPI (Python), Pydantic v2, Supabase Python Client, HTTPX, PostgREST
- **Frontend:** React 19, Vite, Tailwind CSS, Lucide Icons, Recharts, i18next
- **Database:** Supabase PostgreSQL with Row Level Security (RLS)
- **External Data:** Agmarknet (Ministry of Agriculture & Farmers Welfare, data.gov.in) & NASA POWER Agroclimatology
