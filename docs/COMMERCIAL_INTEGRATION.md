# Future Commercial-Data Integration Guide

The platform is built so that connecting a paid feed requires **implementing one
interface** — no UI changes. The UI already consumes `Provenance<T>` everywhere
and renders "Commercial source required" until a real value arrives.

## The contract

`lib/adapters/types.ts`:

```ts
interface CommercialAdapter<T = number> {
  id: string; name: string; tier: 4; vendor: string; envKey: string;
  configured(): boolean;
  fetch(symbol: string): Promise<Provenance<T>>;
}
```

Stubs live in `lib/adapters/commercial/index.ts` for Argus, Platts, Clarksons,
Kpler, Vortexa, Signal Ocean, Baltic, and MarineTraffic. Each returns an honest
`unavailable()` envelope until implemented.

## Steps to integrate a provider (example: Argus bunker assessments)

1. **License & credentials** — obtain API access; put the key in `ARGUS_API_KEY`.
2. **Implement `fetch()`** — replace the stub body:
   ```ts
   async fetch(symbol: string): Promise<Provenance<number>> {
     if (!this.configured()) return unavailable({ source: `Argus — ${symbol}`, sourceTier: 4, reason: "Commercial source required", sourceUrl: "https://www.argusmedia.com/" });
     const raw = await fetchJson(argusUrl(symbol), { headers: { Authorization: `Bearer ${process.env.ARGUS_API_KEY}` } });
     return ok({ value: raw.price, unit: "$/mt", source: `Argus — ${raw.code}`, sourceTier: 4, asOf: raw.assessmentDate, cadence: "dailySpot", sourceUrl: "https://www.argusmedia.com/" });
   }
   ```
3. **Map symbology** — translate platform symbols (e.g. `VLSFO_SINGAPORE`) to the vendor's codes.
4. **Wire into a route** — in `app/api/markets/route.ts` (or a new route), call the adapter where the value is currently gated (e.g. `vlsfoHsfo`, the port × product matrix, freight WS/TCE cells).
5. **Done** — the UI lights up automatically; the metric now shows a real value with a `T4` provenance badge.

## Where each provider plugs in

| Provider | Lights up |
|---|---|
| Argus / Platts | Bunker port × product matrix (FUELS), VLSFO–HSFO & MGO–VLSFO spreads (REFIN), Morning Brief bunker line |
| Baltic / Clarksons / Signal Ocean | Freight WS/TCE cells (FRGHT), segment earnings |
| Kpler / Vortexa | Supply Chain flows, floating storage, port-call analytics |
| MarineTraffic | Supply Chain AIS positions, congestion, ETAs |

## Production hardening
- Move secrets to a server-only secret manager; keep them out of `NEXT_PUBLIC_*`.
- Respect each vendor's caching/redistribution terms; set `revalidate` accordingly.
- Keep the provenance envelope honest: on auth/rate-limit failure, return `unavailable()` with the reason — never a stale silent value.

## Tier 3 (controlled scraping)
`lib/adapters/scraping.ts` defines `ScrapeAdapter` with `healthCheck()`,
retry/backoff and `validateParse()`. It is globally disabled (`SCRAPING_ENABLED=false`).
Before enabling any connector, clear its documented `legalGate` (robots.txt + ToS).
Prefer the licensed Tier-4 feed over scraping wherever one exists.
