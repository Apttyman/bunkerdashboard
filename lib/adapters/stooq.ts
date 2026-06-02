// Stooq adapter — keyless CSV quotes + daily history. Provides real crude,
// product (heating-oil/RBOB), NatGas and FX data with no API key, and the
// distillate/gasoline series used to derive real crack spreads.
import { fetchText } from "@/lib/http";
import { ok, unavailable, computeFreshness, type Provenance, type ProvenanceSeries } from "@/lib/provenance";

const SRC_URL = "https://stooq.com/";

export const STOOQ_SYMBOLS: Record<string, { sym: string; label: string; unit: string }> = {
  WTI: { sym: "cl.f", label: "WTI front future (Stooq)", unit: "$/bbl" },
  BRENT: { sym: "cb.f", label: "Brent front future (Stooq)", unit: "$/bbl" },
  NATGAS: { sym: "ng.f", label: "Henry Hub NatGas future (Stooq)", unit: "$/MMBtu" },
  // NY Harbor ULSD (heating oil) — the deliverable distillate; a real MGO proxy.
  HEATOIL: { sym: "ho.f", label: "NY Harbor ULSD/heating-oil future (Stooq)", unit: "$/gal" },
  // RBOB gasoline future.
  RBOB: { sym: "rb.f", label: "RBOB gasoline future (Stooq)", unit: "$/gal" },
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

  async series(symbol: string, days = 60): Promise<ProvenanceSeries> {
    const meta = STOOQ_SYMBOLS[symbol];
    const src = `Stooq — ${meta ? meta.label : symbol}`;
    const base = { source: src, sourceTier: 1 as const, sourceUrl: SRC_URL, fetchedAt: new Date().toISOString() };
    if (!meta) return { ...base, points: [], asOf: null, freshness: "unavailable", available: false, reason: "Not yet integrated" };
    try {
      // Daily history CSV: Date,Open,High,Low,Close,Volume
      const csv = await fetchText(`https://stooq.com/q/d/l/?s=${meta.sym}&i=d`, { revalidate: 3600 });
      const rows = csv.trim().split("\n").slice(1);
      const points = rows
        .map((r) => r.split(","))
        .filter((c) => c.length >= 5 && c[4] !== "" && c[4] !== "N/D")
        .map((c) => ({ t: c[0], v: Number(c[4]) }))
        .slice(-days);
      const asOf = points.length ? new Date(points[points.length - 1].t + "T00:00:00Z").toISOString() : null;
      return { ...base, points, unit: meta.unit, asOf, available: points.length > 1, freshness: computeFreshness(asOf, "intraday"), reason: points.length > 1 ? undefined : "Source error" };
    } catch (e) {
      return { ...base, points: [], asOf: null, freshness: "unavailable", available: false, reason: `Source error: ${(e as Error).message}`, unit: meta.unit };
    }
  },
};
