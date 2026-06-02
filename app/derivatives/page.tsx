import { PageHeader, SectionHeader, Card, IntelCardView, LearnSnippet } from "@/components/ui";
import { DERIV_INTEL } from "@/lib/content/intel";
import { LEARN_TOPICS } from "@/lib/content/learn";

export default function Derivatives() {
  const topics = ["hedging", "ffa", "basis"].map((id) => LEARN_TOPICS.find((t) => t.id === id)!);

  return (
    <div>
      <PageHeader
        code="DERIV"
        title="Derivatives & Hedging"
        lead="FFAs, freight futures and bunker hedges. Settlement prices are exchange-licensed; this section curates the authoritative venues (SGX · CME · ICE) and explains how a developing book actually hedges fuel and freight exposure."
      />
      <div className="space-y-5 p-5">
        <section>
          <SectionHeader title="Exchanges & contract venues" code="TIER 2" desc="Where freight and bunker risk is cleared. Specs and delayed quotes are public; live settlements are licensed." />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {DERIV_INTEL.map((c) => (
              <IntelCardView key={c.id} c={c} />
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Card className="p-4">
            <h3 className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-ink)]">The bunker hedge toolkit</h3>
            <ul className="mt-2 space-y-2 text-[12px] leading-relaxed text-[var(--color-ink-dim)]">
              <li><span className="font-semibold text-[var(--color-ink)]">Fuel oil swaps (Singapore 380/180, Rotterdam 3.5%):</span> cash-settled vs Platts; the primary HSFO/VLSFO hedge.</li>
              <li><span className="font-semibold text-[var(--color-ink)]">ICE low-sulphur gasoil:</span> the deepest distillate contract — the natural hedge behind MGO exposure (carries basis).</li>
              <li><span className="font-semibold text-[var(--color-ink)]">Brent/WTI futures:</span> hedge the crude component of any bunker price.</li>
              <li><span className="font-semibold text-[var(--color-ink)]">VLSFO swaps:</span> direct hedge where liquidity exists; otherwise proxy with gasoil + a fuel-oil crack.</li>
            </ul>
          </Card>
          <Card className="p-4">
            <h3 className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-ink)]">The freight hedge toolkit</h3>
            <ul className="mt-2 space-y-2 text-[12px] leading-relaxed text-[var(--color-ink-dim)]">
              <li><span className="font-semibold text-[var(--color-ink)]">FFAs (Baltic routes):</span> cash-settled on TD/TC route assessments — lock forward TCE without a ship.</li>
              <li><span className="font-semibold text-[var(--color-ink)]">Cleared freight futures (SGX/CME):</span> standardized contracts on dirty/clean routes.</li>
              <li><span className="font-semibold text-[var(--color-ink)]">Why it links to bunkers:</span> a voyage-charter owner pays bunkers, so freight and bunker hedges are managed together to protect the net voyage margin.</li>
            </ul>
          </Card>
        </section>

        <section>
          <SectionHeader title="Hedging concepts" code="LEARN" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {topics.map((t) => (
              <div key={t.id}>
                <div className="mb-1.5 text-[12px] font-semibold text-[var(--color-ink)]">{t.term}</div>
                <LearnSnippet what={t.what} why={t.why} how={t.how} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
