// AlphaVantage adapter — WTI/Brent/NatGas commodities, FX. Freemium (~25/day).
import { fetchJson } from "@/lib/http";
import { ok, unavailable, type Provenance } from "@/lib/provenance";
import { envConfigured } from "./types";

const KEY = "ALPHAVANTAGE_API_KEY";
const SRC_URL = "https://www.alphavantage.co/";

export const AV_FUNCS: Record<string, { fn: string; label: string; unit: string }> = {
  WTI: { fn: "WTI", label: "WTI (AlphaVantage)", unit: "$/bbl" },
  BRENT: { fn: "BRENT", label: "Brent (AlphaVantage)", unit: "$/bbl" },
  NATGAS: { fn: "NATURAL_GAS", label: "Henry Hub (AlphaVantage)", unit: "$/MMBtu" },
};

interface AvResp {
  data?: Array<{ date: string; value: string }>;
}

export const alphavantage = {
  id: "alphavantage",
  name: "AlphaVantage",
  tier: 1 as const,
  requiresKey: true,
  envKey: KEY,
  configured: () => envConfigured(KEY),

  async latest(symbol: string): Promise<Provenance<number>> {
    const meta = AV_FUNCS[symbol];
    const src = `AlphaVantage — ${meta ? meta.label : symbol}`;
    if (!meta) return unavailable({ source: src, sourceTier: 1, reason: "Not yet integrated", sourceUrl: SRC_URL });
    if (!this.configured())
      return unavailable({ source: src, sourceTier: 1, reason: "API key not configured", sourceUrl: SRC_URL, unit: meta.unit });
    try {
      const url = `https://www.alphavantage.co/query?function=${meta.fn}&interval=daily&apikey=${process.env[KEY]}`;
      const json = await fetchJson<AvResp>(url, { revalidate: 21600 });
      const row = (json.data ?? []).find((d) => d.value !== "." && d.value !== "");
      if (!row) return unavailable({ source: src, sourceTier: 1, reason: "Source error (rate limit?)", sourceUrl: SRC_URL, unit: meta.unit });
      return ok({
        value: Number(row.value),
        unit: meta.unit,
        source: src,
        sourceTier: 1,
        sourceUrl: SRC_URL,
        asOf: new Date(row.date + "T00:00:00Z").toISOString(),
        cadence: "dailySpot",
      });
    } catch (e) {
      return unavailable({ source: src, sourceTier: 1, reason: `Source error: ${(e as Error).message}`, sourceUrl: SRC_URL, unit: meta.unit });
    }
  },
};
