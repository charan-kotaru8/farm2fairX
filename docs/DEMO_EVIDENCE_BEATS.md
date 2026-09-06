# Farm2Fair: Judge-Proof Evidence Playbook (§8.5)

This playbook outlines the exact 5 evidence beats to deliver during a hackathon or evaluation pitch. When judges probe "Is this genuinely real or just a prototype with hardcoded data?", perform these 5 concrete beats to eliminate doubt.

---

## Beat 1: Interactive Swagger API Documentation (30 seconds)
- **Action:** Open a browser tab to `http://127.0.0.1:8000/docs` (or your deployed API `/docs`).
- **Show:** 
  - Point to the FastAPI OpenAPI schema with live endpoints organized into modular routers:
    - `/markets` (Agmarknet Live Sync & APMC Benchmarks)
    - `/ai` (Dynamic Price Recommendation & Multi-factor Buyer Matching)
    - `/lots` & `/offers` (Digital contracts & deal locks)
    - `/logistics` & `/storage` (Haversine distance, availability locking, warehouse allocations)
    - `/quality` (Buyer farmgate verification Before/After comparison)
    - `/analytics` & `/grievances` (Locked-down farmer benefit formula, 48h SLA monitoring)
- **Verbal Script:**
  > *"Every calculation, state transition, and AI inference on Farm2Fair is powered by our live FastAPI backend with strict Pydantic schemas. Nothing is mocked on the client."*

---

## Beat 2: Live Supabase Database & Security Model (30 seconds)
- **Action:** Show the Supabase Dashboard (or the terminal query output of tables).
- **Show:**
  - 10 active relational tables: `crops`, `markets`, `market_prices`, `lots`, `offers`, `transport_providers`, `storage_facilities`, `lot_quality_verifications`, `grievances`, `notifications`.
  - Point out real foreign key constraints (e.g. `lot_id` cascading, `user_id` profiles reference) and Row Level Security (RLS) policies.
- **Verbal Script:**
  > *"We store our data in a relational PostgreSQL database on Supabase with foreign keys and Row Level Security. Notice how transport status automatically drives lot status in a single database update — guaranteeing one source of truth."*

---

## Beat 3: The Live Price-Edit → AI-Update Trick (1 minute — High Impact!)
- **Action:** 
  1. Open `/admin/markets` in one tab (or window).
  2. Open `/farmer/dashboard` in another tab.
  3. On the Admin Market Price Control page, find **Soybean (Latur APMC)** with current modal price ₹5,050/q.
  4. Click **Edit** and bump the modal benchmark price to **₹5,400/q** (or use the inline Live AI Price Intelligence Tester on the right).
  5. Save the price.
  6. Switch back to the Farmer tab and refresh/re-evaluate: the AI Price Recommendation immediately updates its expected price range to match the new benchmark without requiring a backend reboot or database re-seeding!
- **Verbal Script:**
  > *"Notice how the AI price recommendation engine doesn't read static pre-rendered text. It queries the active database on every invocation. When market prices fluctuate at the APMC, the AI recommendation recalibrates immediately."*

---

## Beat 4: Verbalizing the Backtest & Locked Benefit Formula (45 seconds)
- **Verbal Script:**
  > *"Judges often ask: how do we calculate the 'Cumulative Farmer Benefit'? We lock down one single formula across the entire platform: `(accepted_offer − first_available_offer) × quantity`. This is identical to the Phase 2 Fair Value Story Card. In historical APMC backtesting across 14 days of Latur Soybean data, farmers holding for the AI-recommended 2–3 day window achieved an average premium of +₹280 per quintal over distress sale baselines. The ₹2,24,000 figure on our admin dashboard is the exact sum of this formula across completed platform lots — no divergent calculations."*

---

## Beat 5: Defensive Agmarknet Live Sync & Missing Arrivals Resilience (45 seconds)
- **Action:** Show the sync badge in the UI: `"Live · Agmarknet · synced 18:30"` or `"Live · stale (last updated 06/09)"`.
- **Verbal Script:**
  > *"Farm2Fair connects to the Government of India's Agmarknet API on data.gov.in. Because government data feeds routinely experience daily arrival gaps or network timeouts, our backend architecture is built defensively. We maintain a crop-name mapping table — resolving 'Soybean' to Agmarknet's 'Soyabean', 'Tur Dal' to 'Arhar (Tur/Red Gram)(Whole)'. And under our non-negotiable stale-fallback rule, if a commodity has zero arrivals on a given day, we keep the last verified price labeled as 'Live · stale' rather than showing a blank screen. The live data layer never fails visibly."*

---

## Demo Role Switcher Framing (§8.2)
- When presenting, point out the **[Judging Only]** badge on the demo role switcher:
  > *"For your convenience during evaluation, we've included an instant role switcher in the sidebar to let you evaluate the Farmer, Buyer, FPO, and Admin experiences seamlessly. This switcher is gated behind `VITE_DEMO_MODE=true` and is disabled in production builds."*
