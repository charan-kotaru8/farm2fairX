# 🌾 Farm2Fair — Improvement Plan v2
### Working-Model Upgrade: Real Data, Real AI/ML, Full Language Coverage

This is an **amendment** to the original Master Plan, not a replacement. It patches three things that were scoped for a "demo" mindset and now need to hold up as a working model: the AI layer, the live data layer, and language coverage. Read this alongside Phases 1, 4, and 8 of the Master Plan — it tells you exactly what changes in each.

---

## 0. Why this update

Three shifts in thinking drove this:

1. **You have a real, working data.gov.in API key** pulling live Agmarknet mandi prices — this is no longer a "nice to have," it's the backbone of the market-intelligence claim in the official problem statement.
2. **"AI-based" needed a precise definition.** You're not missing an LLM — you have genuine ML (regression + weighted scoring). What was missing was *more real data feeding it* and *correct terminology* so nobody undersells it or gets caught overselling it.
3. **Language coverage was scoped for a 5-minute demo, not a working platform.** "Landing page + farmer dashboard" is a compromise you don't need to make anymore.

---

## 1. Cross-Cutting: Terminology & Framing (applies everywhere — README, pitch, UI labels)

| Don't say | Say instead |
|---|---|
| "AI-powered" (vague) | **"AI/ML-driven"** — regression-based price prediction + weighted multi-criteria buyer matching |
| "Real-time prices" | **"Daily-live prices"** — synced from Agmarknet, which itself updates once per market per day; be precise, it protects your credibility |
| "Powered by AI" with no explanation ready | Have one sentence ready: *"a regression model trained and backtested on historical mandi data, plus a weighted scoring algorithm for buyer matching"* |

This single wording fix removes your biggest exposure to a judge's "so which AI did you actually use?" question — the honest answer is now precise and defensible instead of vague.

---

## 2. Phase 1 Amendment — i18n as Foundational Architecture

**What changes:** internationalization moves from a Phase 8 polish item to a **Phase 1 structural requirement.**

- Set up `react-i18next` (or equivalent) in Phase 1, before any feature screens are built — every UI string from this point on goes through a translation key (`t('dashboard.currentPrice')`), never hardcoded text.
- Create the locale file structure immediately: `src/i18n/en.json`, `hi.json`, `mr.json` — even if `hi.json`/`mr.json` start mostly empty, the *pattern* is enforced from day one.
- Add a lint/review habit (even a manual checklist item per PR) to reject hardcoded UI strings — retrofitting i18n across a large app later is far more expensive than enforcing it from the start.
- Language switcher in the top bar, wired from Phase 1's shell, even though most keys won't be translated yet.

**Why this matters:** the earlier plan's "shallow coverage" compromise existed *because* i18n was bolted on late. Structuring it from Phase 1 means full coverage across all four dashboards becomes a translation-effort problem (just filling in JSON files later), not an engineering-effort problem.

**Updated Phase 1 checklist addition:**
- [ ] Every string rendered in Phase 1's shell (nav, buttons, landing page) goes through an i18n key, not hardcoded text
- [ ] `en.json` / `hi.json` / `mr.json` exist and are wired to the language switcher from the start

---

## 3. Phase 4 Rework — Real Datasets + Correct AI/ML Framing

### 3.1 New data inputs

| Signal | Source | Status |
|---|---|---|
| Prices | Agmarknet via data.gov.in (`state=Maharashtra` filter — confirmed working) | ✅ Live |
| **Arrivals (volume)** | Agmarknet — likely a **separate resource ID** on data.gov.in from the price one you tested; search the Agriculture sector catalog specifically for an arrivals dataset | 🔍 To confirm |
| **Weather (rainfall/temp trend)** | NASA POWER API — free, no key required, daily data by lat/lng | 🔍 To integrate |
| Digital-channel prices (e-NAM) | Check data.gov.in for e-NAM trade data — directly answers the PS's "digital trading channels" phrase | 🔍 Optional, worth 30 min of searching |

**Action before building:** spend a short session confirming the arrivals dataset's resource ID and field names the same way you validated the price one (`curl` test, check `field` list in the response) — don't assume the structure matches the price resource.

### 3.2 Updated feature set for the price/sale-window model

- Price trend (existing)
- **Arrival-volume trend** (new — real, not placeholder)
- **Weather trend** (new — rainfall/temperature signal as a leading indicator for arrivals/price volatility)
- Demand proxy (existing)

Same architecture as before: **regression predicts the price range, rules decide the action** (SELL NOW / WAIT / COMPARE) from the fuller signal set. Adding real features doesn't mean adding model complexity — resist the pull toward ARIMA/Prophet/deep learning; a well-validated regression with real inputs beats a fancier model nobody can explain under questioning.

### 3.3 Re-run the backtest with the fuller feature set

The backtest you already planned (hide last 3–5 days, check if the model would've called it right) needs to be **re-run once arrivals and weather are wired in** — this is the evidence that the fuller AI/ML system genuinely works, not just the narrower one.

### 3.4 Say the terminology correctly, everywhere

Every recommendation card, README section, and pitch line uses **"AI/ML-driven"** with the model type named. Never leave "AI-based" unqualified.

**Updated Phase 4 checklist addition:**
- [ ] Arrivals dataset resource confirmed and integrated (or explicitly logged as unavailable with a documented fallback)
- [ ] Weather trend (NASA POWER) wired in as a real model input
- [ ] Backtest re-validated against the fuller feature set
- [ ] README states plainly: regression + weighted scoring, not an LLM — with the one-line explanation ready for Q&A

---

## 4. Phase 8 Amendment — Real-Time Honesty + Full Language Coverage

### 4.1 Live sync cadence — say it precisely

- Sync runs on a schedule (every few hours is reasonable) — never claim "real-time" in any UI copy, README, or pitch line. Use **"Live · Agmarknet · synced HH:MM"**, matching what you already planned.
- The *app's* real-time feel comes from the price-edit-triggers-AI-update trick (Phase 7) — that's your actual "real-time" story; the data source itself is daily.

### 4.2 Language coverage — remove the "shallow" compromise

- Original plan: deep EN/HI/MR on landing + farmer dashboard only, shallow elsewhere.
- **Updated:** EN/HI/MR full coverage across **all four role dashboards** — Farmer, Buyer, FPO, Admin — since Phase 1 now enforces i18n keys everywhere, this becomes a translation-content task, not a re-engineering task.
- Additional showcase languages (e.g., Telugu) remain optional and shallow (landing page only) — that compromise still makes sense, it's the EN/HI/MR depth that changes.

**Updated Phase 8 checklist addition:**
- [ ] EN/HI/MR fully translated across Farmer, Buyer, FPO, and Admin dashboards (not just landing + farmer)
- [ ] No UI copy anywhere claims "real-time" — audit and correct to "daily-live" / "synced HH:MM"
- [ ] Arrivals + weather data sources are cited explicitly in the README's data-sources section

---

## 5. Updated Master Checklist Additions

Add these to the Master Plan's §10 success checklist:

- [ ] Price recommendation model uses real arrivals and weather data, not placeholders
- [ ] Backtest validated against the full (price + arrivals + weather) feature set
- [ ] All AI/ML claims in the app and README use precise terminology (regression + weighted scoring, explicitly not an LLM)
- [ ] No "real-time" claims anywhere — "daily-live" used consistently
- [ ] Full EN/HI/MR coverage confirmed across all four dashboards, not just two screens
- [ ] i18n key discipline maintained from Phase 1 onward — no hardcoded UI strings found in a final audit

---

## 6. What to research/confirm before building (quick pre-work)

1. `curl` the data.gov.in Agriculture catalog for an **arrivals** dataset resource ID, same validation method as the price API.
2. Confirm **NASA POWER API** endpoint format for daily rainfall/temperature by lat/lng (no key needed).
3. Spend 30 minutes checking whether **e-NAM** trade data is exposed anywhere on data.gov.in — optional, but directly answers a phrase in the official PS.

Do this before touching Phase 4 code — same lesson as the Agmarknet price API: confirm the real field names and behavior first, then build against the real shape of the data.
