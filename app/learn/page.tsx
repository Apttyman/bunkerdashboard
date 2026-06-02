"use client";
import { useState } from "react";
import { PageHeader, Card } from "@/components/ui";
import { LEARN_TOPICS, LEARN_CATEGORIES } from "@/lib/content/learn";

export default function Learn() {
  const [cat, setCat] = useState<string>("All");
  const topics = cat === "All" ? LEARN_TOPICS : LEARN_TOPICS.filter((t) => t.category === cat);

  return (
    <div>
      <PageHeader
        code="LEARN"
        title="Learning Mode"
        lead="Every concept in three lines: What is it? · Why does it matter? · How does a trader use it? Designed so a finance professional with no shipping background builds genuine commercial understanding fast."
      />
      <div className="p-5">
        <div className="mb-4 flex flex-wrap gap-1.5">
          {["All", ...LEARN_CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full border px-3 py-1 text-[11px] transition-colors ${
                cat === c
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-ink)]"
                  : "border-[var(--color-border)] text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {topics.map((t) => (
            <Card key={t.id} className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-semibold text-[var(--color-ink)]">{t.term}</h3>
                <span className="rounded-sm bg-[var(--color-panel-2)] px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-[var(--color-ink-faint)]">
                  {t.category}
                </span>
              </div>
              <dl className="mt-2 space-y-1.5 text-[11px] leading-snug">
                <div>
                  <dt className="inline font-semibold text-[var(--color-ink)]">What: </dt>
                  <dd className="inline text-[var(--color-ink-dim)]">{t.what}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-[var(--color-ink)]">Why: </dt>
                  <dd className="inline text-[var(--color-ink-dim)]">{t.why}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-[var(--color-accent)]">How: </dt>
                  <dd className="inline text-[var(--color-ink-dim)]">{t.how}</dd>
                </div>
              </dl>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
