"use client";
import useSWR from "swr";
import { Metric, Sparkline, SpreadBar, Card, SectionHeader, PageHeader, ProvenanceBadge } from "@/components/ui";
import type { Provenance, ProvenanceSeries } from "@/lib/provenance";

const fetcher = (u: string) => fetch(u).then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });

interface MarketsResp {
  crude: { wti: Provenance<number>; brent: Provenance<number>; wtiSeries: ProvenanceSeries; brentSeries: ProvenanceSeries };
  products: { dieselGC: Provenance<number>; ulsdNYH: Provenance<number>; gasolineGC: Provenance<number> };
  fx: { eurusd: Provenance<number> };
  spreads: Record<string, Provenance<number> & { why?: string }>;
}
interface BriefResp {
  date: string;
  whyItMatters: string;
  sections: { id: string; title: string; body: string; provenance: Provenance<number>[] }[];
}

export default function Home() {
  const { data: m } = useSWR<MarketsResp>("/api/markets", fetcher, { refreshInterval: 300_000 });
  const { data: b } = useSWR<BriefResp>("/api/brief", fetcher, { refreshInterval: 300_000 });

  return (
    <div>
      <PageHeader
        code="BRIEF"
        title="Morning Brief"
        lead="The 15-minute read. Auto-assembled crude, bunker, freight and disruption summary with a plain-English 'why this matters today'. Every figure is provenance-stamped; commercial data is labelled, not faked."
      />
      <div className="space-y-5 p-5">
        {/* Why this matters */}
        <Card className="p-4">
          <div className="mb-1 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
            <h2 className="text-sm font-semibold text-[var(--color-ink)]">Why this matters today</h2>
            <span className="ml-auto font-mono text-[10px] text-[var(--color-ink-faint)]">{b?.date ?? ""}</span>
          </div>
          <p className="max-w-4xl text-[13px] leading-relaxed text-[var(--color-ink-dim)]">
            {b?.whyItMatters ?? "Loading market read-through…"}
          </p>
        </Card>

        {/* Crude snapshot */}
        <section>
          <SectionHeader title="Crude snapshot" code="WTI · BRENT" desc="The floor under every bunker grade." />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {m ? (
              <>
                <MetricWithSpark p={m.crude.brent} s={m.crude.brentSeries} label="Brent" />
                <MetricWithSpark p={m.crude.wti} s={m.crude.wtiSeries} label="WTI" />
                <Metric label="Brent–WTI" p={m.spreads.brentWti} hint={m.spreads.brentWti.why} />
                <Metric label="EUR/USD" p={m.fx.eurusd} precision={4} hint="Bunker invoices are USD; FX shifts non-USD buyers' real cost." />
              </>
            ) : (
              <Loading n={4} />
            )}
          </div>
        </section>

        {/* Brief sections */}
        <section>
          <SectionHeader title="Desk summary" code="CRUDE · BUNKER · FREIGHT · DISRUPTION" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {(b?.sections ?? []).map((s) => (
              <Card key={s.id} className="p-4">
                <h3 className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-ink)]">{s.title}</h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--color-ink-dim)]">{s.body}</p>
                {s.provenance.length ? (
                  <div className="mt-2 space-y-1 border-t border-[var(--color-border)] pt-2">
                    {s.provenance.map((p, i) => (
                      <ProvenanceBadge key={i} p={p} />
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 border-t border-[var(--color-border)] pt-2 text-[10px] text-[var(--color-ink-faint)]">
                    Qualitative — live rates are commercial (see Freight & Supply Chain tabs).
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>

        {/* Refining read */}
        <section>
          <SectionHeader title="Refining read-through" code="DERIVED" desc="Computed from real EIA/FRED inputs — labelled derived with full provenance." />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {m ? (
              <>
                <SpreadBar label="GC diesel crack vs WTI" p={m.spreads.dieselCrack} />
                <SpreadBar label="GC gasoline crack vs WTI" p={m.spreads.gasolineCrack} />
                <SpreadBar label="VLSFO–HSFO (scrubber)" p={m.spreads.vlsfoHsfo} why="The scrubber economics signal — commercial assessment required (Platts/Argus/Ship & Bunker)." />
              </>
            ) : (
              <Loading n={3} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricWithSpark({ p, s, label }: { p: Provenance<number>; s: ProvenanceSeries; label: string }) {
  return (
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-panel)] p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-wide text-[var(--color-ink-dim)]">{label}</span>
        {p.unit ? <span className="text-[10px] text-[var(--color-ink-faint)]">{p.unit}</span> : null}
      </div>
      <div className="mt-1 flex items-end justify-between gap-2">
        {p.available && p.value != null ? (
          <span className="tnum text-2xl font-semibold text-[var(--color-ink)]">{p.value.toFixed(2)}</span>
        ) : (
          <span className="text-sm text-[var(--color-unavail)]">Data unavailable</span>
        )}
        <Sparkline s={s} width={110} height={32} />
      </div>
      <div className="mt-1.5">
        <ProvenanceBadge p={p} />
      </div>
    </div>
  );
}

function Loading({ n }: { n: number }) {
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-md border border-[var(--color-border)] bg-[var(--color-panel)]" />
      ))}
    </>
  );
}
