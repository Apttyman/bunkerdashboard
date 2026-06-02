// FRED adapter (St. Louis Fed) — crude, macro, FX indices, rates. Free key.
// https://fred.stlouisfed.org/docs/api/api_key.html
import { fetchJson } from "@/lib/http";
import { ok, unavailable, computeFreshness, type Provenance, type ProvenanceSeries } from "@/lib/provenance";
import { envConfigured } from "./types";

const BASE = "https://api.stlouisfed.org/fred/series/observations";
const KEY = "FRED_API_KEY";

export const FRED_SERIES: Record<string, { id: string; label: string; unit: string }> = {
  WTI: { id: "DCOILWTICO", label: "WTI Cushing (FRED)", unit: "$/bbl" },
  BRENT: { id: "DCOILBRENTEU", label: "Brent Europe (FRED)", unit: "$/bbl" },
  USD_BROAD: { id: "DTWEXBGS", label: "Nominal Broad USD Index", unit: "index" },
  UST10Y: { id: "DGS10", label: "10Y US Treasury", unit: "%" },
  KEROSENE: { id: "DKERNYH", label: "Kerosene-type jet fuel NYH", unit: "$/gal" },
};

const SRC_URL = "https://fred.stlouisfed.org/";

interface FredResp {
  observations?: Array<{ date: string; value: string }>;
}

function url(id: string, limit = 60): string {
  const p = new URLSearchParams({
    series_id: id,
    api_key: process.env[KEY] ?? "",
    file_type: "json",
    sort_order: "desc",
    limit: String(limit),
  });
  return `${BASE}?${p.toString()}`;
}

export const fred = {
  id: "fred",
  name: "FRED",
  tier: 1 as const,
  requiresKey: true,
  envKey: KEY,
  configured: () => envConfigured(KEY),

  async latest(symbol: string): Promise<Provenance<number>> {
    const meta = FRED_SERIES[symbol];
    const src = `FRED — ${meta ? meta.label : symbol}`;
    if (!meta) return unavailable({ source: src, sourceTier: 1, reason: "Not yet integrated", sourceUrl: SRC_URL });
    if (!this.configured())
      return unavailable({ source: src, sourceTier: 1, reason: "API key not configured", sourceUrl: SRC_URL, unit: meta.unit });
    try {
      const json = await fetchJson<FredResp>(url(meta.id, 10), { revalidate: 1800 });
      const row = (json.observations ?? []).find((o) => o.value !== "." && o.value !== "");
      if (!row) return unavailable({ source: src, sourceTier: 1, reason: "Source error", sourceUrl: SRC_URL, unit: meta.unit });
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

  async series(symbol: string, days = 60): Promise<ProvenanceSeries> {
    const meta = FRED_SERIES[symbol];
    const src = `FRED — ${meta ? meta.label : symbol}`;
    const base = { source: src, sourceTier: 1 as const, sourceUrl: SRC_URL, fetchedAt: new Date().toISOString() };
    if (!meta) return { ...base, points: [], asOf: null, freshness: "unavailable", available: false, reason: "Not yet integrated" };
    if (!this.configured())
      return { ...base, points: [], asOf: null, freshness: "unavailable", available: false, reason: "API key not configured", unit: meta.unit };
    try {
      const json = await fetchJson<FredResp>(url(meta.id, days), { revalidate: 1800 });
      const points = (json.observations ?? [])
        .filter((o) => o.value !== "." && o.value !== "")
        .map((o) => ({ t: o.date, v: Number(o.value) }))
        .reverse();
      const asOf = points.length ? new Date(points[points.length - 1].t + "T00:00:00Z").toISOString() : null;
      return { ...base, points, unit: meta.unit, asOf, available: points.length > 0, freshness: computeFreshness(asOf, "dailySpot"), reason: points.length ? undefined : "Source error" };
    } catch (e) {
      return { ...base, points: [], asOf: null, freshness: "unavailable", available: false, reason: `Source error: ${(e as Error).message}`, unit: meta.unit };
    }
  },
};
