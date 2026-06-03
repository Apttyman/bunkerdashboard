// Headless-Chromium renderer for JS-rendered pages (serverless-friendly via
// @sparticuz/chromium + playwright-core). Heavy deps are dynamically imported so
// they only load when actually rendering. Any failure throws and the caller falls
// back to a plain static fetch — the app never breaks if the browser can't launch.

let warned = false;

export async function renderPage(
  url: string,
  opts: { waitUntil?: "load" | "domcontentloaded" | "networkidle"; settleMs?: number; timeoutMs?: number } = {},
): Promise<string> {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const chromiumMod: any = await import("@sparticuz/chromium");
  const chromium: any = chromiumMod.default ?? chromiumMod;
  const { chromium: pw } = await import("playwright-core");

  // No GPU in serverless; keeps Chromium light.
  chromium.setGraphicsMode = false;

  const executablePath = await chromium.executablePath();
  const browser = await pw.launch({
    args: chromium.args,
    executablePath: executablePath || undefined,
    headless: true,
  });
  try {
    const ctx = await browser.newContext({
      userAgent: "BunkerDeskBot/0.1 (personal research; respects robots.txt)",
    });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: opts.waitUntil ?? "networkidle", timeout: opts.timeoutMs ?? 25_000 });
    if (opts.settleMs) await page.waitForTimeout(opts.settleMs);
    return await page.content();
  } finally {
    await browser.close().catch(() => {});
  }
}

/** True when a headless browser is plausibly available (deps installed). */
export function renderAvailable(): boolean {
  try {
    require.resolve("@sparticuz/chromium");
    require.resolve("playwright-core");
    return true;
  } catch {
    if (!warned) { console.warn("[scrape] headless deps not resolvable; static fetch only"); warned = true; }
    return false;
  }
}
