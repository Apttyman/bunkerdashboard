// EIA v2 adapter — crude & refined-product spot prices, refining stats.
// Free key: https://www.eia.gov/opendata/register.php
import { fetchJson } from "@/lib/http";
import { ok, unavailable, type Provenance, type ProvenanceSeries } from "@/lib/provenance";
import { envConfigured } from "./types";

const BASE = "https://api.eia.gov/v2/petroleum/pri/spt/data/";
const KEY = "EIA_API_KEY";

// Map our internal symbols to EIA petroleum spot series IDs + labels.
export const EIA_SERIES: Record<string, { series: string; label: string; unit: string }> = {
  WTI: { series: "RWTC", label: "WTI Cushing spot", unit: "$/bbl" },
  BRENT: { series: "RBRTE", label: "Brent Europe spot", unit: "$/bbl" },
  DIESEL_GC: { series: "EER_EPD2D_PF4_RGC_DPG", label: "No.2 Diesel, US Gulf Coast spot", unit: "$/gal" },
  ULSD_NYH: { series: "EER_EPD2DXL0_PF4_Y35NY_DPG", label: "ULSD, NY Harbor spot", unit: "$/gal" },
  GASOLINE_GC: { series: "EER_EPMRR_PF4_RGC_DPG", label: "Conventional gasoline, US Gulf Coast spot", unit: "$/gal" },
};

interface EiaResponse {
  response?: { data?: Array<{ period: string; value: string | number }> };
}

function url(seriesId: string, length = 60): string {
  const k = process.env[KEY];
  const p = new URLSearchParams({
    api_key: k ?? "",
    frequency: "daily",
    "data[0]": "value",
    "facets[series][]": seriesId,
    "sort[0][column]": "period",
    "sort[0][direction]": "desc",
    length: String(length),
  });
  return `${BASE}?${p.toString()}`;
}

const SRC_URL = "https://www.eia.gov/petroleum/";

export const eia = {
  id: "eia",
  name: "EIA v2",
  tier: 1 as const,
  requiresKey: true,
  envKey: KEY,
  configured: () => envConfigured(KEY),

  async latest(symbol: string): Promise<Provenance<number>> {
    const meta = EIA_SERIES[symbol];
    const src = `EIA v2 — ${meta ? meta.label : symbol}`;
    if (!meta) return unavailable({ source: src, sourceTier: 1, reason: "Not yet integrated", sourceUrl: SRC_URL });
    if (!this.configured())
      return unavailable({ source: src, sourceTier: 1, reason: "API key not configured", sourceUrl: SRC_URL, unit: meta.unit });
    try {
      const json = await fetchJson<EiaResponse>(url(meta.series, 1), { revalidate: 1800 });
      const row = json.response?.data?.[0];
      if (!row) return unavailable({ source: src, sourceTier: 1, reason: "Source error", sourceUrl: SRC_URL, unit: meta.unit });
      return ok({
        value: Number(row.value),
        unit: meta.unit,
        source: src,
        sourceTier: 1,
        sourceUrl: SRC_URL,
        asOf: new Date(row.period + "T00:00:00Z").toISOString(),
        cadence: "dailySpot",
      });
    } catch (e) {
      return unavailable({ source: src, sourceTier: 1, reason: `Source error: ${(e as Error).message}`, sourceUrl: SRC_URL, unit: meta.unit });
    }
  },

  async series(symbol: string, days = 60): Promise<ProvenanceSeries> {
    const meta = EIA_SERIES[symbol];
    const src = `EIA v2 — ${meta ? meta.label : symbol}`;
    const base = { source: src, sourceTier: 1 as const, sourceUrl: SRC_URL, fetchedAt: new Date().toISOString() };
    if (!meta) return { ...base, points: [], asOf: null, freshness: "unavailable", available: false, reason: "Not yet integrated" };
    if (!this.configured())
      return { ...base, points: [], asOf: null, freshness: "unavailable", available: false, reason: "API key not configured", unit: meta.unit };
    try {
      const json = await fetchJson<EiaResponse>(url(meta.series, days), { revalidate: 1800 });
      const rows = (json.response?.data ?? []).slice().reverse();
      const points = rows
        .filter((r) => r.value !== null && r.value !== "")
        .map((r) => ({ t: r.period, v: Number(r.value) }));
      const asOf = points.length ? new Date(points[points.length - 1].t + "T00:00:00Z").toISOString() : null;
      const { computeFreshness } = await import("@/lib/provenance");
      return { ...base, points, asOf, unit: meta.unit, available: points.length > 0, freshness: computeFreshness(asOf, "dailySpot"), reason: points.length ? undefined : "Source error" };
    } catch (e) {
      return { ...base, points: [], asOf: null, freshness: "unavailable", available: false, reason: `Source error: ${(e as Error).message}`, unit: meta.unit };
    }
  },
};
