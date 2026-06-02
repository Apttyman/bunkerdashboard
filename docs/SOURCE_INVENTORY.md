# Source Inventory

Classification of every data source by **acquisition tier** and **cost**. This is the honest
ledger that backs the data-governance promise: where a number is commercial, the platform says so.

Legend — Cost: 🟢 Free · 🟡 Freemium (free key, limited) · 🟠 Subscription · 🔴 Enterprise only

## Tier 1 — Live API sources (implemented adapters)

| Source | Cost | Key? | What we get | Used for |
|---|---|---|---|---|
| **EIA** (U.S. Energy Information Admin.) v2 API | 🟢 | free key | WTI/Brent spot, Gulf Coast & NYH No.2 diesel/ULSD, conventional gasoline, **residual fuel oil** spot, refinery utilization, stocks | Crude, refined-product spot, *derived crack/fuel-oil spreads*, refining context |
| **FRED** (St. Louis Fed) | 🟢 | free key | DCOILWTICO, DCOILBRENTEU, Gulf Coast diesel/kerosene, USD indices, rates, freight PPI | Crude, macro overlay, *derived spreads* |
| **Stooq** | 🟢 | none | CSV quotes: CL.F (WTI), CB.F (Brent), NG.F, FX, indices | Crude/macro fallback when no key configured |
| **ECB** Data Portal (SDMX) | 🟢 | none | EUR reference FX rates (EUR/USD etc.) | FX section, bunker-cost currency context |
| **AlphaVantage** | 🟡 | free key | WTI, BRENT, NATURAL_GAS commodity series; FX; equities | Crude/energy fallback, energy-equity context |
| **TwelveData** | 🟡 | free key | Quotes, FX, some commodities/ETFs | Quote fallback |
| **OpenWeather** | 🟡 | free key | Current weather/wind at chokepoint coordinates | Supply-chain weather at Panama/Suez/Hormuz/Red Sea |
| **IMF** Data | 🟢 | none | Primary commodity price indices (monthly) | Long-run macro context (optional) |

## Tier 2 — Public structured sources (intelligence cards, linked — not scraped)

These publish authoritative numbers under licence/ToS. We render **curated, linked intelligence
cards** that explain what to read and why; we do **not** restate or cache their proprietary figures.

| Source | Cost | What it authoritatively provides | Why it's card-only |
|---|---|---|---|
| **Baltic Exchange** | 🟠/🔴 | BDI, BDTI, BCTI, route assessments, TCE | Indices licensed; redistribution restricted |
| **Ship & Bunker** | 🟢 page / 🟠 data | VLSFO/HSFO/MGO at 20 ports (daily) | Free to read; ToS restricts scraping/redistribution |
| **Bunker Index** | 🟢 page | MDO/IFO indices, port prices | ToS restricts redistribution |
| **SGX** | 🟢 page / 🟠 feed | FFA, fuel-oil & freight futures settlements | Settlement data licensed |
| **CME Group** | 🟢 page / 🟠 feed | Brent/WTI, fuel oil, freight futures | Market-data licensing |
| **ICE** | 🟢 page / 🟠 feed | Brent, gasoil, fuel-oil, freight | Market-data licensing |
| **Clarksons** (Shipping Intelligence Network) | 🟠/🔴 | Earnings, newbuild/secondhand, orderbook | Subscription |
| **Braemar** | 🟢 reports | Weekly tanker/dry market commentary | Free reports; not machine feeds |
| **Splash247 / TradeWinds / Lloyd's List** | 🟢/🟠 | Shipping news, disruptions | News, link-out |

## Tier 3 — Controlled scraping (scaffold only, disabled by default)

Adapter interface exists (`lib/adapters/scraping.ts`) with health-check, retry/backoff, and
parser-validation hooks. **No scraper is enabled.** Each potential connector must clear a documented
robots.txt + ToS gate before activation. Default state ships disabled and is surfaced as such in the
source-health panel.

## Tier 4 — Future commercial integrations (typed interface stubs)

| Provider | Cost | Coverage | Stub |
|---|---|---|---|
| **Argus Media** | 🔴 | Bunker, fuel oil, crude, products assessments | `lib/adapters/commercial/argus.ts` |
| **S&P Global Platts** | 🔴 | Bunkerwire, MOC assessments, cracks | `lib/adapters/commercial/platts.ts` |
| **Clarksons Intelligence** | 🔴 | Earnings, fixtures, fleet, orderbook | `lib/adapters/commercial/clarksons.ts` |
| **Kpler** | 🔴 | Flows, floating storage, port calls | `lib/adapters/commercial/kpler.ts` |
| **Vortexa** | 🔴 | Cargo flows, freight, floating storage | `lib/adapters/commercial/vortexa.ts` |
| **Signal Ocean** | 🔴 | TCE, routes, positions, congestion | `lib/adapters/commercial/signalocean.ts` |
| **Baltic Exchange** (sub) | 🟠 | BDI/BDTI/BCTI, route TCE | `lib/adapters/commercial/baltic.ts` |
| **MarineTraffic** (enterprise) | 🔴 | AIS positions, ETAs, port congestion | `lib/adapters/commercial/marinetraffic.ts` |

## Honest coverage summary

| Domain | Live & free? | How it's handled |
|---|---|---|
| Crude (WTI/Brent) | ✅ Yes | EIA / FRED / Stooq / AlphaVantage |
| Refined products (diesel, gasoil, residual fuel oil, gasoline) | ✅ Yes | EIA spot series |
| Refining spreads (cracks, fuel-oil) | ✅ *Derived* | Computed from EIA/FRED inputs, labelled as derived |
| FX / macro | ✅ Yes | ECB / FRED |
| Chokepoint weather | ✅ Yes | OpenWeather |
| **Bunker absolute prices** (VLSFO/HSFO/MGO by port) | ❌ Commercial | Ship & Bunker card + clearly-labelled EIA residual-fuel proxy where relevant |
| **Freight rates / Worldscale / TCE** | ❌ Commercial | Baltic / Clarksons intelligence cards |
| **FFA / freight derivatives** | ❌ Commercial | SGX / CME / ICE cards + explainers |
| **AIS / congestion / flows** | ❌ Commercial/enterprise | Tier-4 stubs + qualitative supply-chain cards |
