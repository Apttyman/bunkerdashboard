// Ship & Bunker connector — VLSFO / HSFO (IFO380) / MGO by port.
// Heuristic text parser with strict range validation. Fails honestly if the page
// is JS-rendered or the layout changes (returns parse:"failed", never fake data).
import { getPageHtml, robotsState, htmlToText, scrapingEnabled } from "../engine";
import type { ScrapeConnector, ScrapeResult, ScrapeRow } from "../types";

const URL_ = "https://shipandbunker.com/prices";
const PORTS = [
  "Singapore", "Rotterdam", "Fujairah", "Houston", "Gibraltar", "Zhoushan",
  "Panama", "Hong Kong", "Busan", "Los Angeles", "Antwerp", "Durban",
];

// Sane bunker ranges ($/mt) to reject mis-parsed numbers.
const R = { VLSFO: [200, 1400], HSFO: [150, 1200], MGO: [300, 2000] } as const;

function parse(text: string): ScrapeRow[] {
  const lines = text.split("\n");
  const rows: ScrapeRow[] = [];
  for (const port of PORTS) {
    const idx = lines.findIndex((l) => l.toLowerCase().startsWith(port.toLowerCase()));
    if (idx === -1) continue;
    // Gather numbers from the port line and the next couple of lines.
    const blob = lines.slice(idx, idx + 3).join(" ");
    const nums = (blob.match(/\d[\d,]*\.?\d*/g) ?? []).map((s) => Number(s.replace(/,/g, "")));
    const vlsfo = nums.find((n) => n >= R.VLSFO[0] && n <= R.VLSFO[1]) ?? null;
    const hsfo = nums.find((n) => n >= R.HSFO[0] && n <= R.HSFO[1] && n !== vlsfo) ?? null;
    const mgo = nums.find((n) => n >= R.MGO[0] && n <= R.MGO[1] && n !== vlsfo && n !== hsfo) ?? null;
    if (vlsfo == null && hsfo == null && mgo == null) continue;
    rows.push({ key: port, values: [vlsfo, hsfo, mgo] });
  }
  return rows;
}

export const shipandbunker: ScrapeConnector = {
  id: "shipandbunker",
  name: "Ship & Bunker — bunker prices by port",
  sourceUrl: URL_,
  targetPath: "/prices",
  legalNote: "ToS restricts automated collection & redistribution. Personal use only; do not republish.",
  enabled: () => scrapingEnabled() && process.env.SCRAPE_SHIPANDBUNKER !== "false",
  async scrape(): Promise<ScrapeResult> {
    const base: ScrapeResult = {
      id: "shipandbunker", name: this.name, sourceUrl: URL_, fetchedAt: new Date().toISOString(),
      asOf: null, available: false, robots: "unknown", parse: "empty", table: null,
    };
    if (!this.enabled()) return { ...base, reason: "Scraping disabled" };
    const robots = await robotsState(URL_);
    if (robots !== "allowed") return { ...base, robots, reason: `robots.txt: ${robots} — not scraping` };
    try {
      const { html, mode, renderError } = await getPageHtml(URL_, true, 1800);
      const rows = parse(htmlToText(html));
      const diag = renderError ? ` [render→static: ${renderError}]` : "";
      if (rows.length === 0)
        return { ...base, robots, parse: "failed", reason: `No parseable prices (${mode} fetch)${diag}` };
      return {
        ...base, robots, parse: "ok", available: true, asOf: new Date().toISOString(),
        table: { columns: ["VLSFO", "HSFO", "MGO"], unit: "$/mt", rows },
        note: `SCRAPED (${mode}) — personal use only. Verify against shipandbunker.com.${diag}`,
      };
    } catch (e) {
      return { ...base, robots, parse: "failed", reason: `Fetch error: ${(e as Error).message}` };
    }
  },
};
