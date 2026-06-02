import type { Provenance, Freshness, ProvenanceSeries } from "@/lib/provenance";

// ── Freshness dot ───────────────────────────────────────────────────────────
const FRESH_COLOR: Record<Freshness, string> = {
  live: "var(--color-live)",
  fresh: "var(--color-fresh)",
  stale: "var(--color-stale)",
  old: "var(--color-old)",
  unavailable: "var(--color-unavail)",
};

export function FreshnessDot({ f, title }: { f: Freshness; title?: string }) {
  return (
    <span
      title={title ?? f}
      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
      style={{ background: FRESH_COLOR[f] }}
    />
  );
}

function relAge(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return "—";
  const m = Math.round(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

// ── Provenance badge (source · timestamp · freshness) ────────────────────────
export function ProvenanceBadge({ p }: { p: Provenance<unknown> | ProvenanceSeries }) {
  const tier = "sourceTier" in p ? p.sourceTier : 1;
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-ink-faint)]">
      <FreshnessDot f={p.freshness} title={p.freshness} />
      <span className="rounded-sm bg-[var(--color-panel-2)] px-1 font-mono">T{tier}</span>
      {p.sourceUrl ? (
        <a href={p.sourceUrl} target="_blank" rel="noreferrer" className="truncate hover:text-[var(--color-accent)]">
          {p.source}
        </a>
      ) : (
        <span className="truncate">{p.source}</span>
      )}
      <span>·</span>
      <span className="tnum">{p.available ? relAge(p.asOf) : "n/a"}</span>
      {"derived" in p && p.derived ? <span className="text-[var(--color-warn)]">· derived</span> : null}
    </div>
  );
}

// ── Metric: the ONLY way to render a number. Requires a Provenance envelope. ──
export function Metric({
  label,
  p,
  precision = 2,
  prefix = "",
  hint,
}: {
  label: string;
  p: Provenance<number>;
  precision?: number;
  prefix?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-panel)] p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-wide text-[var(--color-ink-dim)]">{label}</span>
        {p.unit ? <span className="text-[10px] text-[var(--color-ink-faint)]">{p.unit}</span> : null}
      </div>
      {p.available && p.value != null ? (
        <span className="tnum text-2xl font-semibold text-[var(--color-ink)]">
          {prefix}
          {p.value.toLocaleString("en-US", { minimumFractionDigits: precision, maximumFractionDigits: precision })}
        </span>
      ) : (
        <span className="text-sm font-medium text-[var(--color-unavail)]">
          {p.reason === "Commercial source required" ? "Commercial source required" : "Data unavailable"}
        </span>
      )}
      {!p.available && p.reason ? (
        <span className="text-[10px] text-[var(--color-ink-faint)]">{p.reason}</span>
      ) : null}
      {hint ? <span className="text-[10px] leading-snug text-[var(--color-ink-faint)]">{hint}</span> : null}
      <ProvenanceBadge p={p} />
    </div>
  );
}

// ── Panels & headers ─────────────────────────────────────────────────────────
export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] ${className}`}>
      {children}
    </div>
  );
}

export function SectionHeader({ title, code, desc }: { title: string; code?: string; desc?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between border-b border-[var(--color-border)] pb-2">
      <div>
        <h2 className="text-sm font-semibold tracking-tight text-[var(--color-ink)]">{title}</h2>
        {desc ? <p className="mt-0.5 max-w-3xl text-[11px] leading-snug text-[var(--color-ink-dim)]">{desc}</p> : null}
      </div>
      {code ? <span className="font-mono text-[10px] text-[var(--color-ink-faint)]">{code}</span> : null}
    </div>
  );
}

export function PageHeader({ title, code, lead }: { title: string; code: string; lead: string }) {
  return (
    <div className="border-b border-[var(--color-border)] bg-[var(--color-panel)] px-5 py-3">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-[var(--color-ink-faint)]">{code}</span>
        <h1 className="text-base font-semibold tracking-tight text-[var(--color-ink)]">{title}</h1>
      </div>
      <p className="mt-1 max-w-4xl text-[12px] leading-snug text-[var(--color-ink-dim)]">{lead}</p>
    </div>
  );
}

// ── Sparkline (pure SVG) ──────────────────────────────────────────────────────
export function Sparkline({ s, width = 160, height = 36 }: { s: ProvenanceSeries; width?: number; height?: number }) {
  if (!s.available || s.points.length < 2) {
    return <div className="text-[10px] text-[var(--color-unavail)]">no series</div>;
  }
  const vals = s.points.map((p) => p.v);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const step = width / (s.points.length - 1);
  const pts = s.points.map((p, i) => `${(i * step).toFixed(1)},${(height - ((p.v - min) / range) * height).toFixed(1)}`);
  const up = vals[vals.length - 1] >= vals[0];
  const color = up ? "var(--color-pos)" : "var(--color-neg)";
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={1.25} />
    </svg>
  );
}

// ── Spread bar (derived value with directional context) ──────────────────────
export function SpreadBar({ label, p, why }: { label: string; p: Provenance<number> & { why?: string }; why?: string }) {
  return (
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-panel)] p-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-[var(--color-ink)]">{label}</span>
        {p.available && p.value != null ? (
          <span className={`tnum text-lg font-semibold ${p.value >= 0 ? "text-[var(--color-pos)]" : "text-[var(--color-neg)]"}`}>
            {p.value >= 0 ? "+" : ""}
            {p.value} {p.unit}
          </span>
        ) : (
          <span className="text-xs text-[var(--color-unavail)]">
            {p.reason === "Commercial source required" ? "Commercial source required" : "Data unavailable"}
          </span>
        )}
      </div>
      {(why ?? p.why) ? <p className="mt-1 text-[11px] leading-snug text-[var(--color-ink-dim)]">{why ?? p.why}</p> : null}
      <div className="mt-1.5">
        <ProvenanceBadge p={p} />
        {p.inputs?.length ? (
          <div className="mt-0.5 text-[9px] text-[var(--color-ink-faint)]">inputs: {p.inputs.join(" · ")}</div>
        ) : null}
      </div>
    </div>
  );
}

// ── Source intelligence card (Tier 2) ─────────────────────────────────────────
export function IntelCardView({
  c,
}: {
  c: { title: string; provider: string; url: string; whatYouGet: string; howToRead: string; cost: string };
}) {
  return (
    <a
      href={c.url}
      target="_blank"
      rel="noreferrer"
      className="block rounded-md border border-[var(--color-border)] bg-[var(--color-panel)] p-3 transition-colors hover:border-[var(--color-accent)]"
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-[var(--color-ink)]">{c.title}</span>
        <span className="rounded-sm bg-[var(--color-panel-2)] px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-[var(--color-ink-faint)]">
          {c.cost}
        </span>
      </div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wide text-[var(--color-ink-faint)]">{c.provider}</div>
      <p className="mt-1.5 text-[11px] leading-snug text-[var(--color-ink-dim)]">{c.whatYouGet}</p>
      <p className="mt-1 text-[11px] leading-snug text-[var(--color-ink-faint)]">
        <span className="text-[var(--color-accent)]">How to read:</span> {c.howToRead}
      </p>
    </a>
  );
}

// ── Learn snippet (inline What/Why/How) ───────────────────────────────────────
export function LearnSnippet({ what, why, how }: { what: string; why: string; how: string }) {
  return (
    <div className="rounded-md border border-dashed border-[var(--color-border)] bg-[var(--color-panel-2)]/40 p-3 text-[11px] leading-snug">
      <p className="text-[var(--color-ink-dim)]"><span className="font-semibold text-[var(--color-ink)]">What:</span> {what}</p>
      <p className="mt-1 text-[var(--color-ink-dim)]"><span className="font-semibold text-[var(--color-ink)]">Why:</span> {why}</p>
      <p className="mt-1 text-[var(--color-ink-dim)]"><span className="font-semibold text-[var(--color-ink)]">How traders use it:</span> {how}</p>
    </div>
  );
}
