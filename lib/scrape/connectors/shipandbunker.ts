// Ship & Bunker connector — VLSFO / HSFO (IFO380) / MGO by port.
//
// shipandbunker.com/prices is JS-rendered: only the "Global 4 Ports" VLSFO group
// is in the static HTML; the full 20-port table and the HSFO/MGO grades load via
// JavaScript. So we RENDER the page with headless Chromium, then parse the
// fully-rendered DOM (which contains all grade tables). We also fetch each
// linked port page (server-rendered, all grades) to fill any gaps. Headless
// rendering requires Node 22 on Vercel (the @sparticuz/chromium libs match
// AL2023). Falls back to static (VLSFO-only) and reports that honestly.
import { getPageHtml, politeFetch, robotsState, htmlToText, scrapingEnabled } from "../engine";
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
  { name: "Los Angeles", aliases: ["Los Angeles", "Long Beach"] },
];

// Sane bunker ranges ($/mt) to reject mis-parsed numbers: [VLSFO, HSFO, MGO].
const RANGES: [number, number][] = [[200, 1400], [150, 1200], [300, 2000]];

const allNums = (s: string) => (s.match(/\d[\d,]*\.?\d*/g) ?? []).map((n) => Number(n.replace(/,/g, "")));
const matchAlias = (line: string, aliases: string[]) => aliases.some((a) => line.toLowerCase().includes(a.toLowerCase()));

const GRADE_MARKERS = [
  { g: 0, re: /\bvlsfo\b/i },
  { g: 1, re: /\b(ifo\s?380|hsfo|380)\b/i },
  { g: 2, re: /\bmgo\b/i },
];

// Parse the rendered index: split into grade sections, read each port's price.
function parseIndex(text: string): Map<string, (number | null)[]> {
  const lines = text.split("\n");
  const markers = GRADE_MARKERS
    .map((m) => ({ g: m.g, at: lines.findIndex((l) => m.re.test(l)) }))
    .filter((m) => m.at >= 0)
    .sort((a, b) => a.at - b.at);

  const out = new Map<string, (number | null)[]>();
  const ensure = (name: string) => out.get(name) ?? out.set(name, [null, null, null]).get(name)!;

  if (markers.length > 0) {
    for (let i = 0; i < markers.length; i++) {
      const { g, at } = markers[i];
      const end = markers[i + 1]?.at ?? lines.length;
      const [lo, hi] = RANGES[g];
      for (const spec of PORT_SPECS) {
        const pl = lines.slice(at, end).find((l) => matchAlias(l, spec.aliases));
        if (!pl) continue;
        const num = allNums(pl).find((n) => n >= lo && n <= hi);
        if (num != null) ensure(spec.name)[g] = num;
      }
    }
  }
  // Flat fallback: a combined row carrying all three grades on one line.
  for (const spec of PORT_SPECS) {
    const idx = lines.findIndex((l) => matchAlias(l, spec.aliases));
    if (idx === -1) continue;
    const ns = allNums(lines.slice(idx, idx + 2).join(" "));
    const v = ensure(spec.name);
    if (v[0] == null) v[0] = ns.find((n) => n >= RANGES[0][0] && n <= RANGES[0][1]) ?? null;
    if (v[1] == null) v[1] = ns.find((n) => n >= RANGES[1][0] && n <= RANGES[1][1] && n !== v[0]) ?? null;
    if (v[2] == null) v[2] = ns.find((n) => n >= RANGES[2][0] && n <= RANGES[2][1] && n !== v[0] && n !== v[1]) ?? null;
  }
  return out;
}

// First in-range number after a grade label (port detail page layout).
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

// Discover each port's detail-page URL from the (rendered) index links.
function portLinks(html: string): Map<string, string> {
  const out = new Map<string, string>();
  const re = /<a[^>]+href="(\/prices\/[^"#]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const href = m[1];
    const text = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    for (const spec of PORT_SPECS) {
      if (!out.has(spec.name) && spec.aliases.some((a) => text.toLowerCase() === a.toLowerCase())) out.set(spec.name, ORIGIN + href);
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
      // Render the JS page (needs Node 22 on Vercel); falls back to static.
      const { html, mode, renderError } = await getPageHtml(URL_, true, 1800);
      const map = parseIndex(htmlToText(html));

      // Fill gaps from per-port pages (server-rendered, all grades).
      const links = portLinks(html);
      const perPort = await Promise.all(
        [...links].map(async ([port, url]) => {
          try {
            return [port, parsePortPage(htmlToText(await politeFetch(url, 1800)))] as const;
          } catch {
            return [port, null] as const;
          }
        }),
      );
      for (const [port, vals] of perPort) {
        if (!vals) continue;
        const ex = map.get(port) ?? [null, null, null];
        map.set(port, [0, 1, 2].map((i) => ex[i] ?? vals[i]));
      }

      const rows: ScrapeRow[] = PORT_SPECS
        .filter((s) => map.get(s.name)?.some((v) => v != null))
        .map((s) => ({ key: s.name, values: map.get(s.name)! }));
      if (rows.length === 0)
        return { ...base, robots, parse: "failed", reason: `No parseable prices (${mode} fetch)${renderError ? ` [render→static: ${renderError}]` : ""}` };

      const gradesFound = rows.some((r) => r.values[1] != null || r.values[2] != null);
      const diag = renderError ? ` Headless render failed (${renderError}); set Vercel Node 22 to enable HSFO/MGO.` : "";
      return {
        ...base, robots, parse: "ok", available: true, asOf: new Date().toISOString(),
        table: { columns: ["VLSFO", "HSFO", "MGO"], unit: "$/mt", rows },
        note: `SCRAPED (${mode}) — personal use only. Verify against shipandbunker.com.${gradesFound ? "" : diag || " HSFO/MGO not found."}`,
      };
    } catch (e) {
      return { ...base, robots, parse: "failed", reason: `Fetch error: ${(e as Error).message}` };
    }
  },
};

// One-time diagnostic: returns what the live scraper sees, for tuning the parser.
export async function debugShipAndBunker() {
  const out: Record<string, unknown> = {};
  try {
    const { html, mode, renderError } = await getPageHtml(URL_, true, 0);
    out.mode = mode;
    out.renderError = renderError ?? null;
    const text = htmlToText(html);
    out.textSample = text.slice(0, 4000);
    const anchors: { href: string; text: string }[] = [];
    const re = /<a[^>]+href="(\/prices\/[^"#]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) && anchors.length < 40) {
      anchors.push({ href: m[1], text: m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() });
    }
    out.priceAnchors = anchors;
    out.parsed = [...parseIndex(text)];
  } catch (e) {
    out.error = (e as Error).message;
  }
  return out;
}
