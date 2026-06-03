// Ship & Bunker connector — VLSFO / HSFO (IFO380) / MGO by port.
// Strategy (no headless browser needed): the /prices index is server-rendered for
// VLSFO and links to each port's own page; those per-port pages are fully
// server-rendered with ALL grades. So we read VLSFO + the port links from
// /prices, then fetch each port page statically and parse all three grades.
// Ports are canonicalised (Ship & Bunker lists Panama as Balboa/Cristóbal) so
// they line up with the dashboard's port list. Fails honestly; never fabricates.
import { politeFetch, robotsState, htmlToText, scrapingEnabled } from "../engine";
import type { ScrapeConnector, ScrapeResult, ScrapeRow } from "../types";

const URL_ = "https://shipandbunker.com/prices";
const ORIGIN = "https://shipandbunker.com";

// canonical name (matches dashboard ports) → source aliases on Ship & Bunker.
const PORT_SPECS: { name: string; aliases: string[] }[] = [
  { name: "Singapore", aliases: ["Singapore"] },
  { name: "Rotterdam", aliases: ["Rotterdam"] },
  { name: "Fujairah", aliases: ["Fujairah"] },
  { name: "Houston", aliases: ["Houston"] },
  { name: "Panama", aliases: ["Balboa", "Cristobal", "Cristóbal", "Panama"] },
  { name: "Gibraltar", aliases: ["Gibraltar"] },
  { name: "Zhoushan", aliases: ["Zhoushan"] },
  { name: "Hong Kong", aliases: ["Hong Kong"] },
  { name: "Busan", aliases: ["Busan"] },
  { name: "Antwerp", aliases: ["Antwerp"] },
  { name: "Los Angeles", aliases: ["Los Angeles"] },
];

// Sane bunker ranges ($/mt) to reject mis-parsed numbers: [VLSFO, HSFO, MGO].
const RANGES: [number, number][] = [[200, 1400], [150, 1200], [300, 2000]];

const allNums = (s: string) => (s.match(/\d[\d,]*\.?\d*/g) ?? []).map((n) => Number(n.replace(/,/g, "")));

// First in-range number following a grade label (port detail page layout).
function priceAfter(text: string, labelRe: RegExp, lo: number, hi: number): number | null {
  const m = labelRe.exec(text);
  if (!m) return null;
  return allNums(text.slice(m.index, m.index + 90)).find((n) => n >= lo && n <= hi) ?? null;
}

function parsePortPage(text: string): (number | null)[] {
  return [
    priceAfter(text, /\bvlsfo\b/i, RANGES[0][0], RANGES[0][1]),
    priceAfter(text, /\b(ifo\s?380|hsfo)\b/i, RANGES[1][0], RANGES[1][1]),
    priceAfter(text, /\bmgo\b/i, RANGES[2][0], RANGES[2][1]),
  ];
}

// VLSFO from the /prices index (one number per port row), keyed by canonical name.
function parseIndexVlsfo(text: string): Map<string, number> {
  const out = new Map<string, number>();
  const lines = text.split("\n");
  for (const spec of PORT_SPECS) {
    const idx = lines.findIndex((l) => spec.aliases.some((a) => l.toLowerCase().includes(a.toLowerCase())));
    if (idx === -1) continue;
    const n = allNums(lines.slice(idx, idx + 2).join(" ")).find((x) => x >= RANGES[0][0] && x <= RANGES[0][1]);
    if (n != null) out.set(spec.name, n);
  }
  return out;
}

// Discover each port's detail-page URL from the index links (keyed by canonical name).
function portLinks(rawHtml: string): Map<string, string> {
  const out = new Map<string, string>();
  const re = /<a[^>]+href="(\/prices\/[^"#]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(rawHtml))) {
    const href = m[1];
    const text = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
    for (const spec of PORT_SPECS) {
      if (!out.has(spec.name) && spec.aliases.some((a) => text === a.toLowerCase())) out.set(spec.name, ORIGIN + href);
    }
  }
  return out;
}

export const shipandbunker: ScrapeConnector = {
  id: "shipandbunker",
  name: "Ship & Bunker — bunker prices by port",
  sourceUrl: URL_,
  targetPath: "/prices",
  legalNote: "ToS restricts automated collection & redistribution. Personal use only; do not republish.",
  enabled: () => scrapingEnabled() && process.env.SCRAPE_SHIPANDBUNKER !== "false",
  async scrape(): Promise<ScrapeResult> {
    const base: ScrapeResult = {
      id: "shipandbunker", name: this.name, sourceUrl: URL_, fetchedAt: new Date().toISOString(),
      asOf: null, available: false, robots: "unknown", parse: "empty", table: null,
    };
    if (!this.enabled()) return { ...base, reason: "Scraping disabled" };
    const robots = await robotsState(URL_);
    if (robots !== "allowed") return { ...base, robots, reason: `robots.txt: ${robots} — not scraping` };
    try {
      const indexHtml = await politeFetch(URL_, 1800);
      const vlsfoIndex = parseIndexVlsfo(htmlToText(indexHtml));
      const links = portLinks(indexHtml);

      // Fetch each discovered port page (static, server-rendered, all grades).
      const perPort = await Promise.all(
        [...links].map(async ([port, url]) => {
          try {
            return [port, parsePortPage(htmlToText(await politeFetch(url, 1800)))] as const;
          } catch {
            return [port, null] as const;
          }
        }),
      );

      // Merge: per-port page grades win; index VLSFO fills any gap.
      const map = new Map<string, (number | null)[]>();
      for (const [port, vals] of perPort) {
        if (vals && vals.some((v) => v != null)) map.set(port, vals);
      }
      for (const [port, v] of vlsfoIndex) {
        const ex = map.get(port) ?? [null, null, null];
        if (ex[0] == null) ex[0] = v;
        map.set(port, ex);
      }

      const rows: ScrapeRow[] = PORT_SPECS.filter((s) => map.has(s.name)).map((s) => ({ key: s.name, values: map.get(s.name)! }));
      if (rows.length === 0)
        return { ...base, robots, parse: "failed", reason: "No parseable prices (layout may have changed)" };

      const gradesFound = rows.some((r) => r.values[1] != null || r.values[2] != null);
      return {
        ...base, robots, parse: "ok", available: true, asOf: new Date().toISOString(),
        table: { columns: ["VLSFO", "HSFO", "MGO"], unit: "$/mt", rows },
        note: `SCRAPED (static, per-port) — personal use only. Verify against shipandbunker.com.${gradesFound ? "" : " HSFO/MGO not found on port pages."}`,
      };
    } catch (e) {
      return { ...base, robots, parse: "failed", reason: `Fetch error: ${(e as Error).message}` };
    }
  },
};

// One-time diagnostic: returns exactly what the live scraper sees so the parser
// can be tuned against the real HTML. Gated app-wide; personal use only.
export async function debugShipAndBunker() {
  const out: Record<string, unknown> = {};
  try {
    const raw = await politeFetch(URL_, 0);
    const text = htmlToText(raw);
    out.indexTextSample = text.slice(0, 3500);
    const ri = raw.toLowerCase().indexOf("rotterdam");
    out.rawAroundRotterdam = ri >= 0 ? raw.slice(Math.max(0, ri - 400), ri + 250) : "rotterdam not in raw html";
    const links = portLinks(raw);
    out.linksDiscovered = [...links];
    // Also dump every /prices/ anchor (href + text) so we can see the real link format.
    const anchors: { href: string; text: string }[] = [];
    const re = /<a[^>]+href="(\/prices\/[^"#]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(raw)) && anchors.length < 40) {
      anchors.push({ href: m[1], text: m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() });
    }
    out.allPriceAnchors = anchors;
    const first = [...links][0];
    if (first) {
      const [name, url] = first;
      const praw = await politeFetch(url, 0);
      const ptext = htmlToText(praw);
      out.portPage = { name, url, parsed: parsePortPage(ptext), textSample: ptext.slice(0, 3500) };
    } else {
      out.portPage = "no port links discovered";
    }
  } catch (e) {
    out.error = (e as Error).message;
  }
  return out;
}
