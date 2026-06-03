import { NextResponse } from "next/server";
import { runScrape, accessOk, scrapeConfigured, connectorStatuses, CONNECTORS } from "@/lib/scrape";
import { scrapingEnabled } from "@/lib/scrape/engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Headless-browser renders can take time; allow up to 60s on the scrape function.
export const maxDuration = 60;

function token(req: Request): string | null {
  return (
    req.headers.get("x-scrape-token") ??
    new URL(req.url).searchParams.get("token")
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const source = url.searchParams.get("source");

  // Status probe (no data) is always allowed so the UI can show config state.
  if (url.searchParams.get("status") === "1") {
    return NextResponse.json({
      enabled: scrapingEnabled(),
      configured: scrapeConfigured(),
      connectors: connectorStatuses(),
    });
  }

  // Data requires the gate.
  if (!scrapingEnabled())
    return NextResponse.json({ error: "Scraping disabled (set SCRAPING_ENABLED=true)" }, { status: 403 });
  if (!scrapeConfigured())
    return NextResponse.json({ error: "Set SCRAPE_ACCESS_TOKEN to enable gated personal access" }, { status: 403 });
  if (!accessOk(token(req)))
    return NextResponse.json({ error: "Invalid or missing access token" }, { status: 401 });

  if (source) {
    const result = await runScrape(source);
    if (!result) return NextResponse.json({ error: "Unknown source" }, { status: 404 });
    return NextResponse.json({ result });
  }

  // No source ⇒ run all enabled connectors.
  const results = await Promise.all(CONNECTORS.map((c) => c.scrape()));
  return NextResponse.json({ results });
}
