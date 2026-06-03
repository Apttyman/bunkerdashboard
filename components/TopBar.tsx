"use client";
import useSWR from "swr";
import { useEffect, useState } from "react";

const fetcher = (u: string) => fetch(u).then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });

export function TopBar() {
  const { data } = useSWR("/api/health", fetcher, { refreshInterval: 60_000 });
  const { data: snap } = useSWR("/api/snapshots", fetcher, { refreshInterval: 120_000 });
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () =>
      // Local time in the viewer's own timezone (e.g. EST/EDT), with tz label.
      setClock(new Date().toLocaleTimeString([], { hour12: false, timeZoneName: "short" }));
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);

  const s = data?.summary;
  return (
    <header className="flex h-10 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-panel)] px-4">
      <div className="flex items-center gap-4 text-[11px] text-[var(--color-ink-dim)]">
        <span className="tnum text-[var(--color-ink)]">{clock}</span>
        <span className="text-[var(--color-ink-faint)]">|</span>
        <span>
          Live sources:{" "}
          <span className="tnum text-[var(--color-fresh)]">
            {s ? `${s.tier1Live}/${s.tier1Total}` : "—"}
          </span>{" "}
          Tier-1
        </span>
        <span className="hidden sm:inline">
          · Commercial configured:{" "}
          <span className="tnum text-[var(--color-ink)]">{s ? s.tier4Configured : "—"}</span>
        </span>
        <span className="hidden md:inline text-[var(--color-ink-faint)]">|</span>
        <span className="hidden md:inline" title={snap?.status?.detail}>
          Audit trail:{" "}
          {snap?.status?.configured ? (
            snap.status.reachable && snap.status.rows != null ? (
              <span className="text-[var(--color-fresh)]">
                <span className="tnum">{snap.status.rows.toLocaleString()}</span> snapshots
              </span>
            ) : (
              <span className="text-[var(--color-stale)]">schema pending</span>
            )
          ) : (
            <span className="text-[var(--color-unavail)]">disabled</span>
          )}
        </span>
      </div>
      <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-[var(--color-ink-faint)]">
        <LegendDot color="var(--color-live)" label="live" />
        <LegendDot color="var(--color-stale)" label="stale" />
        <LegendDot color="var(--color-unavail)" label="unavailable" />
      </div>
    </header>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
