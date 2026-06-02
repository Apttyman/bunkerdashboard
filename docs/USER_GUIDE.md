# User Guide — Bunker Desk

A 15-minute morning routine for a finance professional with no shipping background.

## Quick start

```bash
npm install
cp .env.example .env.local   # add any keys you have (all optional)
npm run dev                  # http://localhost:3000
# production:
npm run build && npm start
```

Every key is optional. With **no keys at all**, keyless sources (Stooq, ECB) stay
live and everything else shows an honest "API key not configured" / "Commercial
source required" state — never a fabricated number. Add keys to light up more.

### Recommended free keys (5 minutes, high payoff)
- **EIA** — crude + refined-product spot + the derived cracks. https://www.eia.gov/opendata/register.php
- **FRED** — crude/macro fallback + USD index. https://fred.stlouisfed.org/docs/api/api_key.html
- **OpenWeather** — chokepoint weather. https://openweathermap.org/api

## Reading the screen

- **Freshness dot** — green = live/fresh, amber = stale, grey = unavailable. Hover for the exact state.
- **`T1`–`T4` chip** — the data tier (1 live API · 2 public · 3 scrape · 4 commercial).
- **Source link + age** — every metric shows where it came from and how old it is.
- **`derived`** — a computed figure (e.g. a crack); hover/read `inputs:` for its provenance chain.
- **"Data unavailable" / "Commercial source required"** — honest gaps, not errors.

## The 15-minute routine

1. **Morning Brief (BRIEF)** — read "Why this matters today", scan crude + the desk summary. ~4 min.
2. **Refining Economics (REFIN)** — check Brent–WTI and the diesel/gasoline cracks; these set the tone for distillate (MGO) and fuel-oil direction. ~3 min.
3. **Marine Fuel Markets (FUELS)** — note the live distillate proxies; open a bunker source card if you need today's absolute VLSFO. ~2 min.
4. **Supply Chain (SUPPLY)** — scan Suez/Red Sea/Hormuz/Panama implications + weather. ~3 min.
5. **Freight (FRGHT) / Derivatives (DERIV)** — glance at segment health and hedge venues. ~2 min.
6. **Learning Mode (LEARN)** — when a term is unfamiliar, read its What/Why/How. Anytime.

## Top bar telemetry
- UTC clock · live Tier-1 source count · commercial feeds configured · **Audit trail** (Supabase snapshot count, "schema pending", or "disabled").

## Honest-data philosophy
This platform values accuracy over completeness. If a number isn't here, it's
because it's commercial or unavailable — and it says so. Use the source cards to
go straight to the authoritative provider.
