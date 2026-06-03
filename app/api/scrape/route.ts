import { NextResponse } from "next/server";
import { runScrape, scrapeConfigured, connectorStatuses, CONNECTORS } from "@/lib/scrape";
import { scrapingEnabled } from "@/lib/scrape/engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Headless-browser renders can take time; allow up to 60s on the scrape function.
export const maxDuration = 60;

// Auth is enforced app-wide by middleware (cookie gate), so this route only needs
// to check that scraping is switched on.
export async function GET(req: Request) {
  const url = new URL(req.url);

  if (url.searchParams.get("status") === "1") {
    return NextResponse.json({
      enabled: scrapingEnabled(),
      configured: scrapeConfigured(),
      connectors: connectorStatuses(),
    });
  }

  if (!scrapingEnabled())
    return NextResponse.json({ error: "Scraping disabled (set SCRAPING_ENABLED=true)" }, { status: 403 });

  const source = url.searchParams.get("source");
  if (source) {
    const result = await runScrape(source);
    if (!result) return NextResponse.json({ error: "Unknown source" }, { status: 404 });
    return NextResponse.json({ result });
  }

  const results = await Promise.all(CONNECTORS.map((c) => c.scrape()));
  return NextResponse.json({ results });
}
