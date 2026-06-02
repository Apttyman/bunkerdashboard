# Data Architecture

## Goals
1. **Provenance everywhere** — no number reaches the screen without source, timestamp, freshness.
2. **Honest gating** — unavailable/commercial data is labelled, never faked.
3. **Pluggable tiers** — adding a commercial feed requires implementing one interface, no UI churn.
4. **Keys server-side** — adapters run only inside server route handlers.

## The provenance envelope

```ts
type SourceTier = 1 | 2 | 3 | 4;
type Freshness = "live" | "fresh" | "stale" | "old" | "unavailable";

interface Provenance<T> {
  value: T | null;
  unit?: string;
  source: string;        // e.g. "EIA v2 — RWTC"
  sourceTier: SourceTier;
  sourceUrl?: string;
  asOf: string | null;   // ISO — the data's own timestamp
  fetchedAt: string;     // ISO — when we retrieved it
  freshness: Freshness;
  available: boolean;
  reason?: string;       // when unavailable: "Commercial source required" | "API key not configured" | ...
  derived?: boolean;     // true for computed quantities (e.g. spreads)
  inputs?: string[];     // provenance chain for derived values
}
```

The React `<Metric>` primitive accepts only a `Provenance<number>`. There is **no** code path that
renders a raw number. `available === false` ⇒ renders the reason; never a placeholder estimate.

## Layered design

```
┌─────────────────────────────────────────────────────────────┐
│ UI (client components)                                        │
│  Metric · Sparkline · SpreadBar · ProvenanceBadge · Freshness │
│  SourceIntelCard · LearnPanel                                 │
└───────────────▲───────────────────────────────────────────────┘
                │ fetch() JSON (SWR, polling, visible freshness)
┌───────────────┴───────────────────────────────────────────────┐
│ Server route handlers  app/api/*                               │
│  hide keys · cache (revalidate) · normalize · compute spreads  │
└───────────────▲───────────────────────────────────────────────┘
                │ typed adapter calls
┌───────────────┴───────────────────────────────────────────────┐
│ Adapter layer  lib/adapters/*                                  │
│  Tier 1 live  │ Tier 2 cards │ Tier 3 scrape (off) │ Tier 4 stub │
│  each returns Provenance<T>; gates on key/availability         │
└───────────────▲───────────────────────────────────────────────┘
                │
        External sources (EIA, FRED, ECB, OpenWeather, …)
```

## Tiers
- **Tier 1 (live):** real fetches → `Provenance<T>`; missing key ⇒ `available:false`.
- **Tier 2 (cards):** static curated link/intel objects; no proprietary numbers cached.
- **Tier 3 (scrape):** `ScrapeAdapter` interface with `healthCheck()`, retry/backoff, `validateParse()`. Globally disabled via `SCRAPING_ENABLED=false` (default). Each connector documents its robots/ToS gate.
- **Tier 4 (commercial):** `CommercialAdapter<T>` interface. Stubs return `available:false, reason:"Commercial source required"`. Drop in credentials + implement `fetch()` → UI lights up unchanged.

## Derived metrics (refining economics)
Spreads (VLSFO–HSFO, MGO–VLSFO, fuel-oil structure, cracks) are computed in `lib/spreads.ts` from
**real** Tier-1 inputs. Each result is `derived:true` and carries `inputs:[...]` naming every source
series. Where a true marine-bunker assessment is required but only a refinery proxy exists (e.g. EIA
No.6 residual fuel oil as an HSFO directional proxy), the figure is **labelled a proxy** with an
explicit caveat — it is never presented as a Singapore/Rotterdam VLSFO assessment.

## Source health
`lib/adapters/registry.ts` enumerates adapters with `{ id, name, tier, requiresKey, configured, enabled }`.
`/api/health` reports configuration + last-fetch status; the UI renders a source-health panel so the
operator always knows which tiers are live, which need a key, and which are commercial-gated.

## Caching & freshness
Route handlers set `revalidate` per cadence (see API_INVENTORY). Freshness is derived from `asOf`
against series-specific thresholds and rendered as a colour dot + relative age. Publication lag on
daily official series is stated, not hidden.

## Failure semantics
Adapter error ⇒ `available:false, reason:"Source error: …"`, never a thrown blank or a stale silent
value. Network/proxy blocks degrade to the honest unavailable state. The platform is designed so the
*absence* of data is itself accurate information.
