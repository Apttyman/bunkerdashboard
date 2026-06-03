"use client";
import useSWR from "swr";
import { Metric, SpreadBar, SectionHeader, PageHeader, Card, Sparkline, ProvenanceBadge } from "@/components/ui";
import { LearnSnippet } from "@/components/ui";
import { LEARN_TOPICS } from "@/lib/content/learn";
import type { Provenance, ProvenanceSeries } from "@/lib/provenance";

const fetcher = (u: string) => fetch(u).then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
interface MarketsResp {
  crude: { wti: Provenance<number>; brent: Provenance<number>; brentSeries: ProvenanceSeries };
  products: { dieselGC: Provenance<number>; ulsdNYH: Provenance<number>; gasolineGC: Provenance<number> };
  spreads: Record<string, Provenance<number> & { why?: string }>;
}

export default function Refining() {
  const { data: m } = useSWR<MarketsResp>("/api/markets", fetcher, { refreshInterval: 300_000 });
  const crack = LEARN_TOPICS.find((t) => t.id === "crack")!;

  return (
    <div>
      <PageHeader
        code="REFIN"
        title="Refining Economics"
        lead="The spreads that decide which fuels are cheap and why. Derived figures are computed from real EIA/FRED inputs and labelled 'derived' with their full provenance chain. Marine fuel-oil spreads that need commercial assessments are gated honestly."
      />
      <div className="space-y-5 p-5">
        <section>
          <SectionHeader title="Spreads that matter" code="DERIVED + COMMERCIAL" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {m ? (
              <>
                <SpreadBar label="Brent–WTI" p={m.spreads.brentWti} />
                <SpreadBar label="GC diesel crack vs WTI" p={m.spreads.dieselCrack} />
                <SpreadBar label="GC gasoline crack vs WTI" p={m.spreads.gasolineCrack} />
                <SpreadBar label="VLSFO–HSFO (scrubber spread)" p={m.spreads.vlsfoHsfo} why="Drives scrubber payback economics. Requires a commercial fuel-oil assessment (Platts/Argus/Ship & Bunker)." />
                <SpreadBar label="MGO–VLSFO" p={m.spreads.mgoVlsfo} why="The distillate-to-residual premium an owner pays in ECAs. Commercial assessment required for the absolute marine spread." />
              </>
            ) : (
              <div className="col-span-2 h-24 animate-pulse rounded-md border border-[var(--color-border)] bg-[var(--color-panel)]" />
            )}
          </div>
        </section>

        <section>
          <SectionHeader title="Underlying inputs (live)" code="EIA · FRED" desc="The real series the spreads are built from — full transparency on every derivation." />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {m ? (
              <>
                <Metric label="Brent" p={m.crude.brent} />
                <Metric label="WTI" p={m.crude.wti} />
                <Metric label="ULSD NYH" p={m.products.ulsdNYH} precision={3} />
                <Metric label="Diesel USGC" p={m.products.dieselGC} precision={3} />
              </>
            ) : null}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Card className="p-4">
            <h3 className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-ink)]">Fuel-oil structure</h3>
            <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--color-ink-dim)]">
              Fuel oil sits at the bottom of the barrel. Its price relative to crude (the fuel-oil crack, usually
              negative) tells you how much refiners are "giving away" the residual cut. A <em>weak</em> (more negative)
              fuel-oil crack means cheap HSFO — good for scrubber-fitted owners. The VLSFO–HSFO spread then sets the
              return on a scrubber. Brent term structure (backwardation vs contango) signals tightness and floating-storage
              incentives that feed back into tanker demand.
            </p>
            <p className="mt-2 text-[11px] text-[var(--color-ink-faint)]">
              Absolute marine fuel-oil cracks need a commercial assessment; the crude/distillate cracks above are live and free.
            </p>
          </Card>
          <Card className="p-4">
            <h3 className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-ink)]">Crude relationships</h3>
            <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--color-ink-dim)]">
              Brent–WTI reflects waterborne vs landlocked crude and the cost to arb US barrels to global markets. A wide
              Brent premium pulls US crude exports up, lifting ton-miles (VLCC/Suezmax demand) and US Gulf bunkering. The
              crude curve (front vs deferred) drives storage economics: deep contango can park crude on tankers as
              floating storage, removing ships from the spot fleet and firming freight.
            </p>
            <div className="mt-2">{m ? <Sparkline s={m.crude.brentSeries} width={220} height={40} /> : null}</div>
            {m ? <div className="mt-1"><ProvenanceBadge p={m.crude.brentSeries} /></div> : null}
          </Card>
        </section>

        <section>
          <SectionHeader title="Why crack spreads matter" code="LEARN" />
          <LearnSnippet what={crack.what} why={crack.why} how={crack.how} />
        </section>
      </div>
    </div>
  );
}
