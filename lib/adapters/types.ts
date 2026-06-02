import type { Provenance, ProvenanceSeries, SourceTier } from "@/lib/provenance";

/** Tier-1/Tier-4 adapters resolve a single latest value. */
export interface ValueAdapter {
  id: string;
  name: string;
  tier: SourceTier;
  requiresKey: boolean;
  envKey?: string;
  configured(): boolean;
  /** Returns a provenance-wrapped latest value (or honest unavailable). */
  latest(symbol: string): Promise<Provenance<number>>;
}

/** Adapters that can also return a historical series for sparklines. */
export interface SeriesAdapter extends ValueAdapter {
  series(symbol: string, days?: number): Promise<ProvenanceSeries>;
}

/** Tier-3 controlled scraping interface — isolated from the UI, disabled by default. */
export interface ScrapeAdapter {
  id: string;
  name: string;
  tier: 3;
  /** robots.txt + ToS gate that must be cleared before enabling. */
  legalGate: string;
  enabled(): boolean;
  healthCheck(): Promise<{ ok: boolean; detail: string }>;
  validateParse(raw: string): { ok: boolean; detail: string };
}

/** Tier-4 commercial adapter interface. Implement fetch() with credentials and
 *  the UI lights up unchanged. */
export interface CommercialAdapter<T = number> {
  id: string;
  name: string;
  tier: 4;
  vendor: string;
  envKey: string;
  configured(): boolean;
  fetch(symbol: string): Promise<Provenance<T>>;
}

export function envConfigured(key: string): boolean {
  const v = process.env[key];
  return typeof v === "string" && v.trim().length > 0;
}
