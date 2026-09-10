# 🌾 Farm2Fair — Improvement Plan v3
### Working-Model Depth: Security, Connectivity, PS-Alignment & Market Intel

Amendment to the Master Plan + v2. Sequenced in **priority tiers** — build top to bottom. Tier 1 items are correctness/security gaps that matter regardless of demo vs. working-model framing; later tiers are depth and polish.

---

## Tier 0 — Priority Overview

| Tier | Focus | Why first/last |
|---|---|---|
| 1 | Security & structural integrity | Admin exposure and disconnected flows are the fastest way to lose credibility on inspection |
| 2 | Problem-statement alignment gaps | Named outcomes/phrases in the official PS your current plan doesn't yet answer |
| 3 | Market Intelligence depth | National coverage, map, and chart quality — high visual/judging payoff |
| 4 | Polish | Dark mode — real, but lowest urgency of everything here |

---

## Tier 1 — Fix First: Security & Structural Integrity

### 1.1 Remove Admin from public signup

**Problem:** if role selection at signup includes "Admin" as a pickable option, anyone can self-provision admin access — a genuine security hole, not a demo shortcut.

**Fix:**
- Remove `admin` from the public role-selection UI entirely — only `farmer`, `buyer`, `fpo` remain selectable at signup.
- Backend: reject any signup request where `role == 'admin'` regardless of what the client sends — validate server-side, never trust the client's role claim.
- Provision the 1–2 admin accounts you actually need via a one-time seed script or direct Supabase dashboard insert:

```python
# backend/app/seed/create_admin.py
# Run once, manually, never exposed via API
def create_admin_account(email: str, name: str):
    profile = Profile(email=email, name=name, role="admin")
    db.add(profile)
    db.commit()
```

- Optional (if you want a dynamic path later): an **invite-code-gated** admin signup — a code only you know, checked server-side before allowing `role=admin`. Not required for the prototype; manual provisioning is simpler and safer.

**Checklist:**
- [ ] `admin` removed from public role dropdown
- [ ] Backend rejects client-supplied `role=admin` on signup regardless of UI
- [ ] Admin account(s) provisioned via seed script, not the signup form

---

### 1.2 FPO Join Workflow (farmer-initiated, not hardcoded)

**Problem:** FPO membership is currently admin/FPO-manager-added only — no path for a farmer to discover and join one themselves.

**Fix — reuse the buyer-verification pattern (search → request → approve queue):**

**New table:**
```sql
CREATE TYPE fpo_request_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE fpo_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fpo_id UUID REFERENCES fpos(id),
  farmer_id UUID REFERENCES farmers(id),
  status fpo_request_status DEFAULT 'pending',
  message TEXT,
  requested_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  UNIQUE(fpo_id, farmer_id)
);
```

**Flow:**
1. Farmer browses/searches nearby FPOs (`GET /fpo/discover?district=...`) — card list, same visual pattern as buyer discovery.
2. Farmer taps **"Request to Join"** → creates a `pending` `fpo_join_requests` row, optional short message field.
3. FPO manager sees a **request queue** (identical card + Approve/Reject pattern already built for buyer verification — reuse the component, don't rebuild it) — on approve, insert into `fpo_members`.
4. Farmer gets a notification either way (reuses the notification system from Phase 7).

**UI:**
- `features/fpo/DiscoverFpos.jsx` — card list with "Request to Join" button
- `features/fpo/JoinRequestQueue.jsx` — reuse `VerificationQueueCard` component with different data source

**Checklist:**
- [ ] Farmer can search/browse FPOs and send a join request
- [ ] FPO manager sees a request queue and can approve/reject
- [ ] Approval creates a real `fpo_members` row; rejection is recorded with a reason
- [ ] Notification fires to the farmer on resolution

---

### 1.3 End-to-End Connectivity Audit

**Problem:** four dashboards that each individually work isn't the same thing as one connected system — the seams between roles are exactly where live demos break.

**Fix — manually test these full loops end to end, not screen by screen:**

1. Farmer creates lot → appears in buyer discovery → buyer submits offer → farmer sees & accepts → admin sees it in transaction monitoring → **notification fires to both farmer and buyer**.
2. Farmer requests to join FPO → FPO manager approves → farmer's lot now eligible for aggregation → aggregated lot flows through matching like an individual lot.
3. Buyer signs up → appears in admin verification queue → admin approves → buyer's tier badge updates everywhere it's shown (marketplace, offer cards, admin list) without a stale cache.
4. Farmer files grievance → appears in admin triage → admin resolves → farmer sees resolved status + can rate satisfaction.

**Checklist:**
- [ ] All 4 loops above tested manually, start to finish, on the actual deployed environment (not just localhost)
- [ ] Notifications confirmed firing on both sides of every cross-role action
- [ ] No stale-data cases found (e.g., a badge/status that updates in one view but not another)

---

## Tier 2 — Problem-Statement Alignment Gaps

### 2.1 Buyer Type Categorization

**Why:** the PS explicitly names four distinct channels — *"nearby markets, processors, institutional buyers and digital trading channels"* — an undifferentiated "Buyer" role doesn't represent that.

```sql
ALTER TABLE buyers ADD COLUMN buyer_type TEXT
  CHECK (buyer_type IN ('processor', 'institutional', 'trader', 'digital_channel', 'local_mandi'));
```

- Buyer selects type at signup (alongside verification flow, no extra step needed).
- Show as a small tag on every buyer card, next to the verification tier badge.
- Add as a filter option in buyer discovery/offer comparison.

**Checklist:**
- [ ] `buyer_type` captured at signup
- [ ] Visible as a tag on buyer cards everywhere they appear
- [ ] Filterable in relevant discovery/comparison views

---

### 2.2 Partial Advance Payment Terms

**Why:** the PS names liquidity constraints as a root cause of farmers selling too early. You can't build real lending, but you can let buyers engage with the problem directly.

```sql
ALTER TABLE buyer_offers ADD COLUMN advance_percentage INTEGER DEFAULT 0;
ALTER TABLE buyer_offers ADD COLUMN advance_terms TEXT;
```

- Optional field on the offer-submission form: *"Advance payment offered: __% on acceptance"*.
- Show prominently on offer comparison cards — this becomes a real differentiator between offers (a farmer facing liquidity pressure may prefer a slightly lower price with a larger advance).

**Checklist:**
- [ ] Buyers can optionally specify advance payment terms on an offer
- [ ] Advance terms are visible on the farmer's offer-comparison view, clearly labeled

---

### 2.3 Farmer-Facing Transparent Transaction Records

**Why:** "transparent transaction records" is a named PS outcome — confirm it's farmer-facing, not just visible to admin.

- Add/confirm `features/farmer-dashboard/TransactionHistory.jsx` — full list of the farmer's own past transactions, each expandable to the same stepper timeline component used elsewhere (Phase 6/7 reuse).

**Checklist:**
- [ ] Farmer has a dedicated transaction history view, not just "My Lots"
- [ ] Each transaction expands to the shared timeline stepper

---

## Tier 3 — Market Intelligence Depth

### 3.1 Whole-India Coverage (State → District Selector)

Your Agmarknet source already covers all states — you're just hard-filtering to Maharashtra. Nearly free to widen.

```jsx
// features/market-intel/StateDistrictSelector.jsx
<Select value={state} onChange={setState} options={INDIAN_STATES} placeholder="Select State" />
<Select value={district} onChange={setDistrict} options={districtsFor(state)} placeholder="Select District" />
```

- Default view: Maharashtra (keeps you PS-aligned by default).
- Selector lets a user browse any state — demonstrates national scalability without extra backend work, since the sync already pulls broader data.
- Maintain a static `INDIAN_STATES` + `districtsFor(state)` lookup (a lightweight JSON list is enough — no need for a live geography API).

**Checklist:**
- [ ] State/district selector added to market intelligence
- [ ] Defaults to Maharashtra, but full national data is browsable
- [ ] District list keyed off a static lookup, not hardcoded per-screen

---

### 3.2 Map Improvements

- **Filter controls directly on the map panel:** crop, price range, distance radius — not just a static pin dump.
- **Marker clustering** when zoomed out (use `react-leaflet-cluster` or `leaflet.markercluster`) — prevents a chaotic wall of pins once national data is in play (from 3.1).
- **Color-code pins by price tier** relative to the selected crop's average (green = better price nearby, amber = average, red = below average) — makes the map itself carry information instead of just showing location.

```jsx
// features/market-intel/MarketMap.jsx
import MarkerClusterGroup from 'react-leaflet-cluster';

<MarkerClusterGroup>
  {markets.map(m => (
    <CircleMarker key={m.id} center={[m.lat, m.lng]} pathOptions={{ color: priceTierColor(m.modalPrice, avgPrice) }} />
  ))}
</MarkerClusterGroup>
```

**Checklist:**
- [ ] Map has inline filter controls (crop, price, radius)
- [ ] Marker clustering active for dense/national views
- [ ] Pins color-coded by relative price tier

---

### 3.3 Recharts Visual Overhaul

Default Recharts styling is genuinely flat — concrete fixes, not vague polish:

**Gradient fill + custom tooltip:**
```jsx
<AreaChart data={priceHistory}>
  <defs>
    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#1B5E3C" stopOpacity={0.3} />
      <stop offset="100%" stopColor="#1B5E3C" stopOpacity={0} />
    </linearGradient>
  </defs>
  <Area type="monotone" dataKey="modalPrice" stroke="#1B5E3C" fill="url(#priceGradient)" strokeWidth={2} />
  <Tooltip content={<CustomTooltip />} />
  <ReferenceLine y={aiRecommendedRange.min} stroke="#F5A623" strokeDasharray="4 4" label="AI range" />
  <XAxis tickFormatter={(d) => formatDate(d)} />
  <YAxis tickFormatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
</AreaChart>
```

```jsx
// components/ui/CustomTooltip.jsx — replaces Recharts' plain default
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white shadow-md rounded-lg px-3 py-2 border border-slate-200">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-800">₹{payload[0].value.toLocaleString('en-IN')}</p>
    </div>
  );
};
```

- Highlight the most recent data point with a larger, accent-colored dot (`dot={{ r: props.index === data.length - 1 ? 6 : 3 }}`) — gives the chart a clear "you are here."
- Reference line for the AI-recommended price band overlaid directly on the trend chart — ties the chart to the recommendation instead of leaving them as two disconnected UI elements.

**Checklist:**
- [ ] Custom tooltip replaces Recharts' default styling
- [ ] Gradient fill applied to trend area charts
- [ ] AI-recommended range shown as a reference line on the same chart
- [ ] Latest data point visually highlighted
- [ ] Axis labels formatted with ₹ and Indian number grouping

---

## Tier 4 — Polish

### 4.1 Dark Mode

Lower priority than everything above — real, but budget it last.

```jsx
// context/ThemeProvider.jsx
const ThemeContext = createContext();
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);
  return <ThemeContext.Provider value={{ theme, toggle: () => setTheme(t => t === 'light' ? 'dark' : 'light') }}>{children}</ThemeContext.Provider>;
};
```

- Tailwind `dark:` class strategy (`darkMode: 'class'` in `tailwind.config.js`).
- Toggle placed in the top bar next to the language switcher.
- Test every card/chip/badge color combination in dark mode specifically — this is where most half-finished dark modes fall apart (a color token that works on white but disappears on near-black).

**Checklist:**
- [ ] Toggle persists preference in `localStorage`
- [ ] All existing color tokens have a verified dark-mode counterpart, not just inverted backgrounds
- [ ] Charts/maps specifically checked in dark mode (these are the easiest to forget)

---

## Master Build Order (all tiers combined)

1. Remove Admin from public signup + server-side role validation (1.1)
2. FPO join-request data model + endpoints (1.2)
3. FPO discovery UI + request queue (reusing verification card pattern) (1.2)
4. Manual end-to-end connectivity audit across all 4 loops (1.3)
5. `buyer_type` field + UI tag + filter (2.1)
6. Advance payment fields on offers + comparison display (2.2)
7. Farmer-facing transaction history view (2.3)
8. State/district selector for market intelligence (3.1)
9. Map filter controls + clustering + price-tier coloring (3.2)
10. Recharts custom tooltip, gradient, reference line, axis formatting (3.3)
11. Dark mode provider + toggle + full color-token audit (4.1)

---

## Updated Master Checklist Additions

- [ ] Admin role cannot be self-provisioned through public signup
- [ ] Farmers can discover and request to join an FPO; FPO managers approve/reject
- [ ] All 4 critical cross-role loops tested end-to-end on the deployed environment
- [ ] Buyer type (processor/institutional/trader/digital channel/local mandi) captured and shown
- [ ] Advance payment terms available as an offer field
- [ ] Farmer has a dedicated, full transaction history view
- [ ] Market intelligence covers all of India with Maharashtra as default
- [ ] Map has filters, clustering, and price-tier color coding
- [ ] Trend charts use custom tooltips, gradient fill, and an AI-range reference line
- [ ] Dark mode works correctly across every screen, including charts and maps
