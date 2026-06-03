// News connector — latest market-news headlines + links from Ship & Bunker's
// news index (server-rendered, robots-allowed, same host we already use).
// Text/links only (no licensed price feeds) — the lowest-risk source.
import { politeFetch, robotsState, scrapingEnabled } from "../engine";
import type { ScrapeConnector, ScrapeResult, ScrapeRow } from "../types";

const URL_ = "https://shipandbunker.com/news";
const ORIGIN = "https://shipandbunker.com";

function parse(html: string, origin: string): ScrapeRow[] {
  const rows: ScrapeRow[] = [];
  const seen = new Set<string>();
  // Extract anchor text + href pairs that look like news/article links.
  const re = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && rows.length < 12) {
    const href = m[1];
    const title = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (title.length < 25) continue; // skip nav/short links
    if (!/\/news\//i.test(href)) continue; // article links live under /news/
    const link = href.startsWith("http") ? href : origin + href;
    if (seen.has(title)) continue;
    seen.add(title);
    rows.push({ key: title, values: [], link });
  }
  return rows;
}

export const reports: ScrapeConnector = {
  id: "reports",
  name: "Ship & Bunker — latest news",
  sourceUrl: URL_,
  targetPath: "/news",
  legalNote: "Public free news (headlines + links). Lowest risk; still personal use.",
  enabled: () => scrapingEnabled() && process.env.SCRAPE_REPORTS !== "false",
  async scrape(): Promise<ScrapeResult> {
    const base: ScrapeResult = {
      id: "reports", name: this.name, sourceUrl: URL_, fetchedAt: new Date().toISOString(),
      asOf: null, available: false, robots: "unknown", parse: "empty", table: null,
    };
    if (!this.enabled()) return { ...base, reason: "Scraping disabled" };
    const robots = await robotsState(URL_);
    if (robots !== "allowed") return { ...base, robots, reason: `robots.txt: ${robots} — not scraping` };
    try {
      const html = await politeFetch(URL_, 3600);
      const rows = parse(html, ORIGIN);
      if (rows.length === 0) return { ...base, robots, parse: "failed", reason: "No news links found (parser needs tuning)" };
      return {
        ...base, robots, parse: "ok", available: true, asOf: new Date().toISOString(),
        table: { columns: ["Latest news"], unit: "", rows },
        note: "SCRAPED headlines — open the source for the full article.",
      };
    } catch (e) {
      return { ...base, robots, parse: "failed", reason: `Fetch error: ${(e as Error).message}` };
    }
  },
};
