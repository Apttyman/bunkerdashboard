// Resolver — for a given symbol, try configured adapters in priority order and
// return the first available provenance-wrapped value. If none are configured,
// return an honest unavailable envelope (never a fabricated number).
import type { Provenance } from "@/lib/provenance";
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
  // Stooq needs no key — if it failed too, surface honest unavailable.
  return unavailable({
    source: "Crude (no configured source returned data)",
    sourceTier: 1,
    reason: "API key not configured",
    sourceUrl: "https://www.eia.gov/petroleum/",
    unit: "$/bbl",
  });
}
