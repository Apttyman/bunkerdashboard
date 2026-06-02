// Tier-3 controlled scraping — shared types. Output is normalized into a simple
// table so the gated UI can render any source uniformly, always with provenance
// and an honest availability/parse state (never fabricated).

export type RobotsState = "allowed" | "disallowed" | "unknown";
export type ParseState = "ok" | "failed" | "empty";

export interface ScrapeRow {
  key: string; // e.g. port name, route, index name, or report title
  values: (number | null)[];
  link?: string; // optional source link (e.g. report article)
  meta?: string; // optional non-numeric context (e.g. date)
}

export interface ScrapeTable {
  columns: string[]; // e.g. ["VLSFO", "HSFO", "MGO"]
  unit: string; // e.g. "$/mt"
  rows: ScrapeRow[];
}

export interface ScrapeResult {
  id: string;
  name: string;
  sourceUrl: string;
  fetchedAt: string;
  asOf: string | null;
  available: boolean;
  reason?: string;
  robots: RobotsState;
  parse: ParseState;
  table: ScrapeTable | null;
  note?: string;
}

export interface ScrapeConnector {
  id: string;
  name: string;
  sourceUrl: string;
  /** Path used for robots.txt evaluation, e.g. "/prices". */
  targetPath: string;
  /** ToS/legal note shown in the UI and health panel. */
  legalNote: string;
  enabled(): boolean;
  scrape(): Promise<ScrapeResult>;
}
