# Bunker Desk — Implementation Plan

> Institutional-grade marine fuels & tanker-market intelligence platform.
> Bloomberg Terminal × Palantir Foundry × commodity trading desk.

## 0. Repository assessment (completed before implementation)

| Question | Finding |
|---|---|
| Framework | **None — greenfield.** Empty git repo, no commits. Free choice of stack. |
| Package manager | npm 10.9.7 available (also yarn/pnpm/bun). **npm** chosen for ubiquity. |
| Runtime | Node v22.22.2. |
| Routing / UI | None present. **Next.js 15 App Router** chosen. |
| Deployment model | Not pre-defined. Target: **Vercel / any Node host**. Server route handlers proxy external APIs so keys never reach the browser. |
| Build-container network | npm registry reachable. Direct egress to data APIs is blocked by the sandbox network policy (HTTP 403). This is irrelevant to the running app — API calls execute at **runtime in the deploy environment**, not in this build container. |

## 1. Chosen architecture

- **Next.js 15 (App Router) + React 19 + TypeScript** — server route handlers act as the data-acquisition / key-hiding / caching tier; client components render.
- **Tailwind CSS v4** — dense, dark, institutional theme. No marketing aesthetics.
- **SWR** — client-side polling with stale-while-revalidate + visible freshness.
- **Hand-rolled SVG charts** (sparklines, spread bars) — zero heavy chart dependencies, full styling control, fast.

### Data flow

```
External source ──▶ Adapter (lib/adapters/*) ──▶ Provenance<T> envelope
                         │                              │
                  Tier classification            { value, source, sourceTier,
                  + availability gate              fetchedAt, asOf, freshness,
                         │                          url, available, reason }
                         ▼                              │
            app/api/* route handler (server) ◀──────────┘
                         │  (caches, hides keys, sets revalidate)
                         ▼
            Client component  ──▶  always renders ProvenanceBadge + FreshnessDot
                                   never renders a number without provenance
```

### The provenance contract (data-governance core)

Every metric is an `Provenance<T>` envelope. The UI **cannot** render a bare number — the
`<Metric>` primitive requires the envelope and always paints source + timestamp + freshness.
When `available === false` the UI shows **"Data unavailable"** or **"Commercial source required"**
plus the reason. No estimate is ever silently substituted for a real series. Where we derive a
quantity (e.g. a crack spread) we label it explicitly with its real inputs and call it a
*derived* figure with its own provenance chain.

## 2. Four-tier data architecture

- **Tier 1 — Live API (implemented):** EIA, FRED, Stooq, ECB, AlphaVantage, TwelveData, OpenWeather. Drive crude, refined-product spot prices, FX, macro, weather at chokepoints, and *derived* refining spreads.
- **Tier 2 — Public structured (source-intelligence cards):** Baltic Exchange, Ship & Bunker, Bunker Index, SGX, CME, ICE, Clarksons, Braemar, Splash247. Rendered as curated, linked intelligence cards — we do **not** scrape or restate licensed numbers.
- **Tier 3 — Controlled scraping (adapter scaffold, disabled by default):** Isolated adapter interface with health/retry/parser-validation hooks. Ships **off**; each connector documents the ToS/robots gate that must be cleared before enabling.
- **Tier 4 — Commercial integrations (interface stubs):** Typed adapter interfaces for Argus, Platts, Kpler, Vortexa, Signal Ocean, Clarksons Intelligence, Baltic subscription, MarineTraffic enterprise. Implement the interface → the UI lights up with zero component changes.

## 3. Dashboard sections (build order)

1. **Morning Brief** — auto-assembled crude / bunker / freight / disruption / news summary + "Why this matters today".
2. **Marine Fuel Markets** — Singapore, Rotterdam, Fujairah, Houston, Panama, Gibraltar, Zhoushan × VLSFO/HSFO/MGO. Honest gating: absolute bunker prices are commercial → cards + EIA *proxies clearly labelled as proxies*.
3. **Freight Markets** — VLCC/Suezmax/Aframax/LR2/LR1/MR. Routes, Worldscale, TCE → source-intelligence cards (commercial).
4. **Refining Economics** — VLSFO–HSFO, MGO–VLSFO, fuel-oil structure, crude relationships, margin context. *Derived from real EIA/FRED inputs, fully labelled.*
5. **Supply Chain** — Panama, Suez, Red Sea, Hormuz + weather + port disruptions, with operational implications.
6. **Derivatives** — FFA / freight futures / bunker-hedge resources, SGX/CME/ICE links, explainers.
7. **Learning Mode** — What is it? / Why does it matter? / How does a trader use it? across 14 topics.

## 4. Deliverables mapping

| # | Deliverable | Location |
|---|---|---|
| 1 | Dashboard implementation | `app/`, `components/`, `lib/` |
| 2 | Data architecture document | `docs/DATA_ARCHITECTURE.md` |
| 3 | Source inventory | `docs/SOURCE_INVENTORY.md` |
| 4 | API inventory | `docs/API_INVENTORY.md` |
| 5 | Env-variable template | `.env.example` |
| 6 | User guide | `docs/USER_GUIDE.md` |
| 7 | Commercial-data integration guide | `docs/COMMERCIAL_INTEGRATION.md` |
| 8 | Validation report | `docs/VALIDATION_REPORT.md` |

## 5. Non-negotiables

- Accuracy over completeness. Empty-but-honest beats full-but-fabricated.
- Every number carries provenance + freshness.
- Commercial/unavailable data is labelled, never faked.
- Keys live server-side only.
