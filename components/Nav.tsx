"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Morning Brief", code: "BRIEF" },
  { href: "/fuels", label: "Marine Fuel Markets", code: "FUELS" },
  { href: "/freight", label: "Freight Markets", code: "FRGHT" },
  { href: "/refining", label: "Refining Economics", code: "REFIN" },
  { href: "/supply-chain", label: "Supply Chain", code: "SUPPLY" },
  { href: "/derivatives", label: "Derivatives", code: "DERIV" },
  { href: "/live", label: "Live (Scraped)", code: "LIVE" },
  { href: "/watchlist", label: "Watchlist", code: "WATCH" },
  { href: "/learn", label: "Learning Mode", code: "LEARN" },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="flex w-56 flex-col border-r border-[var(--color-border)] bg-[var(--color-panel)]">
      <div className="border-b border-[var(--color-border)] px-4 py-3">
        <div className="font-mono text-sm font-semibold tracking-tight text-[var(--color-ink)]">
          BUNKER<span className="text-[var(--color-accent)]">·</span>DESK
        </div>
        <div className="mt-0.5 text-[10px] uppercase tracking-widest text-[var(--color-ink-faint)]">
          Marine Fuels Intelligence
        </div>
      </div>
      <ul className="flex-1 py-1.5">
        {NAV.map((n) => {
          const active = path === n.href;
          return (
            <li key={n.href}>
              <Link
                href={n.href}
                className={`flex items-center gap-2 px-4 py-2 text-[13px] transition-colors ${
                  active
                    ? "bg-[var(--color-panel-2)] text-[var(--color-ink)] shadow-[inset_2px_0_0_var(--color-accent)]"
                    : "text-[var(--color-ink-dim)] hover:bg-[var(--color-panel-2)] hover:text-[var(--color-ink)]"
                }`}
              >
                <span className="w-12 font-mono text-[10px] text-[var(--color-ink-faint)]">{n.code}</span>
                <span>{n.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-[var(--color-border)] px-4 py-3 text-[10px] leading-relaxed text-[var(--color-ink-faint)]">
        Provenance-first. Every metric carries source · timestamp · freshness. Commercial data is labelled, never faked.
      </div>
    </nav>
  );
}
