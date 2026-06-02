// Tier 4 — commercial integration stubs. Each implements CommercialAdapter and
// returns an honest "Commercial source required" envelope until credentials are
// supplied AND fetch() is implemented. Implementing fetch() lights up the UI
// with zero component changes (the UI already consumes Provenance<T>).
import type { CommercialAdapter } from "../types";
import { unavailable, type Provenance } from "@/lib/provenance";
import { envConfigured } from "../types";

function stub(opts: { id: string; name: string; vendor: string; envKey: string; url: string; coverage: string }): CommercialAdapter {
  return {
    id: opts.id,
    name: opts.name,
    tier: 4,
    vendor: opts.vendor,
    envKey: opts.envKey,
    configured: () => envConfigured(opts.envKey),
    async fetch(symbol: string): Promise<Provenance<number>> {
      // NOTE for integrators: replace this body with a real authenticated call.
      // Map `symbol` -> vendor symbology, fetch, and return ok({...}). Until then
      // we never fabricate a value.
      return unavailable({
        source: `${opts.name} — ${symbol}`,
        sourceTier: 4,
        reason: envConfigured(opts.envKey) ? "Not yet integrated" : "Commercial source required",
        sourceUrl: opts.url,
      });
    },
  };
}

export const commercialAdapters: Record<string, CommercialAdapter & { coverage: string; url: string }> = {
  argus: Object.assign(stub({ id: "argus", name: "Argus Media", vendor: "Argus", envKey: "ARGUS_API_KEY", url: "https://www.argusmedia.com/", coverage: "Bunker, fuel oil, crude & products assessments" }), { coverage: "Bunker, fuel oil, crude & products assessments", url: "https://www.argusmedia.com/" }),
  platts: Object.assign(stub({ id: "platts", name: "S&P Global Platts", vendor: "Platts", envKey: "PLATTS_API_KEY", url: "https://www.spglobal.com/commodityinsights/", coverage: "Bunkerwire, MOC assessments, cracks" }), { coverage: "Bunkerwire, MOC assessments, cracks", url: "https://www.spglobal.com/commodityinsights/" }),
  clarksons: Object.assign(stub({ id: "clarksons", name: "Clarksons Intelligence", vendor: "Clarksons", envKey: "CLARKSONS_API_KEY", url: "https://www.clarksons.net/", coverage: "Earnings, fixtures, fleet, orderbook" }), { coverage: "Earnings, fixtures, fleet, orderbook", url: "https://www.clarksons.net/" }),
  kpler: Object.assign(stub({ id: "kpler", name: "Kpler", vendor: "Kpler", envKey: "KPLER_API_KEY", url: "https://www.kpler.com/", coverage: "Flows, floating storage, port calls" }), { coverage: "Flows, floating storage, port calls", url: "https://www.kpler.com/" }),
  vortexa: Object.assign(stub({ id: "vortexa", name: "Vortexa", vendor: "Vortexa", envKey: "VORTEXA_API_KEY", url: "https://www.vortexa.com/", coverage: "Cargo flows, freight, floating storage" }), { coverage: "Cargo flows, freight, floating storage", url: "https://www.vortexa.com/" }),
  signalocean: Object.assign(stub({ id: "signalocean", name: "Signal Ocean", vendor: "Signal", envKey: "SIGNAL_OCEAN_API_KEY", url: "https://www.signalocean.com/", coverage: "TCE, routes, positions, congestion" }), { coverage: "TCE, routes, positions, congestion", url: "https://www.signalocean.com/" }),
  baltic: Object.assign(stub({ id: "baltic", name: "Baltic Exchange", vendor: "Baltic", envKey: "BALTIC_API_KEY", url: "https://www.balticexchange.com/", coverage: "BDI/BDTI/BCTI, route TCE assessments" }), { coverage: "BDI/BDTI/BCTI, route TCE assessments", url: "https://www.balticexchange.com/" }),
  marinetraffic: Object.assign(stub({ id: "marinetraffic", name: "MarineTraffic", vendor: "MarineTraffic", envKey: "MARINETRAFFIC_API_KEY", url: "https://www.marinetraffic.com/", coverage: "AIS positions, ETAs, port congestion" }), { coverage: "AIS positions, ETAs, port congestion", url: "https://www.marinetraffic.com/" }),
};
