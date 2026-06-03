"use client";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { PageHeader, Card, ProvenanceBadge } from "@/components/ui";
import { SYMBOLS, SYMBOL_MAP, type MarketsShape } from "@/lib/symbols";

const fetcher = (u: string) => fetch(u).then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });

function deviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("bunker_device");
  if (!id) {
    id = (crypto.randomUUID?.() ?? String(Math.random()).slice(2)) as string;
    localStorage.setItem("bunker_device", id);
  }
  return id;
}

interface WatchItem { symbol: string; note: string }

export default function Watchlist() {
  const [device, setDevice] = useState("");
  const [items, setItems] = useState<WatchItem[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [sym, setSym] = useState(SYMBOLS[0].symbol);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: markets } = useSWR<MarketsShape>("/api/markets", fetcher, { refreshInterval: 300_000 });

  useEffect(() => setDevice(deviceId()), []);

  async function load(d: string) {
    const r = await fetch(`/api/watchlist?device=${d}`).then((x) => x.json());
    setConfigured(r.configured);
    setItems(r.items ?? []);
  }
  useEffect(() => {
    if (device) load(device);
  }, [device]);

  async function add() {
    if (!device) return;
    setBusy(true);
    await fetch(`/api/watchlist?device=${device}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol: sym, note }),
    });
    setNote("");
    await load(device);
    setBusy(false);
  }
  async function remove(symbol: string) {
    await fetch(`/api/watchlist?device=${device}&symbol=${symbol}`, { method: "DELETE" });
    await load(device);
  }

  return (
    <div>
      <PageHeader
        code="WATCH"
        title="Watchlist"
        lead="Save the symbols and morning-brief notes you track. Persisted to Supabase (device-scoped). Live values are pulled from the same provenance-stamped feeds as the rest of the desk."
      />
      <div className="space-y-5 p-5">
        {configured === false ? (
          <Card className="border-l-2 border-l-[var(--color-warn)] p-3">
            <p className="text-[12px] text-[var(--color-ink-dim)]">
              <span className="font-semibold text-[var(--color-warn)]">Supabase not configured.</span> Set
              NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY and run the migration to enable the watchlist.
            </p>
          </Card>
        ) : null}

        <Card className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-[11px] text-[var(--color-ink-dim)]">
              Symbol
              <select
                value={sym}
                onChange={(e) => setSym(e.target.value)}
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-2 py-1.5 text-[12px] text-[var(--color-ink)]"
              >
                {SYMBOLS.map((s) => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-1 flex-col gap-1 text-[11px] text-[var(--color-ink-dim)]">
              Note (optional)
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. watch for diesel crack > 30 as MGO signal"
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-2 py-1.5 text-[12px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)]"
              />
            </label>
            <button
              onClick={add}
              disabled={busy || configured === false}
              className="rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)]/10 px-3 py-1.5 text-[12px] text-[var(--color-ink)] hover:bg-[var(--color-accent)]/20 disabled:opacity-40"
            >
              {busy ? "Saving…" : "Add to watchlist"}
            </button>
          </div>
        </Card>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.length === 0 ? (
            <Card className="p-4 text-[12px] text-[var(--color-ink-faint)]">No symbols yet. Add one above.</Card>
          ) : (
            items.map((it) => {
              const meta = SYMBOL_MAP[it.symbol];
              const p = markets ? meta?.pick(markets) : undefined;
              return (
                <Card key={it.symbol} className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[12px] font-semibold text-[var(--color-ink)]">{meta?.label ?? it.symbol}</div>
                      <div className="font-mono text-[10px] text-[var(--color-ink-faint)]">{it.symbol}</div>
                    </div>
                    <button
                      onClick={() => remove(it.symbol)}
                      className="text-[11px] text-[var(--color-ink-faint)] hover:text-[var(--color-neg)]"
                    >
                      remove
                    </button>
                  </div>
                  <div className="mt-2">
                    {p && p.available && p.value != null ? (
                      <span className="tnum text-xl font-semibold text-[var(--color-ink)]">
                        {p.value.toLocaleString("en-US", { maximumFractionDigits: 4 })}{" "}
                        <span className="text-[11px] text-[var(--color-ink-faint)]">{p.unit}</span>
                      </span>
                    ) : (
                      <span className="text-[12px] text-[var(--color-unavail)]">
                        {p?.reason === "Commercial source required" ? "Commercial source required" : "Data unavailable"}
                      </span>
                    )}
                  </div>
                  {it.note ? <p className="mt-1.5 text-[11px] italic leading-snug text-[var(--color-ink-dim)]">“{it.note}”</p> : null}
                  {p ? <div className="mt-2"><ProvenanceBadge p={p} /></div> : null}
                </Card>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
}
