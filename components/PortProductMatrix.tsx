"use client";
import useSWR from "swr";
import { Card } from "@/components/ui";
import { BUNKER_PORTS, FUEL_PRODUCTS } from "@/lib/content/markets";

const fetcher = (u: string) => fetch(u).then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });

interface Row { key: string; values: (number | null)[] }
interface Result {
  available: boolean; reason?: string; note?: string; sourceUrl: string;
  table: { columns: string[]; unit: string; rows: Row[] } | null;
}

// FUEL_PRODUCTS order → scraped column index.
const COL: Record<string, number> = { vlsfo: 0, hsfo: 1, mgo: 2 };

/** Port × grade matrix populated live from the Ship & Bunker scrape. Cells show
 *  the scraped $/mt value; "—" when scraped but that grade wasn't on the page;
 *  "Commercial source required" only when the scrape itself is unavailable. */
export function PortProductMatrix() {
  const { data } = useSWR<{ result?: Result; error?: string }>(
    "/api/scrape?source=shipandbunker",
    fetcher,
    { refreshInterval: 600_000 },
  );
  const r = data?.result;
  const rows = r?.table?.rows ?? [];
  const unit = r?.table?.unit ?? "$/mt";
  const scrapeOk = Boolean(r?.available);

  const findRow = (portName: string) => {
    const key = portName.toLowerCase().split(/[\s(]/)[0];
    return rows.find(
      (x) => x.key.toLowerCase() === key || x.key.toLowerCase().startsWith(key) || portName.toLowerCase().includes(x.key.toLowerCase()),
    );
  };

  return (
    <Card className="overflow-x-auto">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-[var(--color-border)] text-left text-[10px] uppercase tracking-wide text-[var(--color-ink-faint)]">
            <th className="px-3 py-2">Port</th>
            <th className="px-3 py-2">Region</th>
            {FUEL_PRODUCTS.map((p) => (
              <th key={p.id} className="px-3 py-2">{p.name} <span className="text-[var(--color-ink-faint)]">({unit})</span></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {BUNKER_PORTS.map((port) => {
            const vals = findRow(port.name)?.values;
            return (
              <tr key={port.id} className="border-b border-[var(--color-border-soft)] hover:bg-[var(--color-panel-2)]">
                <td className="px-3 py-2 font-medium text-[var(--color-ink)]">{port.name}</td>
                <td className="px-3 py-2 text-[var(--color-ink-faint)]">{port.region}</td>
                {FUEL_PRODUCTS.map((p) => {
                  const v = vals ? vals[COL[p.id]] ?? null : null;
                  return (
                    <td key={p.id} className="px-3 py-2">
                      {v != null ? (
                        <span className="tnum font-medium text-[var(--color-ink)]">{v.toLocaleString()}</span>
                      ) : !data ? (
                        <span className="text-[var(--color-ink-faint)]">…</span>
                      ) : scrapeOk ? (
                        <span className="text-[var(--color-ink-faint)]">—</span>
                      ) : (
                        <span className="text-[var(--color-unavail)]">Commercial source required</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="px-3 py-1.5 text-[10px] text-[var(--color-ink-faint)]">
        {scrapeOk
          ? (r?.note ?? "Scraped — personal use only.")
          : data
          ? `Live scrape unavailable${r?.reason ? ` — ${r.reason}` : ""}. `
          : "Loading live prices…"}
        {!scrapeOk && data ? (
          <a href="https://shipandbunker.com/prices" target="_blank" rel="noreferrer" className="text-[var(--color-accent)] hover:underline">Open Ship &amp; Bunker ↗</a>
        ) : null}
      </p>
    </Card>
  );
}
