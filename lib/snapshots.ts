// Provenance audit trail backed by Supabase. We persist every provenance-stamped
// metric we fetch so the platform keeps an immutable, timestamped record of what
// it showed and where it came from — and can serve persisted history even when a
// live source is down. All operations are best-effort: if Supabase is
// unconfigured or RLS blocks the call, we degrade honestly and never throw into
// the request path.
import { getSupabase } from "./supabase";
import type { Provenance } from "./provenance";

export interface SnapshotRow {
  symbol: string;
  value: number | null;
  unit: string | null;
  source: string;
  source_tier: number;
  as_of: string | null;
  fetched_at: string;
  freshness: string;
  available: boolean;
  derived: boolean;
}

export function toRow(symbol: string, p: Provenance<number>): SnapshotRow {
  return {
    symbol,
    value: p.value,
    unit: p.unit ?? null,
    source: p.source,
    source_tier: p.sourceTier,
    as_of: p.asOf,
    fetched_at: p.fetchedAt,
    freshness: p.freshness,
    available: p.available,
    derived: Boolean(p.derived),
  };
}

/** Fire-and-forget: persist a batch of snapshots. Returns count written, or -1
 *  if unavailable. Never throws. */
export async function recordSnapshots(rows: SnapshotRow[]): Promise<number> {
  const sb = getSupabase();
  if (!sb || rows.length === 0) return -1;
  try {
    const { error } = await sb.from("metric_snapshots").insert(rows);
    if (error) return -1;
    return rows.length;
  } catch {
    return -1;
  }
}

/** Read recent persisted history for a symbol (newest first). */
export async function getHistory(symbol: string, limit = 60): Promise<SnapshotRow[]> {
  const sb = getSupabase();
  if (!sb) return [];
  try {
    const { data, error } = await sb
      .from("metric_snapshots")
      .select("*")
      .eq("symbol", symbol)
      .order("fetched_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data as SnapshotRow[];
  } catch {
    return [];
  }
}

/** Connectivity + schema probe for the source-health panel. */
export async function snapshotStoreStatus(): Promise<{
  configured: boolean;
  reachable: boolean;
  rows: number | null;
  detail: string;
}> {
  const sb = getSupabase();
  if (!sb) return { configured: false, reachable: false, rows: null, detail: "Supabase env not set" };
  try {
    const { count, error } = await sb
      .from("metric_snapshots")
      .select("*", { count: "exact", head: true });
    if (error) {
      return { configured: true, reachable: true, rows: null, detail: `Table not ready: ${error.message}` };
    }
    return { configured: true, reachable: true, rows: count ?? 0, detail: "Connected" };
  } catch (e) {
    return { configured: true, reachable: false, rows: null, detail: `Unreachable: ${(e as Error).message}` };
  }
}
