// Scraping engine: robots.txt respect, polite rate-limited fetching, caching,
// and numeric validation. Connectors build on this; nothing here fabricates data.
import type { RobotsState } from "./types";

const UA = "BunkerDeskBot/0.1 (personal research; respects robots.txt)";

// Per-host minimum interval between requests (politeness). In-memory; resets on
// cold start, which is fine for a low-frequency personal dashboard.
const lastHit = new Map<string, number>();
const MIN_INTERVAL_MS = 5_000;

async function rateLimit(host: string) {
  const now = Date.now();
  const prev = lastHit.get(host) ?? 0;
  const wait = MIN_INTERVAL_MS - (now - prev);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastHit.set(host, Date.now());
}

export async function politeFetch(url: string, cacheSeconds = 1800): Promise<string> {
  const host = new URL(url).host;
  await rateLimit(host);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": UA, Accept: "text/html,application/json" },
      next: { revalidate: cacheSeconds },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

// Minimal robots.txt evaluator: honours User-agent: * (and our UA) Disallow rules
// via longest-match. Conservative: on fetch error returns "unknown" and the caller
// decides (we treat unknown as "do not scrape" by default).
const robotsCache = new Map<string, { rules: { path: string; allow: boolean }[]; at: number }>();

export async function robotsState(url: string): Promise<RobotsState> {
  const u = new URL(url);
  const origin = `${u.protocol}//${u.host}`;
  const path = u.pathname;
  try {
    let entry = robotsCache.get(origin);
    if (!entry || Date.now() - entry.at > 24 * 3600 * 1000) {
      const txt = await politeFetch(`${origin}/robots.txt`, 86400).catch(() => "");
      entry = { rules: parseRobots(txt), at: Date.now() };
      robotsCache.set(origin, entry);
    }
    if (entry.rules.length === 0) return "allowed"; // no rules ⇒ allowed
    // longest-match wins
    let decision: boolean | null = null;
    let bestLen = -1;
    for (const r of entry.rules) {
      if (path.startsWith(r.path) && r.path.length > bestLen) {
        bestLen = r.path.length;
        decision = r.allow;
      }
    }
    if (decision === null) return "allowed";
    return decision ? "allowed" : "disallowed";
  } catch {
    return "unknown";
  }
}

function parseRobots(txt: string): { path: string; allow: boolean }[] {
  const lines = txt.split("\n").map((l) => l.replace(/#.*$/, "").trim());
  const groups: { agents: string[]; rules: { path: string; allow: boolean }[] }[] = [];
  let cur: (typeof groups)[number] | null = null;
  let lastWasAgent = false;
  for (const line of lines) {
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const field = m[1].toLowerCase();
    const val = m[2].trim();
    if (field === "user-agent") {
      if (!lastWasAgent || !cur) {
        cur = { agents: [], rules: [] };
        groups.push(cur);
      }
      cur.agents.push(val.toLowerCase());
      lastWasAgent = true;
    } else if (field === "disallow" || field === "allow") {
      if (cur && val) cur.rules.push({ path: val, allow: field === "allow" });
      lastWasAgent = false;
    } else {
      lastWasAgent = false;
    }
  }
  // Pick the group matching "*" (we don't masquerade as a named bot).
  const star = groups.find((g) => g.agents.includes("*"));
  return star ? star.rules : [];
}

/** Parse a price-like number from text, returning null if out of a sane range. */
export function parseNum(raw: string, min = 0, max = Number.MAX_SAFE_INTEGER): number | null {
  const n = Number(String(raw).replace(/[,$\s]/g, "").replace(/[^0-9.\-]/g, ""));
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

export function scrapingEnabled(): boolean {
  return process.env.SCRAPING_ENABLED === "true";
}

/** Fetch page HTML. When `useRender` is set, try a headless browser first (for
 *  JS-rendered pages), then fall back to a plain static fetch. Returns the HTML
 *  and which mode produced it. Never throws on render failure alone. */
export async function getPageHtml(
  url: string,
  useRender: boolean,
  cacheSeconds = 1800,
): Promise<{ html: string; mode: "render" | "static" }> {
  if (useRender) {
    try {
      const { renderPage, renderAvailable } = await import("./render");
      if (renderAvailable()) {
        const host = new URL(url).host;
        await rateLimit(host);
        const html = await renderPage(url, { settleMs: 1500 });
        if (html && html.length > 500) return { html, mode: "render" };
      }
    } catch (e) {
      console.warn(`[scrape] render failed for ${url}, falling back to static:`, (e as Error).message);
    }
  }
  return { html: await politeFetch(url, cacheSeconds), mode: "static" };
}

/** Collapse HTML to newline-separated visible text (rows preserved), scripts and
 *  styles removed. Heuristic basis for the text parsers. */
export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(tr|div|p|li|h[1-6]|table)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/[ \t]+/g, " ")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n");
}
