// Stooq adapter — keyless CSV quotes. Crude/macro fallback when no API key set.
import { fetchText } from "@/lib/http";
import { ok, unavailable, type Provenance } from "@/lib/provenance";

const SRC_URL = "https://stooq.com/";

export const STOOQ_SYMBOLS: Record<string, { sym: string; label: string; unit: string }> = {
  WTI: { sym: "cl.f", label: "WTI front future (Stooq)", unit: "$/bbl" },
  BRENT: { sym: "cb.f", label: "Brent front future (Stooq)", unit: "$/bbl" },
  NATGAS: { sym: "ng.f", label: "Henry Hub NatGas future (Stooq)", unit: "$/MMBtu" },
  EURUSD: { sym: "eurusd", label: "EUR/USD (Stooq)", unit: "" },
};

export const stooq = {
  id: "stooq",
  name: "Stooq",
  tier: 1 as const,
  requiresKey: false,
  configured: () => true,

  async latest(symbol: string): Promise<Provenance<number>> {
    const meta = STOOQ_SYMBOLS[symbol];
    const src = `Stooq — ${meta ? meta.label : symbol}`;
    if (!meta) return unavailable({ source: src, sourceTier: 1, reason: "Not yet integrated", sourceUrl: SRC_URL });
    try {
      const csv = await fetchText(
        `https://stooq.com/q/l/?s=${meta.sym}&f=sd2t2ohlcv&h&e=csv`,
        { revalidate: 900 },
      );
      // header: Symbol,Date,Time,Open,High,Low,Close,Volume
      const lines = csv.trim().split("\n");
      const cols = lines[1]?.split(",");
      if (!cols || cols.length < 7 || cols[6] === "N/D")
        return unavailable({ source: src, sourceTier: 1, reason: "Source error", sourceUrl: SRC_URL, unit: meta.unit });
      const close = Number(cols[6]);
      const asOf = new Date(`${cols[1]}T${cols[2] || "00:00:00"}Z`).toISOString();
      return ok({ value: close, unit: meta.unit, source: src, sourceTier: 1, sourceUrl: SRC_URL, asOf, cadence: "intraday" });
    } catch (e) {
      return unavailable({ source: src, sourceTier: 1, reason: `Source error: ${(e as Error).message}`, sourceUrl: SRC_URL, unit: meta.unit });
    }
  },
};
