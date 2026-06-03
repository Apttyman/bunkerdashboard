"use client";
import useSWR from "swr";
import { Metric, SectionHeader, PageHeader, IntelCardView, LearnSnippet } from "@/components/ui";
import { PortProductMatrix } from "@/components/PortProductMatrix";
import { BUNKER_INTEL } from "@/lib/content/intel";
import { LEARN_TOPICS } from "@/lib/content/learn";
import type { Provenance } from "@/lib/provenance";

const fetcher = (u: string) => fetch(u).then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
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
        {/* Live scraped bunker prices by port — VLSFO/HSFO/MGO (personal use; gated) */}
        <section>
          <SectionHeader title="Live bunker prices by port" code="SCRAPED · PERSONAL" desc="VLSFO / HSFO / MGO scraped from Ship & Bunker for your private use. Verify against the source before trading. Not for redistribution." />
          <PortProductMatrix />
        </section>

        {/* External desks & data sources — one click to the authoritative pages */}
        <section>
          <SectionHeader title="External desks & data sources" code="LINKS" desc="The authoritative marine-fuel price & market pages. Open in a new tab." />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {BUNKER_INTEL.map((c) => (
              <IntelCardView key={c.id} c={c} />
            ))}
          </div>
        </section>

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
