// Small fetch helper with timeout + retry/backoff. Used by Tier-1 adapters.
// Keeps network concerns out of the adapters themselves.

export interface FetchOpts {
  timeoutMs?: number;
  retries?: number;
  revalidate?: number; // Next.js ISR cache seconds
  headers?: Record<string, string>;
}

export async function fetchText(url: string, opts: FetchOpts = {}): Promise<string> {
  const { timeoutMs = 10_000, retries = 2, revalidate = 1800, headers } = opts;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: { "User-Agent": "BunkerDesk/0.1 (intelligence dashboard)", ...headers },
        next: { revalidate },
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 2 ** attempt * 500));
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("fetch failed");
}

export async function fetchJson<T = unknown>(url: string, opts: FetchOpts = {}): Promise<T> {
  return JSON.parse(await fetchText(url, opts)) as T;
}
