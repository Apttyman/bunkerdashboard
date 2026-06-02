// Learning Mode content. Every concept: What is it? / Why does it matter? /
// How does a trader use it? Written for a finance professional with no shipping
// background to build genuine commercial understanding in minutes.

export interface LearnTopic {
  id: string;
  term: string;
  category: "Fuels" | "Refining" | "Freight" | "Commercial" | "Risk";
  what: string;
  why: string;
  how: string;
}

export const LEARN_TOPICS: LearnTopic[] = [
  {
    id: "vlsfo", term: "VLSFO", category: "Fuels",
    what: "Very Low Sulphur Fuel Oil (≤0.50% sulphur), the default marine fuel since the 2020 IMO global sulphur cap.",
    why: "It's the single biggest variable cost for most ships. The Singapore VLSFO print is the de-facto global bunker benchmark.",
    how: "A trader compares VLSFO across hubs to pick the cheapest stem and watches it against HSFO and MGO to judge blending and scrubber economics.",
  },
  {
    id: "hsfo", term: "HSFO", category: "Fuels",
    what: "High Sulphur Fuel Oil (3.5% S). Only legal to burn at sea with an exhaust-gas scrubber installed.",
    why: "Cheaper than VLSFO; the saving (the 'scrubber spread') is what repays a scrubber investment.",
    how: "Owners with scrubbers track the VLSFO–HSFO spread to value their fuel advantage; a wide spread means scrubbers pay back fast.",
  },
  {
    id: "mgo", term: "MGO", category: "Fuels",
    what: "Marine Gas Oil — a cleaner distillate (~0.1% S) used in Emission Control Areas and auxiliary engines.",
    why: "Most expensive common marine fuel; mandatory in ECAs (e.g. US/EU coasts), so it drives cost on those legs.",
    how: "Traders budget MGO for ECA transits and hedge it via ICE gasoil, the closest liquid derivative.",
  },
  {
    id: "crack", term: "Crack spread", category: "Refining",
    what: "The margin between a refined product and the crude used to make it (product price minus crude, in $/bbl).",
    why: "It signals refinery profitability and product tightness; fuel-oil and distillate cracks shape bunker prices.",
    how: "A trader reads a strong diesel crack as bullish for MGO and a weak fuel-oil crack as supportive of cheap HSFO.",
  },
  {
    id: "basis", term: "Basis", category: "Commercial",
    what: "The difference between a local physical price and a benchmark/futures price.",
    why: "Hedges are placed in liquid benchmarks but exposure is physical and local — basis is the leftover risk.",
    how: "A bunker buyer hedging Singapore VLSFO with ICE gasoil carries the gasoil-to-VLSFO basis and monitors it.",
  },
  {
    id: "freight", term: "Freight (ton-mile)", category: "Freight",
    what: "The cost to move cargo by sea; demand is measured in ton-miles (tonnes × distance).",
    why: "Re-routings (Suez/Panama) lengthen distance, inflating ton-miles and tightening the effective fleet even without more cargo.",
    how: "A trader links disruptions to ton-mile demand to anticipate freight — and thus bunker demand — moves.",
  },
  {
    id: "tce", term: "TCE (Time Charter Equivalent)", category: "Freight",
    what: "Voyage revenue minus voyage costs (bunkers, port, canal), expressed as $/day — comparable to a daily hire rate.",
    why: "It's the apples-to-apples earnings metric across routes and vessels; the number owners actually live on.",
    how: "Traders compare TCE to daily opex/breakeven to see which segments make money and where tonnage will move.",
  },
  {
    id: "worldscale", term: "Worldscale (WS)", category: "Freight",
    what: "An index of nominal flat rates per route; spot tanker rates are quoted as a percentage of the annual flat rate.",
    why: "It normalises rates across routes of different distances so one number ('WS 75') is comparable year to year.",
    how: "A trader converts WS to TCE (using flat rate, cargo size, speed, bunker price) to judge true earnings.",
  },
  {
    id: "chartering", term: "Chartering", category: "Commercial",
    what: "Hiring a vessel — by voyage (owner pays bunkers), time charter (charterer pays bunkers, $/day), or bareboat.",
    why: "Who pays for bunkers differs by charter type, which determines who carries fuel-price risk.",
    how: "A bunker trader checks the charter type to know whether the owner or charterer is the fuel buyer to quote.",
  },
  {
    id: "demurrage", term: "Demurrage", category: "Commercial",
    what: "A penalty the charterer pays the owner when loading/discharging takes longer than the agreed laytime.",
    why: "Port congestion turns into real cash via demurrage and signals tight tonnage.",
    how: "Traders watch rising demurrage as an early sign of congestion that will support freight.",
  },
  {
    id: "laytime", term: "Laytime", category: "Commercial",
    what: "The time allowed in the charter for cargo operations before demurrage starts accruing.",
    why: "It defines the boundary between 'free' port time and penalty time.",
    how: "Operators manage laytime carefully; sustained overruns flag systemic port problems.",
  },
  {
    id: "storage", term: "Storage economics / contango", category: "Risk",
    what: "When forward prices exceed spot (contango), it can pay to store oil — including in 'floating storage' on tankers.",
    why: "Floating storage removes tankers from the trading fleet, tightening freight; it links the crude curve to tanker rates.",
    how: "A trader watches the crude curve: deep contango → floating storage → fewer ships → firmer freight.",
  },
  {
    id: "arbitrage", term: "Arbitrage (arb)", category: "Commercial",
    what: "Profiting from a price gap between regions once you add freight, e.g. moving product from a cheap to a dear market.",
    why: "Arbs drive cargo flows, which drive ton-miles and bunker demand at the loading/discharge hubs.",
    how: "A trader checks whether the regional price spread covers freight; an 'open arb' means cargoes (and bunkering) will move.",
  },
  {
    id: "hedging", term: "Hedging", category: "Risk",
    what: "Offsetting price risk with derivatives — bunker swaps, ICE gasoil, fuel-oil swaps, or FFAs.",
    why: "Bunkers and freight are volatile; hedging locks margins for a developing trading book.",
    how: "A trader hedges a fixed bunker sale by buying a matching fuel-oil swap, leaving only basis risk.",
  },
  {
    id: "ffa", term: "FFA (Forward Freight Agreement)", category: "Risk",
    what: "A cash-settled derivative on a freight route or index (e.g. a Baltic TD route), settling vs the published assessment.",
    why: "It lets owners and charterers lock future freight (and indirectly bunker exposure) without a physical ship.",
    how: "An owner sells FFAs to fix forward earnings; a charterer buys them to cap freight cost.",
  },
];

export const LEARN_CATEGORIES = ["Fuels", "Refining", "Freight", "Commercial", "Risk"] as const;
