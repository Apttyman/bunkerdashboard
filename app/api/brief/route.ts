import { NextResponse } from "next/server";
import { resolveCrude } from "@/lib/adapters/resolve";
import { eia } from "@/lib/adapters/eia";
import { diff, crackSpread } from "@/lib/spreads";
import type { Provenance } from "@/lib/provenance";

export const dynamic = "force-dynamic";
export const revalidate = 1800;

function fmt(p: Provenance<number>): string {
  if (!p.available || p.value == null) return `unavailable (${p.reason})`;
  return `${p.value}${p.unit ? " " + p.unit : ""}`;
}

export async function GET() {
  const [wti, brent, dieselGC] = await Promise.all([
    resolveCrude("WTI"),
    resolveCrude("BRENT"),
    eia.configured() ? eia.latest("DIESEL_GC") : eia.latest("WTI"),
  ]);
  const brentWti = diff("Brent–WTI", brent, wti, "$/bbl", "");
  const dieselCrack = crackSpread("Gulf Coast diesel", dieselGC, "WTI", wti, { productPerGallon: true, why: "" });

  const crudeLine = wti.available && brent.available
    ? `Brent ${fmt(brent)} and WTI ${fmt(wti)} (Brent–WTI ${fmt(brentWti)}). Crude sets the floor under every bunker grade.`
    : `Crude reference is ${wti.available ? fmt(wti) : "unavailable"} — add an EIA or FRED key to enable live crude.`;

  const sections = [
    {
      id: "crude", title: "Crude", body: crudeLine,
      provenance: [wti, brent, brentWti],
    },
    {
      id: "bunker", title: "Bunkers",
      body: "Absolute VLSFO/HSFO/MGO bunker prices are commercial (Platts/Argus/Ship & Bunker) and are shown as source-intelligence cards, not fabricated numbers. Distillate direction is proxied by Gulf Coast diesel and its crack.",
      provenance: [dieselGC, dieselCrack],
    },
    {
      id: "freight", title: "Freight",
      body: "Live tanker rates (Worldscale/TCE) and Baltic indices are licensed. Watch route intelligence cards and supply-chain re-routings (Suez/Panama) that inflate ton-miles.",
      provenance: [],
    },
    {
      id: "disruption", title: "Disruptions",
      body: "Track Suez/Red Sea, Hormuz, and Panama. Re-routing tightens the effective fleet and raises bunker burn per cargo even when cargo volume is flat.",
      provenance: [],
    },
  ];

  const whyItMatters =
    wti.available && brent.available
      ? `With Brent at ${fmt(brent)} and the diesel crack ${dieselCrack.available ? fmt(dieselCrack) : "unavailable"}, the read-through is: ${dieselCrack.available && dieselCrack.value! > 25 ? "distillate is well-bid, supporting MGO and ECA-leg costs" : "distillate margins are moderate, keeping MGO pressure contained"}. Re-routing risk around Suez/Hormuz remains the swing factor for freight and bunker demand.`
      : "Configure at least one crude source (EIA/FRED keys, or rely on keyless Stooq) to generate a data-driven read-through. Until then the brief explains structure honestly rather than fabricating levels.";

  return NextResponse.json({
    fetchedAt: new Date().toISOString(),
    date: new Date().toISOString().slice(0, 10),
    sections,
    whyItMatters,
  });
}
