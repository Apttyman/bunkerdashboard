"use client";
import { useEffect, useState, useCallback } from "react";
import { PageHeader, Card } from "@/components/ui";

interface ScrapeRow { key: string; values: (number | null)[]; link?: string; meta?: string }
interface ScrapeTable { columns: string[]; unit: string; rows: ScrapeRow[] }
interface ScrapeResult {
  id: string; name: string; sourceUrl: string; fetchedAt: string; asOf: string | null;
  available: boolean; reason?: string; robots: string; parse: string; table: ScrapeTable | null; note?: string;
}

export default function Live() {
  const [results, setResults] = useState<ScrapeResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const run = useCallback(async () => {
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/scrape");
      const j = await r.json();
      if (!r.ok) { setErr(j.error ?? `HTTP ${r.status}`); setResults(null); }
      else setResults(j.results ?? []);
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  }, []);

  useEffect(() => { run(); }, [run]);

  return (
    <div>
      <PageHeader
        code="LIVE"
        title="Live (Scraped) — Private"
        lead="Personal-use scraping of public bunker & freight pages. Respects robots.txt, rate-limits, fails honestly. The whole app is access-gated, so this stays private — not public redistribution."
      />
      <div className="space-y-5 p-5">
        <div className="flex items-center gap-3">
          <button
            onClick={run}
            disabled={busy}
            className="rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)]/10 px-3 py-1.5 text-[12px] text-[var(--color-ink)] hover:bg-[var(--color-accent)]/20 disabled:opacity-40"
          >
            {busy ? "Scraping…" : "Refresh scrape"}
          </button>
          {err ? <span className="text-[11px] text-[var(--color-neg)]">{err}</span> : null}
          {!results && !err ? <span className="text-[11px] text-[var(--color-ink-faint)]">Loading…</span> : null}
        </div>

        {(results ?? []).map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-[13px] font-semibold text-[var(--color-ink)]">{r.name}</h3>
              <div className="flex items-center gap-2 text-[10px] text-[var(--color-ink-faint)]">
                <span className="rounded-sm bg-[var(--color-panel-2)] px-1 font-mono">T3 scrape</span>
                <span>robots: {r.robots}</span>
                <span>parse: {r.parse}</span>
                <a href={r.sourceUrl} target="_blank" rel="noreferrer" className="hover:text-[var(--color-accent)]">source ↗</a>
              </div>
            </div>
            {r.available && r.table ? (
              <table className="mt-2 w-full text-[12px]">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-left text-[10px] uppercase tracking-wide text-[var(--color-ink-faint)]">
                    <th className="py-1 pr-3">Item</th>
                    {r.table.columns.map((c) => (
                      <th key={c} className="py-1 pr-3">{c} {r.table!.unit ? <span className="text-[var(--color-ink-faint)]">({r.table!.unit})</span> : null}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {r.table.rows.map((row) => (
                    <tr key={row.key} className="border-b border-[var(--color-border-soft)]">
                      <td className="py-1 pr-3 text-[var(--color-ink)]">
                        {row.link ? <a href={row.link} target="_blank" rel="noreferrer" className="hover:text-[var(--color-accent)]">{row.key}</a> : row.key}
                      </td>
                      {row.values.length === 0 ? <td className="py-1 pr-3 text-[var(--color-ink-faint)]">{row.meta ?? "↗ open"}</td> : null}
                      {row.values.map((v, i) => (
                        <td key={i} className="tnum py-1 pr-3 text-[var(--color-ink-dim)]">{v == null ? "—" : v.toLocaleString()}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="mt-2 text-[12px] text-[var(--color-unavail)]">{r.reason ?? "Unavailable"}</p>
            )}
            <p className="mt-2 text-[10px] text-[var(--color-ink-faint)]">{r.note ?? "Personal use only."}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
