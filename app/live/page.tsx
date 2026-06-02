"use client";
import { useEffect, useState } from "react";
import { PageHeader, Card } from "@/components/ui";

interface ScrapeRow { key: string; values: (number | null)[]; link?: string; meta?: string }
interface ScrapeTable { columns: string[]; unit: string; rows: ScrapeRow[] }
interface ScrapeResult {
  id: string; name: string; sourceUrl: string; fetchedAt: string; asOf: string | null;
  available: boolean; reason?: string; robots: string; parse: string; table: ScrapeTable | null; note?: string;
}
interface StatusResp {
  enabled: boolean; configured: boolean;
  connectors: { id: string; name: string; sourceUrl: string; legalNote: string; enabled: boolean }[];
}

export default function Live() {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<StatusResp | null>(null);
  const [results, setResults] = useState<ScrapeResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    setToken(localStorage.getItem("bunker_scrape_token") ?? "");
    fetch("/api/scrape?status=1").then((r) => r.json()).then(setStatus).catch(() => {});
  }, []);

  async function run() {
    setBusy(true); setErr("");
    localStorage.setItem("bunker_scrape_token", token);
    try {
      const r = await fetch("/api/scrape", { headers: { "x-scrape-token": token } });
      const j = await r.json();
      if (!r.ok) { setErr(j.error ?? `HTTP ${r.status}`); setResults(null); }
      else setResults(j.results ?? []);
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  }

  return (
    <div>
      <PageHeader
        code="LIVE"
        title="Live (Scraped) — Private"
        lead="Gated personal-use scraping of public bunker & freight pages. Respects robots.txt, rate-limits, and fails honestly. Token-gated so this is NOT public redistribution — for your eyes only."
      />
      <div className="space-y-5 p-5">
        <Card className="border-l-2 border-l-[var(--color-neg)] p-3">
          <p className="text-[12px] leading-snug text-[var(--color-ink-dim)]">
            <span className="font-semibold text-[var(--color-neg)]">Personal use only.</span> These figures are scraped
            from third-party sites whose terms restrict redistribution (Baltic data is licensed IP). They are gated behind
            your access token and must not be republished. Always verify against the source before trading on them.
          </p>
        </Card>

        {/* Config + token */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <span className={status?.enabled ? "text-[var(--color-fresh)]" : "text-[var(--color-unavail)]"}>
              SCRAPING_ENABLED: {status ? String(status.enabled) : "…"}
            </span>
            <span className={status?.configured ? "text-[var(--color-fresh)]" : "text-[var(--color-stale)]"}>
              Token configured: {status ? String(status.configured) : "…"}
            </span>
          </div>
          {!status?.configured ? (
            <p className="mt-2 text-[11px] text-[var(--color-ink-faint)]">
              Set <code>SCRAPING_ENABLED=true</code> and <code>SCRAPE_ACCESS_TOKEN=&lt;secret&gt;</code> in your Vercel env, redeploy, then enter the token below.
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 text-[11px] text-[var(--color-ink-dim)]">
              Access token
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="SCRAPE_ACCESS_TOKEN"
                className="w-72 rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-2 py-1.5 text-[12px] text-[var(--color-ink)]"
              />
            </label>
            <button
              onClick={run}
              disabled={busy || !token}
              className="rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)]/10 px-3 py-1.5 text-[12px] text-[var(--color-ink)] hover:bg-[var(--color-accent)]/20 disabled:opacity-40"
            >
              {busy ? "Scraping…" : "Run scrape"}
            </button>
            {err ? <span className="text-[11px] text-[var(--color-neg)]">{err}</span> : null}
          </div>
        </Card>

        {/* Results */}
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
              <p className="mt-2 text-[12px] text-[var(--color-unavail)]">
                {r.reason ?? "Unavailable"} {r.parse === "failed" ? "— parser may need tuning against the live page." : ""}
              </p>
            )}
            <p className="mt-2 text-[10px] text-[var(--color-ink-faint)]">{r.note ?? "Personal use only."}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
