// Bunker Index connector — BIX regional indices / port prices.
// Heuristic parser with validation; fails honestly.
import { politeFetch, robotsState, htmlToText, scrapingEnabled } from "../engine";
import type { ScrapeConnector, ScrapeResult, ScrapeRow } from "../types";

const URL_ = "https://www.bunkerindex.com/";
const KEYS = ["BIX", "IFO380", "IFO180", "MGO", "MDO", "Rotterdam", "Singapore", "Fujairah", "Houston"];
const RANGE = [50, 2000] as const;

function parse(text: string): ScrapeRow[] {
  const lines = text.split("\n");
  const rows: ScrapeRow[] = [];
  for (const k of KEYS) {
    const line = lines.find((l) => new RegExp(`\\b${k}\\b`, "i").test(l));
    if (!line) continue;
    const num = (line.match(/\d[\d,]*\.?\d*/g) ?? [])
      .map((s) => Number(s.replace(/,/g, "")))
      .find((n) => n >= RANGE[0] && n <= RANGE[1]);
    if (num == null) continue;
    rows.push({ key: k, values: [num] });
  }
  return rows;
}

export const bunkerindex: ScrapeConnector = {
  id: "bunkerindex",
  name: "Bunker Index — indices & port prices",
  sourceUrl: URL_,
  targetPath: "/",
  legalNote: "ToS restricts redistribution. Personal use only.",
  enabled: () => scrapingEnabled() && process.env.SCRAPE_BUNKERINDEX !== "false",
  async scrape(): Promise<ScrapeResult> {
    const base: ScrapeResult = {
      id: "bunkerindex", name: this.name, sourceUrl: URL_, fetchedAt: new Date().toISOString(),
      asOf: null, available: false, robots: "unknown", parse: "empty", table: null,
    };
    if (!this.enabled()) return { ...base, reason: "Scraping disabled" };
    const robots = await robotsState(URL_);
    if (robots !== "allowed") return { ...base, robots, reason: `robots.txt: ${robots} — not scraping` };
    try {
      const rows = parse(htmlToText(await politeFetch(URL_, 1800)));
      if (rows.length === 0) return { ...base, robots, parse: "failed", reason: "No parseable values (parser needs tuning)" };
      return {
        ...base, robots, parse: "ok", available: true, asOf: new Date().toISOString(),
        table: { columns: ["Value"], unit: "index / $/mt", rows },
        note: "SCRAPED — personal use only.",
      };
    } catch (e) {
      return { ...base, robots, parse: "failed", reason: `Fetch error: ${(e as Error).message}` };
    }
  },
};
