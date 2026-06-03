// Baltic Exchange connector — BDI / BDTI / BCTI headline indices.
// NOTE: Baltic indices are licensed IP — highest legal risk. Personal use only;
// never redistribute. Heuristic parser with validation; fails honestly.
import { getPageHtml, robotsState, htmlToText, scrapingEnabled } from "../engine";
import type { ScrapeConnector, ScrapeResult, ScrapeRow } from "../types";

const URL_ = "https://www.balticexchange.com/en/index.html";
const INDICES = ["BDI", "BDTI", "BCTI", "BPI", "BCI", "BSI"];
const RANGE = [100, 12000] as const;

function parse(text: string): ScrapeRow[] {
  const lines = text.split("\n");
  const rows: ScrapeRow[] = [];
  for (const k of INDICES) {
    const idx = lines.findIndex((l) => new RegExp(`\\b${k}\\b`).test(l));
    if (idx === -1) continue;
    const blob = lines.slice(idx, idx + 2).join(" ");
    const num = (blob.match(/\d[\d,]*\.?\d*/g) ?? [])
      .map((s) => Number(s.replace(/,/g, "")))
      .find((n) => n >= RANGE[0] && n <= RANGE[1]);
    if (num == null) continue;
    rows.push({ key: k, values: [num] });
  }
  return rows;
}

export const baltic: ScrapeConnector = {
  id: "baltic",
  name: "Baltic Exchange — headline indices",
  sourceUrl: URL_,
  targetPath: "/en/index.html",
  legalNote: "Baltic indices are LICENSED IP — highest risk. Personal use only; never redistribute.",
  enabled: () => scrapingEnabled() && process.env.SCRAPE_BALTIC !== "false",
  async scrape(): Promise<ScrapeResult> {
    const base: ScrapeResult = {
      id: "baltic", name: this.name, sourceUrl: URL_, fetchedAt: new Date().toISOString(),
      asOf: null, available: false, robots: "unknown", parse: "empty", table: null,
    };
    if (!this.enabled()) return { ...base, reason: "Scraping disabled" };
    const robots = await robotsState(URL_);
    if (robots !== "allowed") return { ...base, robots, reason: `robots.txt: ${robots} — not scraping` };
    try {
      const { html, mode, renderError } = await getPageHtml(URL_, true, 3600);
      const rows = parse(htmlToText(html));
      const diag = renderError ? ` [render→static: ${renderError}]` : "";
      if (rows.length === 0) return { ...base, robots, parse: "failed", reason: `No parseable indices (${mode} fetch)${diag}` };
      return {
        ...base, robots, parse: "ok", available: true, asOf: new Date().toISOString(),
        table: { columns: ["Index level"], unit: "points", rows },
        note: `SCRAPED (${mode}) licensed data — personal use only. Do NOT redistribute.`,
      };
    } catch (e) {
      return { ...base, robots, parse: "failed", reason: `Fetch error: ${(e as Error).message}` };
    }
  },
};
