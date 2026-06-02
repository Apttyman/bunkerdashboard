# Bunker Desk

**Institutional-grade marine fuels & tanker-market intelligence.**
Bloomberg Terminal × Palantir Foundry × a commodity trading desk — built for the
developing bunker fuel trader who opens one dashboard every morning.

> **Provenance-first.** Every metric carries source · timestamp · freshness · tier.
> Commercial or unavailable data is labelled — **never fabricated**.

## What it covers
Morning Brief · Marine Fuel Markets · Freight Markets · Refining Economics ·
Supply Chain & Chokepoints · Derivatives & Hedging · Watchlist (saved symbols +
notes, Supabase-backed) · Learning Mode (14 concepts, each What / Why / How).

## Stack
Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4 · SWR · Supabase
(provenance audit trail). Server route handlers proxy external APIs so keys never
reach the browser.

## Quick start
```bash
npm install
cp .env.example .env.local   # add any keys you have — all optional
npm run dev                  # http://localhost:3000
```
With no keys, keyless sources (Stooq, ECB) stay live and everything else shows an
honest unavailable state. See **docs/USER_GUIDE.md**.

## Four-tier data architecture
1. **Live API** — EIA, FRED, Stooq, ECB, AlphaVantage, OpenWeather.
2. **Public structured** — Baltic, Ship & Bunker, SGX, CME, ICE, Clarksons… (intelligence cards, link-out).
3. **Controlled scraping** — isolated scaffold, **disabled by default**, each connector documents its legal gate.
4. **Commercial** — Argus, Platts, Clarksons, Kpler, Vortexa, Signal Ocean, Baltic, MarineTraffic — typed stubs; implement one interface to light up the UI.

## Supabase (provenance audit trail)
Persists every provenance-stamped metric as an append-only record.
1. Set `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.example`).
2. Run `supabase/migrations/0001_metric_snapshots.sql` in the Supabase SQL editor.
3. The top-bar "Audit trail" indicator shows the live snapshot count.

## Documentation
- `docs/IMPLEMENTATION_PLAN.md` — architecture & repo assessment
- `docs/DATA_ARCHITECTURE.md` — provenance contract & layering
- `docs/SOURCE_INVENTORY.md` — every source by tier & cost
- `docs/API_INVENTORY.md` — endpoint-level API reference
- `docs/USER_GUIDE.md` — the 15-minute morning routine
- `docs/COMMERCIAL_INTEGRATION.md` — connecting paid feeds
- `docs/DEPLOYMENT.md` — deploy to Vercel + custom domain runbook
- `docs/VALIDATION_REPORT.md` — build, smoke test & governance conformance

## Deploy
Vercel (zero-config Next.js). Import the repo, set env vars, add your domain — see
`docs/DEPLOYMENT.md`. Live at `bunkerdashboard.cuscoventurescorp.org`.

## Data integrity
Accuracy over completeness. No fabricated freight rates, bunker prices, crack
spreads, tanker earnings, congestion stats, or derivatives prices — ever.
