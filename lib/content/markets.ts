// Reference metadata for marine-fuel ports, products, and freight segments.
// NOTE: absolute bunker prices and freight rates are COMMERCIAL. This file holds
// structure + context only; live prices come from adapters or are gated honestly.

export interface BunkerPort {
  id: string;
  name: string;
  region: string;
  note: string;
}

export const BUNKER_PORTS: BunkerPort[] = [
  { id: "singapore", name: "Singapore", region: "Asia", note: "World's largest bunkering hub; the global VLSFO benchmark print." },
  { id: "rotterdam", name: "Rotterdam", region: "NW Europe", note: "ARA hub; European benchmark, blending centre." },
  { id: "fujairah", name: "Fujairah", region: "Middle East", note: "Gulf bunkering hub just outside Hormuz." },
  { id: "houston", name: "Houston", region: "US Gulf", note: "US Gulf hub; tied to USGC product cracks." },
  { id: "panama", name: "Panama (Balboa/Cristóbal)", region: "Central America", note: "Canal-transit stems." },
  { id: "gibraltar", name: "Gibraltar", region: "Med", note: "West-Med gateway stems." },
  { id: "zhoushan", name: "Zhoushan", region: "China", note: "Fast-growing Chinese hub; bonded bunker pricing." },
];

export interface FuelProduct {
  id: string;
  name: string;
  spec: string;
  use: string;
  proxy?: string; // honest proxy note where a free reference exists
}

export const FUEL_PRODUCTS: FuelProduct[] = [
  {
    id: "vlsfo",
    name: "VLSFO",
    spec: "Very Low Sulphur Fuel Oil, ≤0.50% S — the post-2020 IMO global cap default.",
    use: "Main fuel for non-scrubber vessels.",
    proxy: "No free real-time VLSFO assessment exists; absolute price is commercial (Platts/Argus/Ship & Bunker).",
  },
  {
    id: "hsfo",
    name: "HSFO",
    spec: "High Sulphur Fuel Oil, 3.5% S — burnable only with an exhaust scrubber.",
    use: "Scrubber-fitted vessels; economics hinge on the VLSFO–HSFO 'scrubber spread'.",
    proxy: "EIA No.6 residual fuel oil is a directional refinery proxy only — NOT a marine HSFO bunker assessment.",
  },
  {
    id: "mgo",
    name: "MGO",
    spec: "Marine Gas Oil — a distillate, ~0.1% S; used in ECAs and by smaller engines.",
    use: "Emission Control Areas, auxiliary engines, manoeuvring.",
    proxy: "EIA/FRED Gulf Coast & NYH ULSD/diesel spot is a reasonable distillate proxy — labelled as a proxy, not an MGO bunker assessment.",
  },
];

export interface FreightSegment {
  id: string;
  name: string;
  dwt: string;
  cargo: string;
  benchmarkRoutes: string;
  worldscaleNote: string;
}

export const FREIGHT_SEGMENTS: FreightSegment[] = [
  { id: "vlcc", name: "VLCC", dwt: "~200–320k dwt", cargo: "Crude (2m bbl)", benchmarkRoutes: "TD3C AG→China, TD22 USG→China", worldscaleNote: "Rates quoted in Worldscale (WS) points vs a flat-rate schedule; convert to TCE for $/day." },
  { id: "suezmax", name: "Suezmax", dwt: "~120–200k dwt", cargo: "Crude (1m bbl)", benchmarkRoutes: "TD20 WAF→UKC, TD6 Black Sea→Med", worldscaleNote: "WS-quoted; sensitive to WAF and Black Sea flows." },
  { id: "aframax", name: "Aframax", dwt: "~80–120k dwt", cargo: "Crude / DPP", benchmarkRoutes: "TD7 North Sea, TD25 USG→UKC", worldscaleNote: "WS-quoted; short-haul and regional crude." },
  { id: "lr2", name: "LR2", dwt: "~80–120k dwt", cargo: "Clean products (naphtha/jet/diesel)", benchmarkRoutes: "TC1/TC20 AG→Japan/UKC", worldscaleNote: "Largest clean carrier; can switch to dirty." },
  { id: "lr1", name: "LR1", dwt: "~55–80k dwt", cargo: "Clean products", benchmarkRoutes: "TC5 AG→Japan", worldscaleNote: "WS-quoted clean trades." },
  { id: "mr", name: "MR", dwt: "~25–55k dwt", cargo: "Clean products (gasoline/diesel)", benchmarkRoutes: "TC2 UKC→US, TC14 USG→UKC, TC17 AG→East Africa", worldscaleNote: "Workhorse product tanker; triangulation drives earnings." },
];
