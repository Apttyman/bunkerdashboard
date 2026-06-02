"use client";
import useSWR from "swr";
import { PageHeader, Card, ProvenanceBadge } from "@/components/ui";
import { CHOKEPOINTS, type Chokepoint } from "@/lib/content/chokepoints";
import type { Provenance } from "@/lib/provenance";
import type { WeatherObs } from "@/lib/adapters/openweather";

const fetcher = (u: string) => fetch(u).then((r) => r.json());
interface WeatherResp {
  results: { chokepoint: Chokepoint; weather: Provenance<WeatherObs> }[];
}

export default function SupplyChain() {
  const { data } = useSWR<WeatherResp>("/api/weather", fetcher, { refreshInterval: 600_000 });

  return (
    <div>
      <PageHeader
        code="SUPPLY"
        title="Supply Chain & Chokepoints"
        lead="Panama · Suez · Red Sea / Bab-el-Mandeb · Hormuz. Each chokepoint pairs live weather (where a key is configured) with the operational implication for ton-miles, fleet supply and bunker demand. Flow/congestion analytics are commercial (Tier-4 stubs ready)."
      />
      <div className="space-y-4 p-5">
        {(data?.results ?? FALLBACK).map(({ chokepoint: c, weather }) => (
          <Card key={c.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-[13px] font-semibold text-[var(--color-ink)]">{c.name}</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--color-ink-dim)]">
                  <span className="text-[var(--color-ink-faint)]">Flows:</span> {c.whatFlows}
                </p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--color-ink-dim)]">
                  <span className="font-semibold text-[var(--color-ink)]">Why it matters:</span> {c.whyItMatters}
                </p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--color-ink-dim)]">
                  <span className="font-semibold text-[var(--color-accent)]">Operational implication:</span> {c.operationalImplication}
                </p>
                <p className="mt-1.5 text-[11px] text-[var(--color-ink-faint)]">Watch: {c.watch}</p>
              </div>
              <div className="w-44 shrink-0 rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] p-2.5">
                <div className="text-[10px] uppercase tracking-wide text-[var(--color-ink-faint)]">Local weather</div>
                {weather && weather.available && weather.value ? (
                  <div className="mt-1">
                    <div className="text-[12px] capitalize text-[var(--color-ink)]">{weather.value.description}</div>
                    <div className="tnum mt-0.5 text-[11px] text-[var(--color-ink-dim)]">
                      {Number.isFinite(weather.value.tempC) ? `${weather.value.tempC.toFixed(0)}°C` : "—"} ·{" "}
                      wind {Number.isFinite(weather.value.windMs) ? `${weather.value.windMs.toFixed(0)} m/s` : "—"}
                      {weather.value.gustMs ? ` (gust ${weather.value.gustMs.toFixed(0)})` : ""}
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 text-[11px] text-[var(--color-unavail)]">
                    {weather?.reason === "API key not configured" ? "Add OpenWeather key" : "Data unavailable"}
                  </div>
                )}
                <div className="mt-1.5">{weather ? <ProvenanceBadge p={weather} /> : null}</div>
              </div>
            </div>
          </Card>
        ))}

        <Card className="border-l-2 border-l-[var(--color-warn)] p-3">
          <p className="text-[12px] leading-snug text-[var(--color-ink-dim)]">
            <span className="font-semibold text-[var(--color-warn)]">Beyond weather:</span> live transit counts, AIS
            congestion and floating-storage analytics are commercial/enterprise (Kpler, Vortexa, MarineTraffic, Signal
            Ocean). Their Tier-4 adapters are stubbed and will populate this section when licensed — no figures are
            fabricated in the meantime.
          </p>
        </Card>
      </div>
    </div>
  );
}

// Show chokepoints immediately (weather pending) before the API resolves.
const FALLBACK: WeatherResp["results"] = CHOKEPOINTS.map((c) => ({
  chokepoint: c,
  weather: {
    value: null,
    source: `OpenWeather — ${c.name}`,
    sourceTier: 1,
    asOf: null,
    fetchedAt: new Date().toISOString(),
    freshness: "unavailable",
    available: false,
    reason: "Loading…",
  },
}));
