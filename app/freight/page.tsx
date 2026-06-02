import { PageHeader, SectionHeader, Card, IntelCardView, LearnSnippet } from "@/components/ui";
import { FREIGHT_SEGMENTS } from "@/lib/content/markets";
import { FREIGHT_INTEL } from "@/lib/content/intel";
import { LEARN_TOPICS } from "@/lib/content/learn";

export default function Freight() {
  const tce = LEARN_TOPICS.find((t) => t.id === "tce")!;
  const ws = LEARN_TOPICS.find((t) => t.id === "worldscale")!;

  return (
    <div>
      <PageHeader
        code="FRGHT"
        title="Freight Markets"
        lead="VLCC · Suezmax · Aframax · LR2 · LR1 · MR. Live Worldscale and TCE assessments are Baltic-licensed commercial data — shown here as structured route intelligence and authoritative source links, never fabricated."
      />
      <div className="space-y-5 p-5">
        <Card className="border-l-2 border-l-[var(--color-warn)] p-3">
          <p className="text-[12px] leading-snug text-[var(--color-ink-dim)]">
            <span className="font-semibold text-[var(--color-warn)]">Data integrity note:</span> Baltic Exchange route
            assessments, Worldscale points and TCE are licensed. The matrix below is reference structure; absolute rates
            populate when a Baltic/Clarksons/Signal Ocean feed (Tier-4) is connected.
          </p>
        </Card>

        <section>
          <SectionHeader title="Tanker segments" code="ROUTES · WS · TCE" desc="Vessel class, cargo, benchmark routes, and how the rate is quoted." />
          <Card className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-[10px] uppercase tracking-wide text-[var(--color-ink-faint)]">
                  <th className="px-3 py-2">Segment</th>
                  <th className="px-3 py-2">Size</th>
                  <th className="px-3 py-2">Cargo</th>
                  <th className="px-3 py-2">Benchmark routes</th>
                  <th className="px-3 py-2">Spot WS</th>
                  <th className="px-3 py-2">TCE ($/day)</th>
                </tr>
              </thead>
              <tbody>
                {FREIGHT_SEGMENTS.map((s) => (
                  <tr key={s.id} className="border-b border-[var(--color-border-soft)] align-top hover:bg-[var(--color-panel-2)]">
                    <td className="px-3 py-2 font-semibold text-[var(--color-ink)]">{s.name}</td>
                    <td className="px-3 py-2 text-[var(--color-ink-faint)]">{s.dwt}</td>
                    <td className="px-3 py-2 text-[var(--color-ink-dim)]">{s.cargo}</td>
                    <td className="px-3 py-2 text-[var(--color-ink-dim)]">{s.benchmarkRoutes}</td>
                    <td className="px-3 py-2 text-[var(--color-unavail)]">Commercial</td>
                    <td className="px-3 py-2 text-[var(--color-unavail)]">Commercial</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>

        <section>
          <SectionHeader title="Freight source intelligence" code="TIER 2" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            {FREIGHT_INTEL.map((c) => (
              <IntelCardView key={c.id} c={c} />
            ))}
          </div>
        </section>

        <section>
          <SectionHeader title="How freight is priced" code="LEARN" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <div className="mb-1.5 text-[12px] font-semibold text-[var(--color-ink)]">Worldscale</div>
              <LearnSnippet what={ws.what} why={ws.why} how={ws.how} />
            </div>
            <div>
              <div className="mb-1.5 text-[12px] font-semibold text-[var(--color-ink)]">TCE</div>
              <LearnSnippet what={tce.what} why={tce.why} how={tce.how} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
