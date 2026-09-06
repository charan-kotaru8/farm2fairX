# Farm2Fair — AI Intelligence Methodology & Design Document

### Problem Statement 26132 | Smart Agriculture & Fair Value Discovery

This document details the architecture, signal processing, rule weighting, and regression models underpinning Farm2Fair's AI decision engine.

---

## 1. Dual Hybrid Architecture (Statistical + Rule-Based AI)

Rather than treating AI as a "black box," Farm2Fair combines transparent statistical regression with human-explainable agronomic and market rule heuristics:

1. **Statistical Price Forecasting (`regression.py`):**
   - Ordinary Least Squares (OLS) linear trend regression and moving-average window analysis over 7-day, 14-day, and 30-day historical modal prices from Maharashtra APMCs.
   - Calculates historical price velocity ($dP/dt$), variance, and expected price interval ($[P_{min}, P_{max}]$).

2. **Agronomic & Market Rule Engine (`rule_engine.py`):**
   - Evaluates arrival pressure: `High Arrivals` ($>1.2\times$ average) signals downward price resistance.
   - Evaluates buyer demand signals: active open buyer procurement requirements vs open farmer listings.
   - Computes overall confidence score ($0-100\%$) and maps to actionable guidance: `SELL NOW`, `WAIT / HOLD`, or `COMPARE BUYERS`.

3. **Smart Buyer Compatibility Scoring (`buyer_matching.py`):**
   - Multicriteria scoring evaluating:
     - Crop & Grade Compatibility ($30\%$)
     - Quantity Match ($20\%$)
     - Price Attractiveness ($25\%$)
     - Buyer Reliability & Verification Tier ($15\%$)
     - Distance & Logistics Feasibility ($10\%$)

---

## 2. Note on Feature Sequencing & Storage Signal (§6.5 Architecture Sync)

In earlier planning specifications for Phase 4, "storage availability" was proposed as an input signal to determine holding feasibility.

To ensure architectural honesty and strict integrity:
- **Phase 4 Baseline:** Operates on historical APMC modal prices, arrival volumes, demand ratios, and crop perishability factors.
- **Phase 6 Storage Awareness Layering:** With the completion of Phase 6's Storage & Warehousing subsystem (`storage_facilities`, `storage_bookings`), real certified warehouse capacity and proximity signals (via Haversine calculations) are directly queryable.
- Future recommendation cycles can consume active booking state (`storage_bookings`) to extend the recommended holding window when a farmer has verified buffer storage secured.

---

## 3. Explainability & Trust

Every recommendation returned by `/ai/price-recommendation` and `/ai/buyer-match` includes:
- Plain-language justification chips (e.g., `Trend: Upward (+3.2%)`, `Arrivals: Low (-12%)`, `Demand: High (2.4x)`).
- Human-readable narrative explanation describing the exact factors behind the verdict.
