// Source registry — single source of truth for the source-health panel.
import { eia } from "./eia";
import { fred } from "./fred";
import { stooq } from "./stooq";
import { ecb } from "./ecb";
import { alphavantage } from "./alphavantage";
import { openweather } from "./openweather";
import { openmeteo } from "./openmeteo";
import { commercialAdapters } from "./commercial";
import { connectorStatuses } from "@/lib/scrape";
import { scrapeConfigured } from "@/lib/scrape";

export interface SourceStatus {
  id: string;
  name: string;
  tier: 1 | 2 | 3 | 4;
  requiresKey: boolean;
  configured: boolean;
  enabled: boolean;
  note?: string;
}

export function sourceStatuses(): SourceStatus[] {
  const tier1 = [eia, fred, stooq, ecb, openmeteo, alphavantage, openweather].map((a) => ({
    id: a.id,
    name: a.name,
    tier: 1 as const,
    requiresKey: a.requiresKey,
    configured: a.configured(),
    enabled: a.configured(),
    note: a.requiresKey ? (a.configured() ? "Live" : "Add API key to enable") : "Keyless — always live",
  }));

  const gated = scrapeConfigured();
  const tier3 = connectorStatuses().map((c) => ({
    id: c.id,
    name: c.name,
    tier: 3 as const,
    requiresKey: true,
    configured: gated,
    enabled: c.enabled && gated,
    note: c.enabled ? (gated ? "Gated personal-use scraping live" : "Set SCRAPE_ACCESS_TOKEN to gate & enable") : "Disabled — " + c.legalNote.split(".")[0],
  }));

  const tier4 = Object.values(commercialAdapters).map((c) => ({
    id: c.id,
    name: c.name,
    tier: 4 as const,
    requiresKey: true,
    configured: c.configured(),
    enabled: false,
    note: c.configured() ? "Credentials present — implement fetch() to activate" : "Commercial source required",
  }));

  return [...tier1, ...tier3, ...tier4];
}
