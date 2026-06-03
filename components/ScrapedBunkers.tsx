"use client";
import useSWR from "swr";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

interface Row { key: string; values: (number | null)[] }
interface Result {
  available: boolean; reason?: string; parse: string; sourceUrl: string; note?: string;
  table: { columns: string[]; unit: string; rows: Row[] } | null;
}

/** Live scraped VLSFO/HSFO/MGO by port (personal use; whole app is gated). */
export function ScrapedBunkers() {
  const { data } = useSWR<{ result?: Result; error?: string }>(
    "/api/scrape?source=shipandbunker",
    fetcher,
    { refreshInterval: 600_000 },
  );

  if (!data) {
    return <div className="h-28 animate-pulse rounded-md border border-[var(--color-border)] bg-[var(--color-panel)]" />;
  }
  const r = data.result;
  if (!r || !r.available || !r.table) {
    return (
      <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-panel)] p-3 text-[12px] text-[var(--color-unavail)]">
        Live bunker scrape unavailable{r?.reason ? ` — ${r.reason}` : data.error ? ` — ${data.error}` : ""}.{" "}
        <a href="https://shipandbunker.com/prices" target="_blank" rel="noreferrer" className="text-[var(--color-accent)] hover:underline">Open Ship &amp; Bunker ↗</a>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-[var(--color-border)] bg-[var(--color-panel)]">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-[var(--color-border)] text-left text-[10px] uppercase tracking-wide text-[var(--color-ink-faint)]">
            <th className="px-3 py-2">Port</th>
            {r.table.columns.map((c) => (
              <th key={c} className="px-3 py-2">{c} <span className="text-[var(--color-ink-faint)]">({r.table!.unit})</span></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {r.table.rows.map((row) => (
            <tr key={row.key} className="border-b border-[var(--color-border-soft)] hover:bg-[var(--color-panel-2)]">
              <td className="px-3 py-2 font-medium text-[var(--color-ink)]">{row.key}</td>
              {row.values.map((v, i) => (
                <td key={i} className="tnum px-3 py-2 text-[var(--color-ink-dim)]">
                  {v == null ? <span className="text-[var(--color-unavail)]">—</span> : v.toLocaleString()}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-3 py-1.5 text-[10px] text-[var(--color-ink-faint)]">{r.note ?? "Scraped — personal use only."}</p>
    </div>
  );
}
