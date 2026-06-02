# API Inventory

Endpoint-level reference for every Tier-1 live adapter. All keys are read **server-side only**
(route handlers in `app/api/*`); none are exposed to the browser.

---

## EIA v2 — `lib/adapters/eia.ts`
- **Base:** `https://api.eia.gov/v2/`
- **Auth:** `?api_key=EIA_API_KEY` (free, instant: https://www.eia.gov/opendata/register.php)
- **Key series (petroleum spot, daily):**
  - WTI Cushing: `petroleum/pri/spt/data/?...&facets[series][]=RWTC`
  - Brent Europe: `...&facets[series][]=RBRTE`
  - No.2 Diesel Gulf Coast: `EER_EPD2D_PF4_RGC_DPG`
  - ULSD NY Harbor: `EER_EPD2DXL0_PF4_Y35NY_DPG`
  - Conventional gasoline Gulf Coast: `EER_EPMRR_PF4_RGC_DPG`
  - **No.6 Residual Fuel Oil** (HSFO proxy, clearly labelled): `petroleum/pri/rac2/` family / residual series
- **Refining:** weekly refinery utilization `petroleum/pnp/wiup/`, stocks `petroleum/stoc/`.
- **Limits:** generous; daily series, ~5,000 rows/request. Cache 30–60 min.

## FRED — `lib/adapters/fred.ts`
- **Base:** `https://api.stlouisfed.org/fred/series/observations`
- **Auth:** `?api_key=FRED_API_KEY&file_type=json` (free: https://fred.stlouisfed.org/docs/api/api_key.html)
- **Series:** `DCOILWTICO` (WTI), `DCOILBRENTEU` (Brent), `DDFUELUSGULF`/Gulf Coast diesel, `DTWEXBGS` (USD broad index), `DGS10` (10y), `WPU057303` (freight PPI), kerosene-type jet.
- **Limits:** 120 req/min. Cache 30 min.

## Stooq — `lib/adapters/stooq.ts`
- **Base:** `https://stooq.com/q/l/?s=<sym>&f=sd2t2ohlcv&h&e=csv`
- **Auth:** none. **Symbols:** `cl.f` WTI, `cb.f` Brent, `ng.f` NatGas, `eurusd`, indices.
- **Use:** keyless fallback for crude/macro when no API keys configured. Cache 15 min.

## ECB Data Portal (SDMX) — `lib/adapters/ecb.ts`
- **Base:** `https://data-api.ecb.europa.eu/service/data/EXR/D.<CCY>.EUR.SP00.A?lastNObservations=1&format=jsondata`
- **Auth:** none. **Use:** EUR/USD and other EUR reference rates. Cache 6 h (daily fix ~16:00 CET).

## AlphaVantage — `lib/adapters/alphavantage.ts`
- **Base:** `https://www.alphavantage.co/query`
- **Auth:** `&apikey=ALPHAVANTAGE_API_KEY` (free: https://www.alphavantage.co/support/#api-key)
- **Functions:** `WTI`, `BRENT`, `NATURAL_GAS` (commodities); `CURRENCY_EXCHANGE_RATE`; `GLOBAL_QUOTE`.
- **Limits:** free tier ~25 req/day, 5/min. Treat as low-frequency fallback. Cache aggressively (≥6 h).

## TwelveData — `lib/adapters/twelvedata.ts`
- **Base:** `https://api.twelvedata.com/`
- **Auth:** `&apikey=TWELVEDATA_API_KEY` (free: https://twelvedata.com/pricing)
- **Endpoints:** `/price`, `/quote`, `/time_series`. **Limits:** free ~800 req/day, 8/min. Cache.

## OpenWeather — `lib/adapters/openweather.ts`
- **Base:** `https://api.openweathermap.org/data/2.5/weather?lat=<>&lon=<>&units=metric`
- **Auth:** `&appid=OPENWEATHER_API_KEY` (free: https://openweathermap.org/api)
- **Use:** current conditions/wind at chokepoint coordinates (Panama 9.08,-79.68; Suez 30.5,32.35; Bab-el-Mandeb 12.6,43.4; Hormuz 26.6,56.4; Singapore 1.26,103.8; Fujairah 25.1,56.3).
- **Limits:** free 60 req/min, 1M/mo. Cache 30 min.

## IMF (optional) — `lib/adapters/imf.ts`
- **Base:** `https://www.imf.org/external/datamapper/api/v1/` (Primary Commodity Prices). Monthly. Keyless.

---

## Caching & freshness policy

| Series cadence | `revalidate` | Freshness thresholds (fresh / stale / old) |
|---|---|---|
| Intraday quotes | 5–15 min | < 30 min / < 6 h / older |
| Daily spot (EIA/FRED) | 30–60 min | < 36 h / < 1 wk / older |
| Daily FX (ECB) | 6 h | < 36 h / < 1 wk / older |
| Weather | 30 min | < 1 h / < 6 h / older |
| Low-rate (AlphaVantage) | 6 h | by series cadence |

Freshness is computed from `asOf` (the data's own timestamp), not merely `fetchedAt`, and is rendered
as a colour dot + relative age on every metric. EIA/FRED daily spots are reported with a multi-day
publication lag — the UI states the lag rather than pretending the figure is live.

## Auth & secret handling
All keys are environment variables, read only inside `app/api/*` server route handlers. Adapters that
find no key return `{ available: false, reason: "API key not configured" }` — the UI then renders the
honest unavailable state, never a fabricated value.
