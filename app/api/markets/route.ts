import { NextResponse } from "next/server";
import { resolveCrude } from "@/lib/adapters/resolve";
import { eia } from "@/lib/adapters/eia";
import { fred } from "@/lib/adapters/fred";
import { ecb } from "@/lib/adapters/ecb";
import { crackSpread, diff } from "@/lib/spreads";
import { unavailable } from "@/lib/provenance";
import { recordSnapshots, toRow } from "@/lib/snapshots";

export const dynamic = "force-dynamic";
export const revalidate = 1800;

export async function GET() {
  // Crude (resolver picks best configured source). Series for sparkline (EIA/FRED).
  const [wti, brent, dieselGC, ulsdNYH, gasolineGC, eurusd] = await Promise.all([
    resolveCrude("WTI"),
    resolveCrude("BRENT"),
    eia.configured() ? eia.latest("DIESEL_GC") : fred.latest("KEROSENE"),
    eia.latest("ULSD_NYH"),
    eia.latest("GASOLINE_GC"),
    ecb.latest("EURUSD"),
  ]);

  // Sparkline series — prefer EIA, fall back to FRED for WTI/Brent.
  const [wtiSeries, brentSeries] = await Promise.all([
    eia.configured() ? eia.series("WTI", 60) : fred.series("WTI", 60),
    eia.configured() ? eia.series("BRENT", 60) : fred.series("BRENT", 60),
  ]);

  // Derived refining-economics spreads (real inputs, labelled derived).
  const brentWti = diff("Brent–WTI", brent, wti, "$/bbl",
    "Brent's premium to WTI reflects waterborne vs landlocked crude and shipping arb; it shapes which crude refiners buy.");
  const dieselCrack = crackSpread("Gulf Coast diesel", dieselGC, "WTI", wti, {
    productPerGallon: true,
    why: "A strong distillate crack is bullish for MGO (a distillate) and signals refiners will favour diesel yield.",
  });
  const gasolineCrack = crackSpread("Gulf Coast gasoline", gasolineGC, "WTI", wti, {
    productPerGallon: true,
    why: "Gasoline crack competes with distillate for refinery yield; weak gasoline can push more diesel/fuel-oil output.",
  });

  // Honest commercial gates for marine-specific spreads we cannot source free.
  const vlsfoHsfo = unavailable<number>({
    source: "VLSFO–HSFO scrubber spread",
    sourceTier: 4,
    reason: "Commercial source required",
    sourceUrl: "https://shipandbunker.com/prices",
    unit: "$/mt",
  });
  const mgoVlsfo = unavailable<number>({
    source: "MGO–VLSFO spread",
    sourceTier: 4,
    reason: "Commercial source required",
    sourceUrl: "https://shipandbunker.com/prices",
    unit: "$/mt",
  });

  // Persist a provenance audit trail (best-effort, non-blocking). Only real,
  // available figures are recorded — never the commercial-gated placeholders.
  const snapshots = [
    toRow("WTI", wti),
    toRow("BRENT", brent),
    toRow("DIESEL_GC", dieselGC),
    toRow("ULSD_NYH", ulsdNYH),
    toRow("GASOLINE_GC", gasolineGC),
    toRow("EURUSD", eurusd),
    toRow("BRENT_WTI", brentWti),
    toRow("DIESEL_CRACK", dieselCrack),
    toRow("GASOLINE_CRACK", gasolineCrack),
  ].filter((r) => r.available && r.value != null);
  const written = await recordSnapshots(snapshots);

  return NextResponse.json({
    fetchedAt: new Date().toISOString(),
    audit: { persisted: written >= 0 ? written : null, store: written >= 0 ? "supabase" : "disabled" },
    crude: { wti, brent, wtiSeries, brentSeries },
    products: { dieselGC, ulsdNYH, gasolineGC },
    fx: { eurusd },
    spreads: { brentWti, dieselCrack, gasolineCrack, vlsfoHsfo, mgoVlsfo },
  });
}
