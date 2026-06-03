// Resolvers — for a given quantity, try sources in priority order and return the
// first available provenance-wrapped value. LIVE sources come first: a trading
// desk needs real-time (or ≤15-min) prices, so keyless Stooq front-month futures
// take priority over EIA/FRED official *spot*, which publishes with a ~1-week lag.
// If none are configured, return an honest unavailable envelope (never fabricated).
import type { Provenance, ProvenanceSeries } from "@/lib/provenance";
import { unavailable } from "@/lib/provenance";
import { eia } from "./eia";
import { fred } from "./fred";
import { stooq } from "./stooq";
import { alphavantage } from "./alphavantage";

type LatestFn = (symbol: string) => Promise<Provenance<number>>;
interface Candidate { id: string; configured: () => boolean; latest: LatestFn; }

// Live first (Stooq intraday futures), then official spot as a backstop.
const CRUDE_CHAIN: Candidate[] = [stooq, eia, fred, alphavantage];

export async function resolveCrude(symbol: "WTI" | "BRENT"): Promise<Provenance<number>> {
  let firstAvailable: Provenance<number> | null = null;
  for (const c of CRUDE_CHAIN) {
    if (!c.configured()) continue;
    const r = await c.latest(symbol);
    if (!r.available) continue;
    // Prefer a live/fresh print; only fall through to a stale one if nothing fresher exists.
    if (r.freshness === "live" || r.freshness === "fresh") return r;
    if (!firstAvailable) firstAvailable = r;
  }
  return (
    firstAvailable ??
    unavailable({ source: "Crude (no source returned data)", sourceTier: 1, reason: "Source error", sourceUrl: "https://stooq.com/", unit: "$/bbl" })
  );
}

/** Refined product: prefer live Stooq futures, then EIA official spot. Both quote
 *  distillate/gasoline in $/gal so downstream crack maths is source-agnostic. */
export async function resolveProduct(
  eiaSymbol: string,
  stooqSymbol: string,
): Promise<Provenance<number>> {
  const s = await stooq.latest(stooqSymbol);
  if (s.available && (s.freshness === "live" || s.freshness === "fresh")) return s;
  if (eia.configured()) {
    const r = await eia.latest(eiaSymbol);
    if (r.available) return r;
  }
  if (s.available) return s;
  return unavailable({
    source: "Refined product (no source returned data)",
    sourceTier: 1,
    reason: "Source error",
    sourceUrl: "https://stooq.com/",
    unit: "$/gal",
  });
}

/** Crude series for sparklines: live Stooq daily history first, then EIA/FRED. */
export async function resolveCrudeSeries(symbol: "WTI" | "BRENT", days = 60): Promise<ProvenanceSeries> {
  const s = await stooq.series(symbol, days);
  if (s.available) return s;
  if (eia.configured()) {
    const r = await eia.series(symbol, days);
    if (r.available) return r;
  }
  if (fred.configured()) {
    const r = await fred.series(symbol, days);
    if (r.available) return r;
  }
  return s;
}
