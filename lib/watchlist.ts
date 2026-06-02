// Watchlist persistence (Supabase). Device-scoped until auth is wired. All ops
// are best-effort and degrade honestly when Supabase is unconfigured.
import { getSupabase } from "./supabase";

export interface WatchRow {
  device: string;
  symbol: string;
  note: string;
  created_at?: string;
}

export async function listWatch(device: string): Promise<WatchRow[]> {
  const sb = getSupabase();
  if (!sb || !device) return [];
  try {
    const { data, error } = await sb
      .from("watchlist")
      .select("device,symbol,note,created_at")
      .eq("device", device)
      .order("created_at", { ascending: true });
    if (error || !data) return [];
    return data as WatchRow[];
  } catch {
    return [];
  }
}

export async function addWatch(device: string, symbol: string, note: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb || !device || !symbol) return false;
  try {
    const { error } = await sb
      .from("watchlist")
      .upsert({ device, symbol, note }, { onConflict: "device,symbol" });
    return !error;
  } catch {
    return false;
  }
}

export async function removeWatch(device: string, symbol: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb || !device || !symbol) return false;
  try {
    const { error } = await sb.from("watchlist").delete().eq("device", device).eq("symbol", symbol);
    return !error;
  } catch {
    return false;
  }
}
