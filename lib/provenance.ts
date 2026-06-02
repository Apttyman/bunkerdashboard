// Core data-governance contract. Every metric in the platform is wrapped in a
// Provenance<T> envelope. The UI cannot render a bare number — it must render
// source + timestamp + freshness, or an honest "unavailable" state.

export type SourceTier = 1 | 2 | 3 | 4;

export type Freshness = "live" | "fresh" | "stale" | "old" | "unavailable";

export type UnavailableReason =
  | "Commercial source required"
  | "API key not configured"
  | "Source error"
  | "Scraping disabled"
  | "Not yet integrated";

export interface Provenance<T> {
  value: T | null;
  unit?: string;
  /** Human label, e.g. "EIA v2 — RWTC (WTI Cushing spot)" */
  source: string;
  sourceTier: SourceTier;
  sourceUrl?: string;
  /** ISO timestamp of the data's own reference time (not when we fetched it). */
  asOf: string | null;
  /** ISO timestamp of when this platform retrieved it. */
  fetchedAt: string;
  freshness: Freshness;
  available: boolean;
  /** Present when available === false. */
  reason?: string;
  /** True for computed quantities such as spreads. */
  derived?: boolean;
  /** Provenance chain for derived values (names of input series). */
  inputs?: string[];
}

export interface SeriesPoint {
  t: string; // ISO date
  v: number;
}

export interface ProvenanceSeries {
  points: SeriesPoint[];
  source: string;
  sourceTier: SourceTier;
  sourceUrl?: string;
  asOf: string | null;
  fetchedAt: string;
  freshness: Freshness;
  available: boolean;
  reason?: string;
  unit?: string;
}

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** Freshness thresholds (ms) per data cadence. */
export const CADENCE = {
  intraday: { live: 30 * MIN, fresh: 6 * HOUR, stale: DAY },
  dailySpot: { live: 36 * HOUR, fresh: 7 * DAY, stale: 14 * DAY },
  dailyFx: { live: 36 * HOUR, fresh: 7 * DAY, stale: 14 * DAY },
  weather: { live: HOUR, fresh: 6 * HOUR, stale: DAY },
  monthly: { live: 45 * DAY, fresh: 75 * DAY, stale: 120 * DAY },
} as const;

export type Cadence = keyof typeof CADENCE;

export function computeFreshness(
  asOf: string | null,
  cadence: Cadence = "dailySpot",
): Freshness {
  if (!asOf) return "unavailable";
  const age = Date.now() - new Date(asOf).getTime();
  if (Number.isNaN(age)) return "unavailable";
  const t = CADENCE[cadence];
  if (age <= t.live) return "live";
  if (age <= t.fresh) return "fresh";
  if (age <= t.stale) return "stale";
  return "old";
}

export function nowIso(): string {
  return new Date().toISOString();
}

/** Build an honest "unavailable" envelope — used when a source can't legally or
 *  technically be acquired. Never substitute an estimate. */
export function unavailable<T>(opts: {
  source: string;
  sourceTier: SourceTier;
  reason: string;
  sourceUrl?: string;
  unit?: string;
}): Provenance<T> {
  return {
    value: null,
    unit: opts.unit,
    source: opts.source,
    sourceTier: opts.sourceTier,
    sourceUrl: opts.sourceUrl,
    asOf: null,
    fetchedAt: nowIso(),
    freshness: "unavailable",
    available: false,
    reason: opts.reason,
  };
}

export function ok<T>(opts: {
  value: T;
  source: string;
  sourceTier: SourceTier;
  asOf: string | null;
  cadence?: Cadence;
  sourceUrl?: string;
  unit?: string;
  derived?: boolean;
  inputs?: string[];
}): Provenance<T> {
  return {
    value: opts.value,
    unit: opts.unit,
    source: opts.source,
    sourceTier: opts.sourceTier,
    sourceUrl: opts.sourceUrl,
    asOf: opts.asOf,
    fetchedAt: nowIso(),
    freshness: computeFreshness(opts.asOf, opts.cadence),
    available: true,
    derived: opts.derived,
    inputs: opts.inputs,
  };
}
