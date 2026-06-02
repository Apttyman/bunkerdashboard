// ECB Data Portal (SDMX) adapter — keyless EUR reference FX rates.
import { fetchJson } from "@/lib/http";
import { ok, unavailable, type Provenance } from "@/lib/provenance";

const SRC_URL = "https://data.ecb.europa.eu/";

// EXR daily series: D.<CCY>.EUR.SP00.A  (value = units of CCY per 1 EUR)
export const ECB_CCY: Record<string, { ccy: string; label: string }> = {
  EURUSD: { ccy: "USD", label: "ECB reference EUR/USD" },
  EURGBP: { ccy: "GBP", label: "ECB reference EUR/GBP" },
  EURJPY: { ccy: "JPY", label: "ECB reference EUR/JPY" },
  EURCNY: { ccy: "CNY", label: "ECB reference EUR/CNY" },
};

interface SdmxJson {
  dataSets?: Array<{ series?: Record<string, { observations?: Record<string, number[]> }> }>;
  structure?: { dimensions?: { observation?: Array<{ values?: Array<{ id: string }> }> } };
}

export const ecb = {
  id: "ecb",
  name: "ECB Data Portal",
  tier: 1 as const,
  requiresKey: false,
  configured: () => true,

  async latest(symbol: string): Promise<Provenance<number>> {
    const meta = ECB_CCY[symbol];
    const src = `ECB — ${meta ? meta.label : symbol}`;
    if (!meta) return unavailable({ source: src, sourceTier: 1, reason: "Not yet integrated", sourceUrl: SRC_URL });
    try {
      const url = `https://data-api.ecb.europa.eu/service/data/EXR/D.${meta.ccy}.EUR.SP00.A?lastNObservations=1&format=jsondata`;
      const json = await fetchJson<SdmxJson>(url, { revalidate: 21600 });
      const series = json.dataSets?.[0]?.series;
      const firstKey = series ? Object.keys(series)[0] : undefined;
      const obs = firstKey ? series![firstKey].observations : undefined;
      const obsKey = obs ? Object.keys(obs)[0] : undefined;
      const value = obs && obsKey ? obs[obsKey][0] : undefined;
      const dates = json.structure?.dimensions?.observation?.[0]?.values;
      const asOfStr = dates && dates.length ? dates[dates.length - 1].id : null;
      if (value == null) return unavailable({ source: src, sourceTier: 1, reason: "Source error", sourceUrl: SRC_URL });
      return ok({
        value,
        unit: "",
        source: src,
        sourceTier: 1,
        sourceUrl: SRC_URL,
        asOf: asOfStr ? new Date(asOfStr + "T16:00:00Z").toISOString() : null,
        cadence: "dailyFx",
      });
    } catch (e) {
      return unavailable({ source: src, sourceTier: 1, reason: `Source error: ${(e as Error).message}`, sourceUrl: SRC_URL });
    }
  },
};
