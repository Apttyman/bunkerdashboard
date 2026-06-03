// Ship & Bunker connector — VLSFO / HSFO (IFO380) / MGO by port.
// Heuristic text parser with strict range validation. Fails honestly if the page
// is JS-rendered or the layout changes (returns parse:"failed", never fake data).
import { getPageHtml, robotsState, htmlToText, scrapingEnabled } from "../engine";
import type { ScrapeConnector, ScrapeResult, ScrapeRow } from "../types";

const URL_ = "https://shipandbunker.com/prices";
const PORTS = [
  "Singapore", "Rotterdam", "Fujairah", "Houston", "Gibraltar", "Zhoushan",
  "Panama", "Hong Kong", "Busan", "Los Angeles", "Antwerp", "Durban",
];

// Sane bunker ranges ($/mt) to reject mis-parsed numbers, indexed [VLSFO,HSFO,MGO].
const RANGES: [number, number][] = [[200, 1400], [150, 1200], [300, 2000]];

const nums = (line: string) => (line.match(/\d[\d,]*\.?\d*/g) ?? []).map((s) => Number(s.replace(/,/g, "")));

// Combined-row layout (rendered table): port row carries all three grades.
function parseFlat(lines: string[]): Map<string, (number | null)[]> {
  const out = new Map<string, (number | null)[]>();
  for (const port of PORTS) {
    const idx = lines.findIndex((l) => l.toLowerCase().includes(port.toLowerCase()));
    if (idx === -1) continue;
    const ns = nums(lines.slice(idx, idx + 2).join(" "));
    const vlsfo = ns.find((n) => n >= RANGES[0][0] && n <= RANGES[0][1]) ?? null;
    const hsfo = ns.find((n) => n >= RANGES[1][0] && n <= RANGES[1][1] && n !== vlsfo) ?? null;
    const mgo = ns.find((n) => n >= RANGES[2][0] && n <= RANGES[2][1] && n !== vlsfo && n !== hsfo) ?? null;
    if (vlsfo != null || hsfo != null || mgo != null) out.set(port, [vlsfo, hsfo, mgo]);
  }
  return out;
}

// Separate per-grade tables (static layout): three sections, each a grade.
function parseSections(lines: string[]): Map<string, (number | null)[]> {
  const markers = [
    { g: 0, re: /\bvlsfo\b/i },
    { g: 1, re: /\b(ifo\s?380|hsfo)\b/i },
    { g: 2, re: /\bmgo\b/i },
  ]
    .map((m) => ({ g: m.g, at: lines.findIndex((l) => m.re.test(l)) }))
    .filter((m) => m.at >= 0)
    .sort((a, b) => a.at - b.at);

  const out = new Map<string, (number | null)[]>();
  for (let i = 0; i < markers.length; i++) {
    const { g, at } = markers[i];
    const end = markers[i + 1]?.at ?? lines.length;
    const [lo, hi] = RANGES[g];
    for (const port of PORTS) {
      const pl = lines.slice(at, end).find((l) => l.toLowerCase().includes(port.toLowerCase()));
      if (!pl) continue;
      const num = nums(pl).find((n) => n >= lo && n <= hi);
      if (num == null) continue;
      const arr = out.get(port) ?? [null, null, null];
      arr[g] = num;
      out.set(port, arr);
    }
  }
  return out;
}

// Merge both strategies — section values win, flat fills any gaps.
function parse(text: string): ScrapeRow[] {
  const lines = text.split("\n");
  const flat = parseFlat(lines);
  const sect = parseSections(lines);
  const ports = new Set<string>([...flat.keys(), ...sect.keys()]);
  const rows: ScrapeRow[] = [];
  for (const port of PORTS) {
    if (!ports.has(port)) continue;
    const f = flat.get(port) ?? [null, null, null];
    const s = sect.get(port) ?? [null, null, null];
    const values = [0, 1, 2].map((i) => s[i] ?? f[i]);
    if (values.some((v) => v != null)) rows.push({ key: port, values });
  }
  return rows;
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
      const { html, mode, renderError } = await getPageHtml(URL_, true, 1800);
      const rows = parse(htmlToText(html));
      const diag = renderError ? ` [render→static: ${renderError}]` : "";
      if (rows.length === 0)
        return { ...base, robots, parse: "failed", reason: `No parseable prices (${mode} fetch)${diag}` };
      return {
        ...base, robots, parse: "ok", available: true, asOf: new Date().toISOString(),
        table: { columns: ["VLSFO", "HSFO", "MGO"], unit: "$/mt", rows },
        note: `SCRAPED (${mode}) — personal use only. Verify against shipandbunker.com.${diag}`,
      };
    } catch (e) {
      return { ...base, robots, parse: "failed", reason: `Fetch error: ${(e as Error).message}` };
    }
  },
};
