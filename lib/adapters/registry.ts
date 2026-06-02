// Source registry — single source of truth for the source-health panel.
import { eia } from "./eia";
import { fred } from "./fred";
import { stooq } from "./stooq";
import { ecb } from "./ecb";
import { alphavantage } from "./alphavantage";
import { openweather } from "./openweather";
import { commercialAdapters } from "./commercial";
import { scrapeConnectors, scrapingEnabled } from "./scraping";

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
  const tier1 = [eia, fred, stooq, ecb, alphavantage, openweather].map((a) => ({
    id: a.id,
    name: a.name,
    tier: 1 as const,
    requiresKey: a.requiresKey,
    configured: a.configured(),
    enabled: a.configured(),
    note: a.requiresKey ? (a.configured() ? "Live" : "Add API key to enable") : "Keyless — always live",
  }));

  const tier3 = scrapeConnectors.map((c) => ({
    id: c.id,
    name: c.name,
    tier: 3 as const,
    requiresKey: false,
    configured: scrapingEnabled(),
    enabled: c.enabled() && scrapingEnabled(),
    note: "Disabled by default — " + c.legalGate.split(".")[0],
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
