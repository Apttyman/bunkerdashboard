// Tier 2 — public structured source intelligence cards. We link and explain;
// we do NOT scrape or restate licensed numbers. Used wherever live data is
// commercial (freight, bunker absolute prices, derivatives settlements).

export interface IntelCard {
  id: string;
  title: string;
  provider: string;
  url: string;
  whatYouGet: string;
  howToRead: string;
  cost: "Free page" | "Freemium" | "Subscription" | "Enterprise";
}

export const BUNKER_INTEL: IntelCard[] = [
  { id: "sandb", title: "Daily VLSFO/HSFO/MGO by port", provider: "Ship & Bunker", url: "https://shipandbunker.com/prices", whatYouGet: "Daily bunker prices for ~20 ports incl. Singapore, Rotterdam, Fujairah, Houston, Gibraltar, Zhoushan.", howToRead: "Compare VLSFO across hubs for the cheapest stem; watch the VLSFO–HSFO scrubber spread.", cost: "Free page" },
  { id: "bunkerindex", title: "MDO/IFO indices & port prices", provider: "Bunker Index", url: "https://www.bunkerindex.com/", whatYouGet: "Regional bunker indices and port-level prices.", howToRead: "Use the index as a directional regional gauge.", cost: "Free page" },
  { id: "platts", title: "Bunkerwire assessments", provider: "S&P Global Platts", url: "https://www.spglobal.com/commodityinsights/", whatYouGet: "Benchmark marine fuel assessments (the desk standard).", howToRead: "Platts/Argus assessments are what physical and paper contracts price against.", cost: "Subscription" },
];

export const FREIGHT_INTEL: IntelCard[] = [
  { id: "baltic", title: "BDTI / BCTI / route TCE", provider: "Baltic Exchange", url: "https://www.balticexchange.com/en/data-services/market-information0.html", whatYouGet: "Dirty (BDTI) & clean (BCTI) tanker indices, route assessments, TCE.", howToRead: "BDTI tracks crude tanker earnings; individual TD/TC routes show segment health.", cost: "Subscription" },
  { id: "clarksons", title: "Tanker earnings & fleet", provider: "Clarksons (SIN)", url: "https://www.clarksons.net/", whatYouGet: "VLCC/Suezmax/Aframax/product earnings, orderbook, fleet age.", howToRead: "Earnings vs opex breakeven tells you who's making money; orderbook signals future supply.", cost: "Subscription" },
  { id: "braemar", title: "Weekly tanker market report", provider: "Braemar", url: "https://www.braemar.com/news-and-insights/", whatYouGet: "Free weekly commentary on rates, fixtures, sentiment.", howToRead: "Good qualitative read on where rates are heading and why.", cost: "Free page" },
  { id: "splash", title: "Shipping news & disruptions", provider: "Splash247", url: "https://splash247.com/", whatYouGet: "Daily shipping news incl. casualties, congestion, regulation.", howToRead: "Scan headlines for events that move ton-miles or supply.", cost: "Free page" },
];

export const DERIV_INTEL: IntelCard[] = [
  { id: "sgx", title: "FFA, fuel oil & freight futures", provider: "SGX", url: "https://www.sgx.com/derivatives/products/freight", whatYouGet: "Forward Freight Agreements and Singapore fuel oil/freight contract specs & settlements.", howToRead: "FFAs let owners/charterers hedge route TCE; fuel oil swaps hedge bunker cost.", cost: "Freemium" },
  { id: "cme", title: "Freight, fuel oil & crude futures", provider: "CME Group", url: "https://www.cmegroup.com/markets/energy/freight.html", whatYouGet: "Cleared freight, fuel oil, and energy futures specs & delayed quotes.", howToRead: "Use cleared swaps to lock bunker or freight exposure.", cost: "Freemium" },
  { id: "ice", title: "Brent, gasoil, fuel oil & freight", provider: "ICE", url: "https://www.ice.com/products/Futures-Options/Energy", whatYouGet: "Brent, low-sulphur gasoil, fuel oil, and freight contracts.", howToRead: "ICE gasoil/Brent are core hedges behind MGO and crude exposure.", cost: "Freemium" },
];
