import { PageHeader, SectionHeader, IntelCardView } from "@/components/ui";
import { BUNKER_INTEL, FREIGHT_INTEL, DERIV_INTEL } from "@/lib/content/intel";

export const metadata = { title: "Sources — Bunker Desk" };

export default function Sources() {
  return (
    <div>
      <PageHeader
        code="SRC"
        title="External Data Sources"
        lead="Every authoritative external desk for marine fuels, freight and derivatives — one click away. Free pages, freemium, and the subscription benchmarks the market prices against."
      />
      <div className="space-y-5 p-5">
        <section>
          <SectionHeader title="Marine fuel prices (VLSFO / HSFO / MGO)" code="BUNKERS" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {BUNKER_INTEL.map((c) => <IntelCardView key={c.id} c={c} />)}
          </div>
        </section>
        <section>
          <SectionHeader title="Freight & tanker markets" code="FREIGHT" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {FREIGHT_INTEL.map((c) => <IntelCardView key={c.id} c={c} />)}
          </div>
        </section>
        <section>
          <SectionHeader title="Derivatives & hedging" code="DERIV" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {DERIV_INTEL.map((c) => <IntelCardView key={c.id} c={c} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
