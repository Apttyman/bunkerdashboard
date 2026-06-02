// Tier-3 scraping registry + access gating. Scraped data is PERSONAL USE only and
// is gated behind SCRAPE_ACCESS_TOKEN so the public site does not redistribute it.
import { shipandbunker } from "./connectors/shipandbunker";
import { bunkerindex } from "./connectors/bunkerindex";
import { baltic } from "./connectors/baltic";
import { reports } from "./connectors/reports";
import { scrapingEnabled } from "./engine";
import type { ScrapeConnector, ScrapeResult } from "./types";

export const CONNECTORS: ScrapeConnector[] = [shipandbunker, bunkerindex, baltic, reports];

export function connectorById(id: string): ScrapeConnector | undefined {
  return CONNECTORS.find((c) => c.id === id);
}

/** Gate: a token must be configured AND supplied. Without a configured token,
 *  scraping output is never served (keeps it from being public). */
export function accessOk(token: string | null): boolean {
  const want = process.env.SCRAPE_ACCESS_TOKEN;
  if (!want || want.trim() === "") return false;
  return token === want;
}

export function scrapeConfigured(): boolean {
  return scrapingEnabled() && Boolean(process.env.SCRAPE_ACCESS_TOKEN?.trim());
}

export async function runScrape(id: string): Promise<ScrapeResult | null> {
  const c = connectorById(id);
  if (!c) return null;
  return c.scrape();
}

export function connectorStatuses() {
  return CONNECTORS.map((c) => ({
    id: c.id,
    name: c.name,
    sourceUrl: c.sourceUrl,
    legalNote: c.legalNote,
    enabled: c.enabled(),
  }));
}
