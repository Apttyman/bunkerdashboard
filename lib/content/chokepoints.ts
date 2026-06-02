export interface Chokepoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
  whatFlows: string;
  whyItMatters: string;
  operationalImplication: string;
  watch: string;
}

export const CHOKEPOINTS: Chokepoint[] = [
  {
    id: "panama",
    name: "Panama Canal",
    lat: 9.08,
    lon: -79.68,
    whatFlows: "US Gulf ↔ Asia LPG/LNG, containers, grains, some clean products.",
    whyItMatters:
      "Draft restrictions during drought cut transits and slot availability, forcing longer Cape Horn / Suez routings that lengthen voyages and lift bunker demand per cargo.",
    operationalImplication:
      "Reduced daily transit slots → waiting time, auction premiums, and ton-mile inflation. Watch ACP draft/booking notices.",
    watch: "ACP transit & draft advisories; Gatún Lake level.",
  },
  {
    id: "suez",
    name: "Suez Canal",
    lat: 30.5,
    lon: 32.35,
    whatFlows: "Europe ↔ Asia crude, products, containers; ~10–12% of world seaborne trade in normal times.",
    whyItMatters:
      "Diversions around the Cape of Good Hope add ~10–14 days each way Asia–Europe, raising ton-miles, tying up tonnage, and increasing bunker burn — supportive for freight and bunker demand.",
    operationalImplication: "Re-routing absorbs vessel supply (tighter effective fleet) and changes bunkering hubs (more Singapore/Mauritius/West Africa stems).",
    watch: "SCA transit counts; Red Sea security advisories.",
  },
  {
    id: "redsea",
    name: "Red Sea / Bab-el-Mandeb",
    lat: 12.6,
    lon: 43.4,
    whatFlows: "Gateway between Suez and the Indian Ocean; tankers, containers, LNG.",
    whyItMatters:
      "Security risk here is the proximate driver of Suez avoidance. War-risk insurance (AWRP) and crew-risk premiums spike; many owners reroute regardless of canal capacity.",
    operationalImplication: "Higher insurance, convoy/transit decisions, and a structural Cape re-routing premium embedded in freight.",
    watch: "War-risk premiums; naval coalition advisories; carrier routing statements.",
  },
  {
    id: "hormuz",
    name: "Strait of Hormuz",
    lat: 26.6,
    lon: 56.4,
    whatFlows: "~1/5 of global oil & much LNG (Qatar) exits the Gulf here. Fujairah bunkering hub sits just outside.",
    whyItMatters:
      "The single most concentrated oil chokepoint. Any closure threat reprices crude, tanker risk, and Gulf bunker supply almost instantly.",
    operationalImplication: "Tension → VLCC rate & war-risk spikes, Fujairah premium, and potential rerouting of Gulf crude.",
    watch: "Gulf tension headlines; Fujairah bunker availability; AGI (Arabian Gulf) VLCC fixtures.",
  },
];
