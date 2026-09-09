# 🌾 Farm2Fair — Master Build Plan
### SIH 2026 Prototype | Problem Statement 26132 | Govt. of Maharashtra

**Tagline:** *From Farm to Fair Value*
**Theme:** Agriculture, FoodTech & Rural Development
**Prototype philosophy:** working end-to-end flow > feature count. Every phase below ends with something demoable.

---

## Table of Contents

1. [What This Plan Adds Beyond the Base Prompt](#1-what-this-plan-adds-beyond-the-base-prompt)
2. [Design System & UI/UX Foundations](#2-design-system--uiux-foundations)
3. [Enhanced Workflows](#3-enhanced-workflows)
4. [Architecture (Scalable but Prototype-Friendly)](#4-architecture-scalable-but-prototype-friendly)
5. [Extra Modules That Boost Trust & Demo Impact](#5-extra-modules-that-boost-trust--demo-impact)
6. [Tech Stack Usage Map](#6-tech-stack-usage-map)
7. [Data Model Notes](#7-data-model-notes)
8. [Phase-Wise Execution Roadmap](#8-phase-wise-execution-roadmap)
9. [Demo Readiness Playbook](#9-demo-readiness-playbook)
10. [Master Success Checklist](#10-master-success-checklist)
11. [Appendix](#11-appendix)

---

## 1. What This Plan Adds Beyond the Base Prompt

The original build prompt is solid on scope and rules. This plan layers on:

- A concrete **design system** (colors, type, components, motion) so "polished startup UI" is a spec, not a vibe.
- **Reworked workflows** for onboarding, verification, and grievances that reduce clicks and build visible trust.
- A **judge-facing demo layer** (guided walkthrough, narrated AI reasoning, impact storytelling) — this is usually what separates a top-10 SIH finish from a mid-table one.
- **Gamification and storytelling elements** that make the "information asymmetry → fair value" story emotionally legible in 90 seconds.
- A **phase structure matched to your 8-phase request**, each phase ending in a demoable slice, sized for iterative building in Antigravity.

---

## 2. Design System & UI/UX Foundations

### 2.1 Visual identity

| Token | Choice | Why |
|---|---|---|
| Primary | Deep green `#1B5E3C` | Agriculture, growth, trust |
| Accent | Warm amber `#F5A623` | "Fair value" / harvest gold — use for CTAs, prices, highlights |
| Secondary | Sky blue `#2D6CDF` | Buyer-side / market-intelligence sections, links |
| Success | `#2E9E5B` | Accepted offers, delivered status |
| Warning | `#E8A33D` | Grievances, pending states |
| Danger | `#D64545` | Rejections, disputes |
| Neutral scale | Tailwind `slate` 50→900 | Backgrounds, borders, text |

- **Typography:** `Poppins` or `Sora` (semi-bold, geometric) for headings; `Inter` for body/data. Numbers (prices, %) in tabular-nums so charts and cards align cleanly.
- **Component base:** Tailwind + `shadcn/ui` (built on Radix) — gives accessible dropdowns, dialogs, tabs, toasts for free, still lightweight enough for a prototype.
- **Icons:** `lucide-react` throughout — consistent stroke weight, agriculture-adjacent icons available (sprout, wheat, truck, warehouse, handshake).
- **Cards over tables** wherever a human (not an auditor) is the audience — tables only for admin/raw data views.
- **Elevation model:** flat design with soft shadows (`shadow-sm`/`shadow-md`) and 12–16px radius; avoid heavy skeuomorphism.
- **Motion:** subtle only — 150–200ms fade/slide on route change, number count-up on dashboard stats, a gentle pulse on the AI recommendation badge. No parallax, no heavy scroll animation (per the "avoid excessive animation" rule, and because it's demo-risk for no payoff).

### 2.2 Layout patterns

- **Public site (landing, login, signup):** full-width marketing layout, strong hero, sticky nav with "Get Started" CTA.
- **Authenticated app (Farmer/Buyer/FPO/Admin):** persistent left sidebar (collapsible on mobile → bottom nav), top bar with language switcher, notification bell, profile menu.
- **Dashboards:** **bento-grid** layout — a few large primary cards (current price, AI recommendation) + smaller stat tiles, not one long scroll of identical cards.
- **Comparison surfaces** (market comparison, offer comparison, storage comparison): side-by-side card layout with a "best value" ribbon on the winning option, collapsing to a horizontal swipe carousel on mobile.
- **Maps:** Leaflet map as a *panel*, not a full page — list on one side, map on the other, synced hover/click.

### 2.3 Accessibility & inclusivity

- Minimum WCAG AA contrast on all text/background pairs (verify amber-on-white specifically — use it on dark or bordered surfaces, not as body text).
- Full keyboard navigation + visible focus rings (shadcn/Radix gives this by default — don't override it away).
- `aria-label`s on icon-only buttons; status changes (offer accepted, grievance updated) announced via `aria-live` region for screen readers.
- Font-size toggle (A / A+ / A++) in the top bar — cheap to build, high goodwill with judges evaluating rural accessibility.
- **Multilingual:** `react-i18next` with English / Hindi / Marathi. Even partial coverage (landing page + farmer dashboard + core labels) is enough to demonstrate intent — flag it in the README as "core flows localized; full coverage is a stated future enhancement."

### 2.4 States that are easy to forget

- Empty states with an illustration + one-line guidance + CTA (never a blank white card).
- Skeleton loaders (not spinners) for dashboard cards and lists — reads as more "product-grade."
- Toast notifications for every mutating action (offer submitted, lot created, grievance filed) — instant feedback loop.
- Error states that explain *what to do next*, never a raw stack trace.

---

## 3. Enhanced Workflows

### 3.1 Farmer onboarding (gamified, progressive)

Instead of one long signup form:

1. **Quick start (60 seconds):** phone/email + OTP (Supabase Auth) → pick primary crop from an illustrated crop-tile grid → pick district/market from a searchable dropdown with map pin confirmation.
2. **Progressive profile bar** ("Profile 40% complete") that nudges farmers to add farm size, additional crops, storage access, FPO membership — each completed field ticks the bar and unlocks a small perk (e.g., completing quality-parameter defaults unlocks "priority buyer matching").
3. **First-run guided tour** (3–4 tooltips) pointing at: market prices card → AI recommendation → "Create your first lot" button.
4. **Sample data safety net:** if a brand-new farmer account has no lots yet, show a "Try with sample crop" ghost lot so the dashboard never looks broken/empty during a live demo of a *fresh* account.

### 3.2 Buyer verification (tiered, transparent)

1. Buyer signs up → self-declares business details + crops of interest → lands in **"Pending Verification"** state with a clear checklist of what's needed (business proof, past transaction reference — mocked documents are fine for a prototype, just don't fake the *status*).
2. Admin verification queue shows each pending buyer as a card with a checklist (Business info ✓, Location ✓, Document uploaded ✓) and a single **Approve / Request more info / Reject** action — not a bare table row.
3. Verification tiers, shown as badges everywhere the buyer appears to farmers:
   - 🟡 **Basic** (self-declared only, can browse but not offer)
   - 🟢 **Verified** (admin-approved, can submit offers)
   - 🔵 **Trusted Partner** (verified + N completed transactions + high rating — earned automatically, not admin-assigned)
4. Farmers always see *why* a buyer has a given badge (hover/tap reveals the criteria) — this is the "transparent AI/trust" theme carried into a non-AI feature.

### 3.3 Grievance handling (guided, not a bare form)

1. **Category-first picker** (payment delay / quality dispute / quantity mismatch / transport / buyer issue / other) — each category pre-fills relevant context (transaction ID, involved party) so the farmer isn't retyping IDs.
2. **Auto-suggested first step** per category before formal filing (e.g., quality dispute → "Have you checked the quality-verification photos on this lot?") — deflects trivial cases, makes the ones that *are* filed look more serious for the demo.
3. **SLA countdown** ("Typically reviewed within 48 hrs") + visible status timeline (Open → Under Review → Resolved/Rejected) mirroring the transaction-timeline visual language for consistency.
4. **Admin triage view** grouped by category and age, with a one-click "Mark Under Review" / resolution note / resolve action.
5. Optional satisfaction rating on close — feeds the admin analytics ("92% grievances resolved, avg 1.8 days") which is a great judge-facing trust metric.

---

## 4. Architecture (Scalable but Prototype-Friendly)

```
React (Vite) SPA
      │  fetch/axios, JWT from Supabase session
      ▼
Supabase Auth  ──────────────►  Supabase PostgreSQL (+ RLS as a safety net)
      │
      ▼
FastAPI REST API  (validates Supabase JWT on every request)
      │
      ├── core/        shared config, DB session, security deps
      ├── auth/        profile bootstrap, role assignment
      ├── farmers/ buyers/ fpo/     role-specific CRUD
      ├── markets/ crops/           market intelligence data
      ├── lots/ offers/             marketplace core
      ├── logistics/ storage/       operations
      ├── payments/ grievances/     trust & post-sale
      ├── analytics/                admin aggregates
      └── ai/                       isolated, stateless, importable module
```

**Why this scales without over-building now:**
- AI/ML kept in its own `ai/` package with pure functions (`recommend_price(...)`, `score_buyer_match(...)`) — no framework coupling, so it can later move to a separate worker/service without touching the rest of the API.
- Supabase Row Level Security acts as a second line of defense behind FastAPI's own auth checks — cheap insurance, not extra infra.
- Read-heavy endpoints (market prices, buyer discovery) are natural caching points *later* (HTTP cache headers or a simple in-memory TTL cache) — don't add Redis now, just don't write code that would make adding it hard later (i.e., keep those functions pure/query-based).
- Postgres views for the heavier admin analytics aggregates instead of ad-hoc Python loops — keeps the "analytics" endpoint fast even as demo data grows.
- Frontend built as feature-folders (`features/farmer-dashboard`, `features/buyer-marketplace`, etc.) inside `src/`, not just `pages/` + `components/` — makes it obvious which phase owns which code, which matters since you're building phase-by-phase.

### Refined folder structure

```
backend/app/
  main.py, core/, auth/, farmers/, buyers/, fpo/, markets/, crops/,
  lots/, offers/, logistics/, storage/, payments/, grievances/,
  analytics/, ai/, seed/            ← demo-data seeding scripts live here

frontend/src/
  app/            (App.jsx, router, providers)
  layouts/        (PublicLayout, DashboardLayout per role)
  features/
    landing/  auth/  farmer-dashboard/  market-intel/  buyer-marketplace/
    ai-recommendation/  fpo/  logistics/  storage/  payments/
    grievances/  admin/  notifications/
  components/ui/  (shared shadcn-based primitives)
  hooks/  context/  services/  utils/  i18n/  data/
```

---

## 5. Extra Modules That Boost Trust & Demo Impact

- **"Your Fair Value Story" card** — on the farmer dashboard, a single sentence like *"By waiting 3 days and comparing 3 buyers, Ramesh earned ₹1,500 more on this lot"* — turns an abstract price chart into a human outcome. Compute it as `(accepted_offer − first_available_offer) × quantity`.
- **Judge/Guided Demo Mode** — a toggle (admin-only or query-param `?demo=guided`) that overlays numbered callouts walking through the exact demo scenario, so presenters never fumble live. Cheap to build with a small tooltip-sequence component; disproportionately impressive to judges.
- **Impact analytics on the landing page & admin dashboard** — aggregate, animated counters: farmers onboarded, total traded volume, estimated total farmer benefit. Even on seed data, this visualizes the mission.
- **Aggregation visual for FPOs** — a simple stacked bar / "filling jar" animation showing individual farmer contributions merging into one aggregated lot, with a before/after buyer-pool-size comparison (see §3, "smaller pool vs larger pool" framing from the base prompt) rendered as an actual visual, not just text.
- **Explainable-AI panel, always visible, never a popup** — every AI output ships with a one-line "why" (drivers: trend, arrivals, demand) rendered as small tags/chips next to the recommendation, satisfying the "avoid opaque AI claims" rule visually.
- **Multilingual toggle** in the top bar (EN / HI / MR) — see §2.3.
- **Notification center** — bell icon with unread badge + dropdown feed, backed by the `notifications` table; also powers in-app toasts.
- **Data provenance badges** — small "Demo Data" / "Live" tag on any dataset card, satisfying Rule 9 (never claim mock is live) visibly rather than just in code comments.

---

## 6. Tech Stack Usage Map

| Layer | Tool | Used for |
|---|---|---|
| Frontend framework | React + Vite | SPA, fast dev loop |
| Styling | Tailwind CSS + shadcn/ui | Design system, accessible components |
| Routing | React Router | Role-based protected routes |
| Charts | Recharts | Price trends, arrival volumes, admin analytics |
| Maps | Leaflet + OpenStreetMap | Market discovery, storage/logistics location |
| i18n | react-i18next | EN/HI/MR |
| Backend framework | FastAPI + Pydantic | REST API, validation |
| ORM | SQLAlchemy | Postgres access |
| Auth | Supabase Auth | Signup/login/session, JWT |
| Database | Supabase PostgreSQL | All persistent data, RLS |
| AI/ML | pandas, NumPy, scikit-learn | Price trend + buyer match scoring |
| Hosting | Vercel (frontend), Render (backend), Supabase (DB/Auth) | Deployment targets |
| VCS | Git + GitHub | Source control, phase-by-phase commits |

No Kubernetes, Redis, Kafka, microservices, or paid AI APIs — consistent with the base prompt's constraints.

---

## 7. Data Model Notes

Keep the entity list from the base prompt (`profiles, farmers, buyers, fpos, fpo_members, crops, markets, market_prices, market_arrivals, lots, lot_quality, buyer_requirements, buyer_offers, transport_providers, transport_bookings, storage_facilities, storage_bookings, transactions, payments, grievances, notifications`) and add only what the enhancements above need:

- `buyers.verification_tier` enum (`basic | verified | trusted_partner`) — derived/updated, not just admin-set.
- `lots.status` as a Postgres enum matching the lifecycle (`draft → active → offer_received → offer_accepted → pickup_scheduled → delivered → completed`).
- `grievances.category` enum + `resolved_at`, `satisfaction_rating` (nullable) for the analytics in §3.3.
- A lightweight `ai_recommendations` log table (lot/crop id, recommendation, confidence, explanation, created_at) — lets the admin dashboard show "AI recommendations issued" as a real metric instead of a static claim, and gives you an audit trail for the demo narration.

Use Postgres enums/check constraints for every status field — prevents "impossible state" bugs during a live demo, which is the worst kind of bug to have in front of judges.

---

## 8. Phase-Wise Execution Roadmap

> Each phase is sized to be buildable and demoable on its own in Antigravity. Work through them in order; don't start a phase's UI before its data layer exists.

### Phase 1 — UI Foundation

**Goals:** Repo, design system, auth, and navigation shell all work end-to-end before any business feature is built.

**Key features:**
- Monorepo structure (`frontend/`, `backend/`) with env var scaffolding (`.env.example`)
- Supabase project + Auth wired (signup, login, logout, session persistence, password reset)
- Role selection during onboarding → writes to `profiles` table
- FastAPI skeleton validating Supabase JWTs, `core/` config, DB connection
- React Router with public routes (landing, login, signup) and protected `DashboardLayout` per role
- Design tokens set up in Tailwind config (colors, fonts from §2.1)
- Landing page (hero, "Discover → Compare → Sell Better", CTA) built to the design system

**UI/UX notes:** This phase *is* the first impression — spend real effort on the landing page and login/signup polish, since judges see these first. Include the language switcher and font-size toggle shells even if only English is wired initially.

**Tech stack usage:** React/Vite/Tailwind/shadcn, React Router, Supabase Auth, FastAPI core, SQLAlchemy connection.

**Deliverables / Checklist:**
- [ ] App boots (frontend + backend) with one command each
- [ ] User can sign up, pick a role, log in, log out, and session persists on refresh
- [ ] Protected routes redirect unauthenticated users to login
- [ ] Landing page matches design system (colors, type, CTA)
- [ ] Empty dashboard shells exist for all 4 roles (even if just a "Coming in Phase 2" placeholder with correct layout)

---

### Phase 2 — Farmer Flows

**Goals:** A farmer can log in, understand today's market, and create a real lot.

**Key features:**
- Farmer dashboard: current crop price, best offer, active lots count, trend, demand indicator, recommendation placeholder (real AI arrives Phase 4), recent activity, notifications
- Market intelligence module: filterable table/cards by crop/district/market/date; 7-day and 30-day trend charts; market comparison view
- Local market discovery map (Leaflet + OSM, static realistic coordinates) with distance, price, arrival volume, demand
- Crop lot creation flow (multi-step form: crop → quantity/quality → harvest & availability dates → storage requirement → photos) with lot status lifecycle
- Onboarding enhancements from §3.1 (progressive profile bar, sample ghost lot for empty state)

**UI/UX notes:** Bento-grid dashboard (§2.2). Comparison views use the side-by-side card pattern with a "best value" ribbon. Multi-step lot creation with a progress indicator, not one long form.

**Tech stack usage:** Recharts for trends, Leaflet/OSM for the map, FastAPI `markets/`, `crops/`, `lots/` modules, SQLAlchemy queries against seeded `market_prices`/`market_arrivals`.

**Deliverables / Checklist:**
- [ ] Farmer dashboard renders real (seeded) data, not placeholders
- [ ] Market comparison across ≥3 markets works with working filters
- [ ] 7-day and 30-day charts render correctly from seed data
- [ ] Map shows nearby markets with accurate-looking demo coordinates
- [ ] Farmer can create a lot end-to-end and see it in "My Lots" with correct status

---

### Phase 3 — Buyer Marketplace

**Goals:** A buyer can be discovered by and transact with a farmer — the core two-sided marketplace loop closes.

**Key features:**
- Buyer signup/profile + tiered verification flow (§3.2) and admin verification queue
- Buyer requirement posting (crop, quantity, quality, location)
- Buyer-side lot discovery matching their requirements
- Digital offer submission (price, quantity, validity, payment terms, pickup terms, notes)
- Farmer-side offer comparison ("Best price / Best overall match / Fastest payment / Most reliable buyer" callouts) and accept/reject

**UI/UX notes:** Verification badges (§3.2) visible on every buyer card. Offer comparison uses the same side-by-side + ribbon pattern as market comparison for visual consistency across the app.

**Tech stack usage:** FastAPI `buyers/`, `offers/` modules; Supabase RLS to ensure buyers only see their own requirements/offers and farmers only see offers on their own lots.

**Deliverables / Checklist:**
- [ ] Buyer can sign up, get verified (admin action), and post a requirement
- [ ] Buyer sees matching lots (basic filter-based matching is fine here — smart scoring comes in Phase 4)
- [ ] Buyer can submit an offer; farmer sees it on the relevant lot
- [ ] Farmer can compare ≥2 offers and accept one; lot status updates accordingly
- [ ] Rejected offers are handled gracefully (status + optional reason)

---

### Phase 4 — AI Intelligence

**Goals:** Replace placeholders with a genuine, explainable intelligence layer for price recommendations and buyer matching.

**Key features:**
- Price trend + sale-window recommendation engine (`ai/price_recommendation.py`): combines recent trend direction, arrival-volume trend, and demand signal into a rule-weighted score, with scikit-learn used for trend/regression where it adds real value (e.g., simple linear regression or moving-average forecast for expected price range) — not "ML for ML's sake"
- Output shape: trend, expected price range, suggested action (SELL NOW / WAIT / COMPARE BUYERS), confidence %, plain-language explanation
- Smart buyer matching engine (`ai/buyer_match.py`): weighted score across crop/quantity/quality compatibility, distance, offer price, buyer rating/reliability, demand — surfaced as "Buyer C — 94% Match" with a visible breakdown
- `ai_recommendations` audit log (§7) populated on every call
- Wire real recommendations into the Phase 2 dashboard placeholder and Phase 3 offer list

**UI/UX notes:** Recommendation and match-score cards always show the "why" chips (§5) — trend ↑, arrivals ↓, demand: High, etc. Never show a bare number or bare verdict.

**Tech stack usage:** pandas/NumPy for feature prep, scikit-learn for the regression/trend piece, isolated `ai/` package called from `lots/` and `offers/` endpoints via `/ai/price-recommendation` and `/ai/buyer-match`.

**Deliverables / Checklist:**
- [ ] `/ai/price-recommendation` returns trend, range, action, confidence, explanation for any seeded crop/market
- [ ] `/ai/buyer-match` returns a ranked, scored buyer list with per-factor breakdown for any lot
- [ ] Farmer dashboard recommendation card and offer comparison view both consume real AI output
- [ ] AI methodology documented in plain language (feeds README, §11)
- [ ] Recommendation matches the demo scenario numbers in §9 when run against seed data

---

### Phase 5 — FPO Aggregation (Refined)

**Goals:** Demonstrate the "small farmers, combined, get a stronger deal" story end-to-end with strict quality governance, transparent proportional payout splits, and verified bulk volume premiums.

**Key features:**
- **FPO Profile & Member Directory:** Manage member farmers with avatar initials, village, landholding (acres), primary crops, active unpooled lots, and KYC status.
- **Strict Quality Governance & Eligibility Engine:**
  - **Rule 1 — Identical Crop:** Zero cross-crop mixing (e.g. only JS-335 Soybean with Soybean).
  - **Rule 2 — Same Quality Grade:** Strict grade purity (e.g. Grade A cannot pool with Grade B).
  - **Rule 3 — 7-Day Harvest Window:** Batch freshness constraint where all constituent lots must have harvest dates within a strict 7-day span.
  - Server-side validation via `POST /fpo/lots/check-eligibility` and `POST /fpo/aggregate`.
- **Interactive Aggregation Wizard with Pinned Running Total Meter:**
  - Dynamic lot cards with live eligibility enforcement (ineligible lots grayed out with explicit badge reasons).
  - Sticky bottom running total progress meter tracking progress towards commercial bulk buyer tiers (50q wholesale, 80q processor, 100q industrial solvent extraction).
- **Data-Driven Before/After Benefit Analysis:**
  - Queries real buyer procurement requirements (`buyer_requirements`):
    - Without FPO: 1 buyer match for small lots (<50q) @ ₹4,780/quintal.
    - With FPO: 2 bulk buyers match (≥80-100q) @ ₹4,950/quintal (Apex Agro Processors Ltd., Maharashtra Grain Traders).
    - Net value uplift: **+₹170/quintal (+3.6%)**, delivering **+₹17,000 total extra member income** on a 100q pool.
- **Transparent Proportional Payout Accounting:**
  - Each constituent lot's share is stored in `fpo_transaction_members`:
    `Share % = (Member Contributed Quantity / Total Pool Quantity) × 100`
    `Member Payout = Contributed Quantity × Accepted Price per Quintal`
  - Lifecycle hook in `accept_offer`: when an offer on an aggregated lot is accepted, member payout shares are automatically computed and placed into escrow.
- **Marketplace Visibility:**
  - Aggregated lots display `"🌾 FPO Pool (X members)"` badge with member count and bulk quantity.
- **All-or-Nothing Bidding Governance (§5.3 Scoping):**
  - Institutional buyers bid on and accept the entire aggregated lot quantity. Partial buyer acceptance is explicitly excluded in this prototype to protect individual member fulfillment equity.

**UI/UX notes:**
- Bento grid overview on `/fpo/dashboard` with real escrow balances and readiness alerts.
- Modern member cards with avatar initials and contact quick actions on `/fpo/members`.
- High-contrast Before/After comparison cards (`BeforeAfterBenefitCard`) with emerald gradient highlights.
- Expandable member payout breakdown ledger on `/fpo/lots` showing audit-ready disbursement status.

**Tech stack usage:**
- Backend: FastAPI router `backend/app/api/fpo.py` mounted at `/fpo`, integrated with `lots`, `buyer_offers`, and `fpo_transaction_members`.
- Database: Supabase PostgreSQL tables `fpos`, `fpo_members`, `fpo_transaction_members`, and enhanced `lots` columns (`is_aggregated`, `fpo_id`, `fpo_member_id`, `parent_aggregated_lot_id`, `member_count`).
- Frontend: React + Tailwind CSS features in `src/features/fpo/` with responsive layouts and glassmorphism styling.

**Deliverables / Checklist:**
- [x] Database schema applied (`phase5_schema.sql`) with RLS policies
- [x] Seed data applied (`seed_phase5.py`) with 1 FPO, 6 members, 7 realistic candidate lots, 1 established escrowed aggregated lot, and bulk buyer requirements
- [x] Strict eligibility rules enforced (same crop, same grade, 7-day harvest window)
- [x] Running total meter tracks progress towards commercial bulk buyer requirements
- [x] Real data-driven before/after benefit card showing +₹170/q bulk premium
- [x] Proportional payout breakdown stored in `fpo_transaction_members` and updated in escrow on offer acceptance
- [x] FPO aggregated badge rendered on marketplace lot cards
- [x] All-or-nothing bidding rule recorded and enforced

---

### Phase 6 — Logistics & Storage (Refined)

**Core principle to hold onto:** One lot, one source of truth for status. Transport state should *drive* lot state, not run alongside it as a second, easily-desynced tracker.

**Key features & specifications:**

- **6.1 Unify the Status Machines:**
  - Transport status transitions **drive** lot status automatically:
    `Assigned → Pickup Scheduled → Picked Up → In Transit → Delivered` maps 1:1 onto the corresponding lot states, updated by the same backend call. The UI never reads two independent fields that could disagree.
- **6.2 Quality Verification — Assign an Owner:**
  - Verification is performed by the **buyer (or their agent) at pickup**, not self-reported by the farmer. This closes an obvious trust hole and ties naturally into the buyer reliability scoring from Phase 4.
  - Record `verifier_id` + timestamp + grade confirmed + quality parameters on the `lot_quality` record — small addition, real credibility gain.
  - High-trust Before/After visual comparison: "Declared: Grade A, 8% moisture" vs "Verified: Grade A, 9% moisture".
- **6.3 Transport Availability Guard:**
  - Once a provider is assigned to a lot, mark it **Unavailable** until that transport hits "Delivered."
  - In UI, unavailable providers are visible but grayed with reduced opacity and an "Unavailable" badge — prevents double-booking from looking broken during live demos.
- **6.4 Storage Booking Linkage — Decided Explicitly:**
  - Storage bookings can be made **standalone** (before an offer exists) or **attached to a lot** once one exists.
  - If attached, the booking shows up on the lot's timeline; if standalone, it lives under "My Storage Bookings" with an "Attach to a lot" action once an eligible lot exists.
- **6.5 Fix Phase 4 → Phase 6 Sequencing Gap:**
  - In the AI methodology doc, explicitly note that storage-availability awareness is layered in post-Phase 6 as an incremental enhancement, ensuring full architectural honesty.
- **6.6 Computed Distance & Dynamic Price:**
  - Real haversine distance calculation using stored latitude/longitude coordinates on providers, facilities, and pickup points, computing realistic distance and transparent per-km costs.
- **6.7 Designed Empty States:**
  - Thoughtfully designed empty states with helpful guidance ("No transport providers available near you right now. Try widening your search radius") rather than a blank list.

**UI/UX notes:**
- **Transport & Storage listings:** Reuses the exact comparison-card component from Phases 2–3 with "best value" ribbons (e.g. Best Price, Fastest, Top Rated).
- **Status stepper:** Horizontal 5-node stepper (`Assigned → Pickup Scheduled → Picked Up → In Transit → Delivered`) highlighted in accent color, built generically to be reused for the Phase 7 transaction timeline.
- **Quality verification screen:** Pickup inspection form showing side-by-side declared vs verified parameters.
- **Storage booking modal:** Lightweight confirm modal (dates, quantity, cost) with toast feedback.

**Tech stack usage:**
- Backend: FastAPI routers `logistics/` and `storage/`, database migration for transport providers, assignments, storage facilities, bookings, and quality verifications.
- Frontend: React components in `src/features/logistics/` and `src/features/storage/` with shared `StatusStepper` and comparison card primitives.

**Deliverables / Checklist:**
- [x] Assigning transport locks that provider as Unavailable until Delivered
- [x] Transport status transitions automatically update the corresponding lot status (single source of truth)
- [x] Quality verification is performed by the buyer role, with a before/after (declared vs verified) comparison recorded
- [x] Storage can be booked standalone or attached to an existing lot
- [x] Distance shown for both transport and storage is computed from real coordinates, not static
- [x] Empty states are designed (not blank) for both transport and storage listings
- [x] AI methodology doc explicitly addresses the storage-availability signal timing

---

### Phase 7 — Admin & Grievances (Refined)

**Core principle to hold onto:** Every number on the admin dashboard must trace back to the *same* formula used elsewhere in the app — no parallel "similar" calculations, and no workflow that dead-ends without a defined outcome.

**Key features & specifications:**

- **7.1 Lock Down the Farmer-Benefit Formula:**
  - Reuse the **exact same function** from Phase 2's "Fair Value Story" card (`(accepted_offer − first_available_offer) × quantity`) — the admin dashboard sums calls to this one function, never a separately-written aggregate. One source of truth, one number that survives scrutiny.
- **7.2 Split Verification and Grievances into Separate Queues:**
  - Two distinct admin navigation sections/tabs: **Buyer Verification** and **Grievances** — each with its own triage view.
- **7.3 SLA Breach — Visible and Prioritized:**
  - Any grievance passing the SLA window (48 hours) while still "Open" is visually flagged with a prominent red indicator/border and prioritized at the top of its category group.
- **7.4 Market Data Management — Live Presentation Device:**
  - Inline **edit price** action on any market/crop price row. Mid-presentation, an admin can update modal price and flip to the farmer dashboard to show AI recommendations and expected ranges updating in real time.
- **7.5 Notifications — Documented Polling Mechanism:**
  - Polling refresh (15–30s interval) or refetch-on-navigation. Explicitly recorded as an intentional scoping decision in the documentation, ensuring clean prototype reliability.
- **7.6 Grievance Resolution — Defined Downstream Effect:**
  - Resolution is an **audit/status action only** — updates status to `resolved` or `rejected` with an official resolution note. It does not auto-reverse or mutate the underlying transaction.
- **7.7 Reuse Phase 6 Stepper for Transaction Monitoring:**
  - Transaction timeline uses the **same horizontal stepper component** built in Phase 6 for transport tracking, expanded to the full 8-node transaction lifecycle (`Lot Created → Buyer Matched → Offer Accepted → Quality Verified → Transport Assigned → Picked Up → Delivered → Completed`).

**UI/UX notes:**
- **Admin Dashboard (top-level):** Bento-grid of stat tiles up top, aggregate farmer benefit shown as a prominent count-up metric. 3 focused Recharts visuals: Traded Volume over time (line), Transactions by Status (donut), and Cumulative Farmer Benefit (area).
- **Buyer Verification Queue:** Card-based checklist (Business info ✓ / Location ✓ / Document ✓) with Approve / Request more info / Reject actions.
- **Grievance Triage:** Grouped by category, sorted by age within each group, SLA-breached items pinned to the top with the red flag. Inline expansion for description and resolution notes.
- **Market Data Management:** Clean editable table with inline modal/row price update action.
- **Transaction Monitoring:** List of platform transactions with click-through to the shared stepper timeline matching Phase 6 visual styling.

**Tech stack usage:**
- Backend: FastAPI routers `analytics/`, `grievances/`, `markets/` (price update endpoint). Database tables `grievances`, `notifications`, and aggregate endpoints.
- Frontend: React components in `src/features/admin/` with Recharts and shared `StatusStepper`.

**Deliverables / Checklist:**
- [x] Aggregate farmer benefit on admin dashboard uses the same function as the Phase 2 per-lot card (no separate calculation)
- [x] Buyer verification and grievances are separate, distinct admin workflows
- [x] SLA-breached grievances are visually flagged and prioritized in triage
- [x] Admin can edit a market price and see the AI recommendation update on the farmer dashboard without a page reload
- [x] Notification mechanism (polling) is documented as a deliberate scoping choice
- [x] Grievance resolution updates status/note only — confirmed no unintended transaction side effects
- [x] Transaction monitoring reuses the exact stepper component from Phase 6

---

### Phase 8 — Demo Polish (Final Refined Version)

**Core principle:** Every "is this real?" objection should have a rehearsed, concrete answer — and the live-data layer must never fail visibly, because gaps like the one you just hit are normal, daily occurrences in this dataset.

**Key features & specifications:**

- **8.1 Live Market Price Sync — Built Defensively:**
  - `markets/live_sync.py` pulls Agmarknet data via `data.gov.in` (API key: `579b464db66ec23bdd000001bcebc89646634f0b4936d27da89f411c`, filters: `state=Maharashtra`) and writes into the existing `market_prices` table — AI engine and UI stay completely unchanged.
  - **Crop-name mapping table:** Resolves app display names ("Soybean", "Tur Dal", "Wheat", etc.) to Agmarknet's actual commodity values ("Soyabean", "Arhar (Tur/Red Gram)(Whole)", etc.) before matching.
  - **Stale-fallback rule, non-negotiable:** If a live pull returns zero records for a crop/market on a given day (confirmed real government data behavior), keep the last successfully synced price (or seeded baseline) and mark it `"Live · stale (last updated DD/MM)"` rather than showing blank/zero. A missing arrival on one day never blanks out the dashboard.
  - **Sync pre-demo, cache the result:** Run the sync before the demo, cache the result — never call an un-cached external API live on stage.
  - **Explicit visual labels:** Label clearly as `"Live · Agmarknet · synced HH:MM"` vs `"Live · stale (last updated DD/MM)"` vs `"Demo Data"`.
- **8.2 Demo Mode Security Framing:**
  - Gate "Switch Demo Role" behind `VITE_DEMO_MODE=true`; label it visibly as judging-convenience-only, disabled in production build.
- **8.3 More Crops (Expanded to 10):**
  - Add Sugarcane, Turmeric, Groundnut, Bajra, Grapes to the existing five, all Maharashtra-relevant.
  - Verify each has a matching Agmarknet commodity spelling before assuming live sync coverage.
- **8.4 Multilingual — Deep on 3, Shallow-Showcase on More:**
  - **Deep:** English, Hindi, Marathi (full UI and navigation).
  - **Shallow-showcase:** 1–2 more languages (Telugu, Gujarati) on the landing page only, framed as "architecture supports more; full localization is a stated future enhancement."
- **8.5 Judge-Proof Evidence Checklist:**
  - Deployed live URL · Swagger docs shown briefly · Supabase table view shown briefly · live price-edit → AI-update trick · backtest result mentioned aloud.
- **8.6 Everything from Original Scope:**
  - Full responsive pass (mobile/tablet/desktop) on every screen.
  - Consistent empty/loading/error/success states everywhere.
  - Rich seed data across all 10 crops.
  - **Guided Demo Mode** overlay for the exact end-to-end journey across Farmer, Buyer, FPO, Logistics, and Admin.
  - Performance pass: fast loads, zero uncaught errors.
  - README + AI methodology + `.env.example` + deployment guide.

**Deliverables / Checklist:**
- [x] Sync calls Agmarknet with state=Maharashtra filter, confirmed reliable
- [x] Crop-name mapping table resolves app names to Agmarknet's actual spellings
- [x] Stale-fallback prevents any blank price on a zero-arrival day
- [x] Sync runs pre-demo with cached fallback, no live external call during the pitch
- [x] Demo role switcher is env-gated and visibly labeled
- [x] 10 crops total, live-synced where Agmarknet coverage confirms a match
- [x] EN/HI/MR fully localized; 1–2 extra languages cover landing page only
- [x] Deployed URL, Swagger docs, live-DB view rehearsed as demo evidence beats
- [x] All original Phase 8 items (responsive, states, seed data, Guided Demo Mode, performance, README) complete

- **8.7 Per-Crop AI Recommendations:**
  - **Problem solved:** The farmer dashboard previously showed **one recommendation card hardcoded to Soybean + Latur APMC**, even when the farmer has multiple crops listed. No crop identification, no per-crop differentiation.
  - **New endpoint:** `GET /ai/farmer-recommendations?farmer_id=xxx` fetches ALL active lots for a farmer, groups by crop, finds the best market for each, and runs the full AI pipeline (regression + rule engine) independently per crop.
  - **Auto-sync on load:** The endpoint calls `sync_if_stale(max_age_hours=6)` — if Agmarknet data is older than 6 hours, a fresh live pull (with stale-fallback) is triggered automatically before computing recommendations.
  - **Data lineage:** `Agmarknet → market_prices table → fetch_price_series → predict_price_range (regression) → decide_action (rule engine) → per-crop recommendation card`.
  - **Frontend UI:** Replaced single `PriceRecommendationCard` with `CropRecommendationsPanel` — tabbed interface showing one tab per crop (e.g. 🫘 Tur Dal | 🌱 Soybean | 🌿 Cotton). Each tab shows: crop name/icon, market name, action badge (Sell Now / Wait / Compare Buyers) with gradient styling, price range with crop unit, confidence meter, explanation from real numbers, signal chips, and lot context ("You have 40 quintals listed across 2 lots").
  - **Refresh button:** Manual refresh triggers a force-live sync and reloads all recommendations.
  - **Files added/modified:** `backend/app/api/farmer_recommendations.py` (new), `backend/app/services/live_sync.py` (added `sync_if_stale`), `frontend/src/features/farmer-dashboard/CropRecommendationsPanel.jsx` (new), `frontend/src/features/farmer-dashboard/FarmerDashboard.jsx` (updated to use new component).

---

## 9. Demo Readiness Playbook

### 9.1 Seeding realistic demo data

- Build one `backend/app/seed/` script (idempotent — safe to re-run) that seeds, at minimum: 5 crops, 4–5 markets with realistic Maharashtra district names, **14–30 days** of price/arrival history per crop-market pair (enough for both 7-day and 30-day charts to look meaningful, with a believable trend — not random noise), 4–6 buyers across all verification tiers, transport providers, storage facilities, and a handful of lots/offers/transactions in *different* lifecycle stages (not all "completed") so every status/screen has something to show.
- Include the exact **Ramesh / Soybean / 5 tonnes** scenario from the base prompt as a dedicated, protected seed record — this is your rehearsed path, don't let generic random seeding overwrite or duplicate it.
- Tag every seeded record's origin clearly in code comments and, where user-facing, with the "Demo Data" badge from §5.

### 9.2 Presenting AI recommendations convincingly

- Never say "the AI says X" without also saying the one-line *why* out loud — the explanation chips (§5) exist so you have something concrete to point at.
- State the confidence number and briefly what it's derived from ("82% confidence, based on 14 days of trend and arrival data") — precision reads as credibility.
- Show the buyer-match breakdown, not just the final percentage — judges evaluating "genuine ML vs. hardcoded" will specifically probe this.
- Have one *counter-example* ready (a different crop/market where the recommendation is "SELL NOW" instead of "WAIT") to prove it's not a static hardcoded output.

### 9.3 End-to-end judge walkthrough script

Follow the base prompt's demo journey, narrating the *problem being solved* at each step, not just the click:

1. **Landing page** — 15 seconds on the problem statement and three-stage promise (Discover → Compare → Sell Better).
2. **Farmer login → Dashboard** — point out today's price, the AI recommendation card, and the "why" chips.
3. **Market Intelligence** — show the 3-market comparison (₹4,650 / ₹4,780 / ₹4,850) and the trend chart.
4. **AI Recommendation** — "WAIT 2–3 days," expected range ₹4,850–₹4,980, 82% confidence, reason stated.
5. **Create Lot** — Soybean, 5 tonnes.
6. **Buyer Matching** — Buyer C surfaces at the top with 94% match; show the factor breakdown.
7. **Offer Comparison** — Buyer A ₹4,900 / Buyer B ₹4,820 / Buyer C ₹4,950 — explain why C wins on overall match, not just price.
8. **Accept Offer → Quality Verification → Transport → Delivery** — move quickly here, these are "it works" beats, not "it's smart" beats.
9. **Payment tracking → Transaction history** — show the completed timeline visual.
10. **Zoom out to Admin dashboard** — aggregate farmer benefit, completed transactions, grievance resolution rate — end on the mission-level impact, not a UI screen.

### 9.4 Common pitfalls to avoid

- Don't let a judge land on a genuinely empty state by clicking somewhere off-script — seed broadly enough (§9.1) that *most* paths have something to show.
- Don't demo on a cold-started free-tier backend (Render free tier sleeps) — warm it up minutes before, or note this as a known limitation with a mitigation plan.
- Have a **recorded backup video** of the full walkthrough in case of live network/deploy issues — standard SIH risk mitigation.
- Rehearse the exact click path at least twice; a hesitant click during "Buyer Matching" undercuts the "genuine AI" narrative more than any code issue would.

---

## 10. Master Success Checklist

- [ ] Authentication works for all 4 roles
- [ ] Role-based dashboards and permissions work correctly
- [ ] Farmer dashboard, market prices, and charts all render real seeded data
- [ ] Market comparison and local market map work
- [ ] AI price recommendation is genuine, explainable, and confidence-scored
- [ ] Smart buyer matching produces a transparent, factor-based score
- [ ] Crop lots can be created, discovered, and offered on
- [ ] Farmers can compare and accept offers
- [ ] FPO aggregation demonstrably improves buyer pool / negotiation position
- [ ] Quality grading, transport, and storage workflows all function
- [ ] Payment tracking (state-based, clearly non-financial) works
- [ ] Grievance system works end-to-end with visible SLA/status
- [ ] Admin dashboard shows accurate, chart-driven analytics
- [ ] Notification center reflects real events
- [ ] Full app is responsive, accessible (AA contrast, keyboard nav), and has EN/HI/MR coverage on core screens
- [ ] Frontend (Vercel) and backend (Render) are both deployed against Supabase
- [ ] Complete farmer-to-buyer transaction can be demoed without manual DB edits
- [ ] Guided Demo Mode reliably walks the Ramesh scenario end-to-end
- [ ] README + AI methodology doc are complete enough for a new developer to run the project in 15 minutes

---

## 11. Appendix

### 11.1 API surface (as base prompt, unchanged — confirmed sufficient)

```
/auth/profile
/markets  /market-prices  /market-arrivals
/lots  /lots/{id}
/buyers  /buyers/matches  /buyers/requirements
/offers  /offers/{id}
/logistics  /storage
/transactions  /payments
/grievances  /notifications
/ai/price-recommendation  /ai/buyer-match
```

### 11.2 Environment variables checklist

```
# Frontend (.env)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=

# Backend (.env)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=   # server-side only, never exposed to frontend
DATABASE_URL=
CORS_ALLOWED_ORIGINS=
```

### 11.3 README outline

1. Overview & problem statement (PS 26132)
2. Solution summary + architecture diagram
3. Tech stack
4. Setup: prerequisites, env vars, Supabase project setup, database migration
5. Running frontend / backend locally
6. Seeding demo data (`python -m app.seed.run` or equivalent)
7. API docs (FastAPI's auto-generated `/docs`)
8. Deployment (Vercel / Render / Supabase)
9. Demo credentials (clearly marked as demo-only)
10. AI methodology explained in plain language
11. Known limitations & future enhancements (full multilingual coverage, real payment integration, real logistics dispatch APIs, computer-vision quality grading)

### 11.4 Working style reminder (carried over from the base prompt)

Build phase by phase in Antigravity: inspect current state → explain the phase briefly → implement → show files changed → note setup commands/config needed → check for obvious errors → only then move to the next phase. Prefer complete, placeable files over fragments. Prioritize a smaller, fully-working, polished system over a larger, partially-broken one.

---

## 12. Phase 4 — AI Intelligence (Implemented)

### 12.1 AI Approach — What This System Actually Is

> **This is a hybrid statistical + rule-based system, NOT deep learning.**

This distinction is critical and must never be misrepresented to judges or users.

| Component | What it does | What it does NOT do |
|-----------|-------------|---------------------|
| **Linear Regression** | Predicts expected price range (midpoint ± 1σ residuals) | Decide the action |
| **Decision Table** | Picks SELL NOW / WAIT / COMPARE BUYERS from 3 signals | Predict prices |
| **Weighted Scoring** | Ranks buyers by 6 transparent factors | Learn from feedback |

The system was validated against historical holdout data: 14/25 crop-market pairs achieved ≥60% accuracy in a 5-day holdout backtest. The backtest result is logged to the `ai_recommendations` audit table and surfaced in the UI details toggle.

### 12.2 Price Recommendation Engine

**Signals used:**
1. **Trend slope**: OLS regression on price index → daily change → 7-day % change
2. **Arrival-volume trend**: % change in market arrivals over last 7 days
3. **Demand level**: latest recorded demand level (High / Medium / Low)

**Confidence formula (real, not vibes):**
```
confidence = 90 − volatility_penalty − sparsity_penalty
volatility_penalty = min(25, (std_dev / mean) × 100 × 5)
sparsity_penalty   = max(0, 15 − data_points)
result: clamped [50, 95], rounded to nearest 5%
```

**Actions and their conditions:**
- `SELL NOW` — trend down strongly, OR arrivals spiking + low demand (counter-intuitive case)
- `WAIT` — trend up moderately/strongly with falling arrivals or high demand
- `COMPARE BUYERS` — flat trend or ambiguous signals

**Deliberate disagreement case seeded:** Onion at Nashik APMC — price is trending up +8.6% but arrivals are spiking +361% with Low demand → model correctly outputs SELL NOW. Proves the system is not always saying "WAIT."

### 12.3 Buyer Matching

Weights are configured in `backend/app/ai/weights.py`:

| Factor | Weight | Logic |
|--------|--------|-------|
| Crop Compatibility | 25% | Buyer has open requirement for this crop |
| Quantity Fit | 20% | min(buyer_qty, lot_qty) / max(buyer_qty, lot_qty) |
| Quality Match | 20% | 100/60/20 for 0/1/2 grade levels apart |
| Distance | 15% | Same district=100, neighboring=70, other=40 |
| Price Fit | 10% | buyer_max_price / market_modal_price, clamped 0-100 |
| Reliability | 10% | 60% tier score + 40% rating score |

All weights are surfaced in-app via the "How matching works" drawer — transparent weights beat a black-box number every time.

### 12.4 Files Added in Phase 4

**Backend:**
- `app/ai/__init__.py` — module init
- `app/ai/weights.py` — buyer match weight config (single source of truth)
- `app/ai/data_prep.py` — data fetching + signal computation utilities
- `app/ai/regression.py` — OLS regression, confidence formula, backtest utility
- `app/ai/rule_engine.py` — decision table, signal classifier, explanation generator
- `app/ai/buyer_matching.py` — per-factor buyer scoring
- `app/ai/backtest.py` — 5-day holdout validation script
- `app/api/ai_router.py` — `/ai/price-recommendation` and `/ai/buyer-match` endpoints
- `app/seed/phase4_schema.sql` — `ai_recommendations` audit table
- `app/seed/seed_phase4.py` — disagreement case seed + self-verification

**Frontend:**
- `src/features/farmer-dashboard/PriceRecommendationCard.jsx` — live AI card (progressive disclosure)
- `src/features/farmer-dashboard/BuyerMatchCard.jsx` — factor breakdown with mini bars
- `src/features/farmer-dashboard/HowMatchingWorksDrawer.jsx` — weight transparency drawer

**Setup commands:**
```bash
# 1. Apply DB schema (in Supabase SQL Editor or via psycopg2)
python -c "import psycopg2; conn = psycopg2.connect(DATABASE_URL); cur = conn.cursor(); cur.execute(open('app/seed/phase4_schema.sql').read()); conn.commit()"

# 2. Run backtest BEFORE UI (validates model against historical data)
python -m app.ai.backtest

# 3. Seed disagreement case
python -m app.seed.seed_phase4

# 4. Start backend (now v0.4.0)
uvicorn app.main:app --reload
```

