// Supabase client factory. Reads public env (NEXT_PUBLIC_*) so the same config
// works in server route handlers and (if ever needed) the browser. Returns null
// when unconfigured — every caller degrades honestly rather than throwing.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // publishable key
  if (!url || !key) {
    cached = null;
    return null;
  }
  cached = createClient(url, key, {
    auth: { persistSession: false },
    global: { headers: { "x-application": "bunker-desk" } },
  });
  return cached;
}

export function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
