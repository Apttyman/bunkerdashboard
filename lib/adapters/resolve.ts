// Resolvers — for a given quantity, try configured adapters in priority order and
// return the first available provenance-wrapped value. If none are configured,
// return an honest unavailable envelope (never a fabricated number).
import type { Provenance, ProvenanceSeries } from "@/lib/provenance";
import { unavailable } from "@/lib/provenance";
import { eia } from "./eia";
import { fred } from "./fred";
import { stooq } from "./stooq";
import { alphavantage } from "./alphavantage";

type LatestFn = (symbol: string) => Promise<Provenance<number>>;
interface Candidate { id: string; configured: () => boolean; latest: LatestFn; }

// Crude: prefer official spot (EIA/FRED), then keyless Stooq, then AlphaVantage.
const CRUDE_CHAIN: Candidate[] = [eia, fred, stooq, alphavantage];

export async function resolveCrude(symbol: "WTI" | "BRENT"): Promise<Provenance<number>> {
  for (const c of CRUDE_CHAIN) {
    if (!c.configured()) continue;
    const r = await c.latest(symbol);
    if (r.available) return r;
  }
  return unavailable({
    source: "Crude (no source returned data)",
    sourceTier: 1,
    reason: "Source error",
    sourceUrl: "https://www.eia.gov/petroleum/",
    unit: "$/bbl",
  });
}

/** Refined product: try EIA official spot, then keyless Stooq futures. Both quote
 *  distillate/gasoline in $/gal so downstream crack maths is source-agnostic. */
export async function resolveProduct(
  eiaSymbol: string,
  stooqSymbol: string,
): Promise<Provenance<number>> {
  if (eia.configured()) {
    const r = await eia.latest(eiaSymbol);
    if (r.available) return r;
  }
  const s = await stooq.latest(stooqSymbol);
  if (s.available) return s;
  return unavailable({
    source: "Refined product (no source returned data)",
    sourceTier: 1,
    reason: "Source error",
    sourceUrl: "https://stooq.com/",
    unit: "$/gal",
  });
}

/** Crude series for sparklines: EIA/FRED official daily, else keyless Stooq history. */
export async function resolveCrudeSeries(symbol: "WTI" | "BRENT", days = 60): Promise<ProvenanceSeries> {
  if (eia.configured()) {
    const r = await eia.series(symbol, days);
    if (r.available) return r;
  }
  if (fred.configured()) {
    const r = await fred.series(symbol, days);
    if (r.available) return r;
  }
  return stooq.series(symbol, days);
}
