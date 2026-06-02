// Registry of watchable symbols and where to find their latest value in the
// /api/markets payload. Keeps the watchlist UI decoupled from the payload shape.
import type { Provenance } from "./provenance";

export interface SymbolMeta {
  symbol: string;
  label: string;
  group: "Crude" | "Products" | "FX" | "Spreads";
  pick: (m: MarketsShape) => (Provenance<number> & { why?: string }) | undefined;
}

export interface MarketsShape {
  crude?: { wti: Provenance<number>; brent: Provenance<number> };
  products?: { dieselGC: Provenance<number>; ulsdNYH: Provenance<number>; gasolineGC: Provenance<number> };
  fx?: { eurusd: Provenance<number> };
  spreads?: Record<string, Provenance<number> & { why?: string }>;
}

export const SYMBOLS: SymbolMeta[] = [
  { symbol: "BRENT", label: "Brent crude", group: "Crude", pick: (m) => m.crude?.brent },
  { symbol: "WTI", label: "WTI crude", group: "Crude", pick: (m) => m.crude?.wti },
  { symbol: "ULSD_NYH", label: "ULSD NY Harbor (MGO proxy)", group: "Products", pick: (m) => m.products?.ulsdNYH },
  { symbol: "DIESEL_GC", label: "Diesel US Gulf (MGO proxy)", group: "Products", pick: (m) => m.products?.dieselGC },
  { symbol: "GASOLINE_GC", label: "Gasoline US Gulf", group: "Products", pick: (m) => m.products?.gasolineGC },
  { symbol: "EURUSD", label: "EUR/USD", group: "FX", pick: (m) => m.fx?.eurusd },
  { symbol: "BRENT_WTI", label: "Brent–WTI spread", group: "Spreads", pick: (m) => m.spreads?.brentWti },
  { symbol: "DIESEL_CRACK", label: "GC diesel crack", group: "Spreads", pick: (m) => m.spreads?.dieselCrack },
  { symbol: "GASOLINE_CRACK", label: "GC gasoline crack", group: "Spreads", pick: (m) => m.spreads?.gasolineCrack },
];

export const SYMBOL_MAP: Record<string, SymbolMeta> = Object.fromEntries(SYMBOLS.map((s) => [s.symbol, s]));
