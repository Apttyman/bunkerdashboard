"use client";
import useSWR from "swr";
import { Metric, Card, SectionHeader, PageHeader, IntelCardView, LearnSnippet } from "@/components/ui";
import { BUNKER_PORTS, FUEL_PRODUCTS } from "@/lib/content/markets";
import { BUNKER_INTEL } from "@/lib/content/intel";
import { LEARN_TOPICS } from "@/lib/content/learn";
import type { Provenance } from "@/lib/provenance";

const fetcher = (u: string) => fetch(u).then((r) => r.json());
interface MarketsResp {
  products: { dieselGC: Provenance<number>; ulsdNYH: Provenance<number>; gasolineGC: Provenance<number> };
}

export default function Fuels() {
  const { data: m } = useSWR<MarketsResp>("/api/markets", fetcher, { refreshInterval: 300_000 });
  const learn = (id: string) => LEARN_TOPICS.find((t) => t.id === id)!;

  return (
    <div>
      <PageHeader
        code="FUELS"
        title="Marine Fuel Markets"
        lead="VLSFO / HSFO / MGO across Singapore, Rotterdam, Fujairah, Houston, Panama, Gibraltar and Zhoushan. Absolute bunker assessments are commercial — shown as source-intelligence cards. Free distillate proxies (clearly labelled as proxies) give directional read."
      />
      <div className="space-y-5 p-5">
        {/* Honest data-availability banner */}
        <Card className="border-l-2 border-l-[var(--color-warn)] p-3">
          <p className="text-[12px] leading-snug text-[var(--color-ink-dim)]">
            <span className="font-semibold text-[var(--color-warn)]">Data integrity note:</span> real-time VLSFO/HSFO/MGO
            bunker prices by port are licensed commercial data (Platts, Argus, Ship & Bunker). This platform does not
            fabricate or scrape them. Below: (1) the live distillate/crude proxies we <em>can</em> source for free,
            clearly labelled as proxies, and (2) curated links to the authoritative bunker price sources.
          </p>
        </Card>

        {/* Free proxies */}
        <section>
          <SectionHeader title="Free distillate & product proxies" code="EIA · LIVE" desc="Directional only. A distillate proxy for MGO and a residual/heavy read — never presented as a marine bunker assessment." />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {m ? (
              <>
                <Metric label="ULSD NY Harbor (MGO proxy)" p={m.products.ulsdNYH} hint="Distillate — closest free proxy for MGO direction." />
                <Metric label="Diesel US Gulf Coast (MGO proxy)" p={m.products.dieselGC} hint="Distillate — proxy, not an MGO bunker print." />
                <Metric label="Conv. gasoline US Gulf (yield context)" p={m.products.gasolineGC} hint="Competes with distillate for refinery yield." />
              </>
            ) : (
              <div className="col-span-3 h-24 animate-pulse rounded-md border border-[var(--color-border)] bg-[var(--color-panel)]" />
            )}
          </div>
        </section>

        {/* Port × product matrix (commercial-gated) */}
        <section>
          <SectionHeader title="Port × product matrix" code="VLSFO · HSFO · MGO" desc="Absolute prices require a commercial feed (Tier-4 adapters ship ready). Until connected, each cell states the honest source requirement." />
          <Card className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-[10px] uppercase tracking-wide text-[var(--color-ink-faint)]">
                  <th className="px-3 py-2">Port</th>
                  <th className="px-3 py-2">Region</th>
                  {FUEL_PRODUCTS.map((p) => (
                    <th key={p.id} className="px-3 py-2">{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BUNKER_PORTS.map((port) => (
                  <tr key={port.id} className="border-b border-[var(--color-border-soft)] hover:bg-[var(--color-panel-2)]">
                    <td className="px-3 py-2 font-medium text-[var(--color-ink)]">{port.name}</td>
                    <td className="px-3 py-2 text-[var(--color-ink-faint)]">{port.region}</td>
                    {FUEL_PRODUCTS.map((p) => (
                      <td key={p.id} className="px-3 py-2 text-[var(--color-unavail)]">
                        Commercial source required
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <p className="mt-1.5 text-[10px] text-[var(--color-ink-faint)]">
            {BUNKER_PORTS.length} ports × {FUEL_PRODUCTS.length} grades · connect Argus/Platts (Tier-4) or license Ship & Bunker data to populate.
          </p>
        </section>

        {/* Authoritative bunker sources */}
        <section>
          <SectionHeader title="Authoritative bunker price sources" code="TIER 2" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {BUNKER_INTEL.map((c) => (
              <IntelCardView key={c.id} c={c} />
            ))}
          </div>
        </section>

        {/* Product explainers */}
        <section>
          <SectionHeader title="The three grades, explained" code="LEARN" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {["vlsfo", "hsfo", "mgo"].map((id) => {
              const t = learn(id);
              return (
                <div key={id}>
                  <div className="mb-1.5 text-[12px] font-semibold text-[var(--color-ink)]">{t.term}</div>
                  <LearnSnippet what={t.what} why={t.why} how={t.how} />
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
