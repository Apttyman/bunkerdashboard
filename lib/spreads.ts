// Derived refining-economics spreads. Computed ONLY from real Tier-1 inputs.
// Each result is marked derived:true with an explicit inputs[] provenance chain.
// Where a true marine assessment is required but only a proxy exists, the label
// states it is a proxy — it is never presented as a real VLSFO/HSFO assessment.
import { ok, unavailable, type Provenance } from "@/lib/provenance";

const GAL_PER_BBL = 42;

/** product crack = product($/bbl) - crude($/bbl). Inputs may be $/gal (converted). */
export function crackSpread(
  productName: string,
  product: Provenance<number>,
  crudeName: string,
  crude: Provenance<number>,
  opts: { productPerGallon?: boolean; why: string } = { why: "" },
): Provenance<number> & { why?: string } {
  const src = `Derived: ${productName} crack vs ${crudeName}`;
  if (!product.available || product.value == null || !crude.available || crude.value == null) {
    return { ...unavailable<number>({ source: src, sourceTier: 1, reason: "Source error", unit: "$/bbl" }), derived: true, why: opts.why };
  }
  const prodBbl = opts.productPerGallon ? product.value * GAL_PER_BBL : product.value;
  const value = +(prodBbl - crude.value).toFixed(2);
  const asOf = [product.asOf, crude.asOf].filter(Boolean).sort()[0] ?? null;
  return {
    ...ok({
      value,
      unit: "$/bbl",
      source: src,
      sourceTier: 1,
      asOf,
      cadence: "dailySpot",
      derived: true,
      inputs: [product.source, crude.source],
    }),
    why: opts.why,
  };
}

/** simple difference a - b in same unit (e.g. Brent - WTI). */
export function diff(
  name: string,
  a: Provenance<number>,
  b: Provenance<number>,
  unit: string,
  why: string,
): Provenance<number> & { why?: string } {
  const src = `Derived: ${name}`;
  if (!a.available || a.value == null || !b.available || b.value == null) {
    return { ...unavailable<number>({ source: src, sourceTier: 1, reason: "Source error", unit }), derived: true, why };
  }
  const value = +(a.value - b.value).toFixed(2);
  const asOf = [a.asOf, b.asOf].filter(Boolean).sort()[0] ?? null;
  return {
    ...ok({ value, unit, source: src, sourceTier: 1, asOf, cadence: "dailySpot", derived: true, inputs: [a.source, b.source] }),
    why,
  };
}
