// Tier 3 — controlled scraping scaffold. ISOLATED from the UI and DISABLED by
// default (SCRAPING_ENABLED must be "true"). No connector is enabled here; each
// documents the robots.txt + ToS gate that must be cleared before activation.
import type { ScrapeAdapter } from "./types";

export function scrapingEnabled(): boolean {
  return process.env.SCRAPING_ENABLED === "true";
}

// Example connector definitions — intentionally non-functional. They exist to
// document the legal gate and to provide a uniform interface for a future,
// reviewed implementation. enabled() is gated by the global flag AND a
// per-connector review having been completed (here, always false).
export const scrapeConnectors: ScrapeAdapter[] = [
  {
    id: "shipandbunker",
    name: "Ship & Bunker (public price page)",
    tier: 3,
    legalGate:
      "Ship & Bunker Terms of Service restrict automated collection/redistribution. " +
      "Do NOT enable without written permission. Prefer their commercial data feed.",
    enabled: () => false,
    async healthCheck() {
      return { ok: false, detail: "Disabled pending ToS clearance." };
    },
    validateParse(raw: string) {
      return { ok: raw.length > 0, detail: "No parser registered (connector disabled)." };
    },
  },
  {
    id: "balticpublic",
    name: "Baltic Exchange (public content)",
    tier: 3,
    legalGate:
      "Baltic indices are licensed IP; public pages are not a redistribution licence. " +
      "Use the Baltic subscription API (Tier 4) instead.",
    enabled: () => false,
    async healthCheck() {
      return { ok: false, detail: "Disabled pending licence." };
    },
    validateParse(raw: string) {
      return { ok: raw.length > 0, detail: "No parser registered (connector disabled)." };
    },
  },
];
