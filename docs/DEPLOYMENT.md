# Deployment — Vercel → bunkerdashboard.cuscoventurescorp.org

Bunker Desk is a Next.js 15 app with live server-side route handlers (`app/api/*`),
so it needs a Node runtime. Vercel runs it with zero extra config — the API routes
become serverless functions automatically.

## 1. Import the repo
1. Go to https://vercel.com → **Add New… → Project**.
2. Import `Apttyman/bunkerdashboard` (authorize GitHub if prompted).
3. Vercel auto-detects **Next.js**. Leave the defaults:
   - Framework preset: **Next.js**
   - Build command: `next build` (default)
   - Output: handled by the Next.js adapter (do **not** set "Output Directory")
   - Install command: `npm install` (default)
   - Root directory: `./` (repo root)
4. **Production branch:** in Project → Settings → Git, set the production branch to
   the branch you want live (e.g. `claude/nice-hamilton-ionOW`, or merge it to `main`
   first and use `main`).

## 2. Set environment variables (before the first build)
Project → **Settings → Environment Variables**. Add these for the **Production**
(and **Preview**) environments. `NEXT_PUBLIC_*` values are inlined at build time, so
they must exist before/at build.

| Key | Value | Required? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://zcjzuabqxjpglazzjqdo.supabase.co` | for audit trail + watchlist |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your `sb_publishable_…` key | for audit trail + watchlist |
| `EIA_API_KEY` | your EIA key | optional (live crude/products) |
| `FRED_API_KEY` | your FRED key | optional (crude/macro) |
| `OPENWEATHER_API_KEY` | your OpenWeather key | optional (chokepoint weather) |
| `ALPHAVANTAGE_API_KEY` | your key | optional (fallback) |
| `TWELVEDATA_API_KEY` | your key | optional (fallback) |
| `SCRAPING_ENABLED` | `false` | keep false |

> The repo never commits secrets (`.env.local` is gitignored), so Vercel won't have
> them unless you add them here. With none set, keyless sources (Stooq, ECB) still
> work and everything else shows an honest "unavailable" state.

After adding/changing env vars, **redeploy** (Deployments → ⋯ → Redeploy) so the new
`NEXT_PUBLIC_*` values are baked into the client bundle.

## 3. Add the custom domain
1. Project → **Settings → Domains → Add** → `bunkerdashboard.cuscoventurescorp.org`.
2. DNS is already configured on your side. For reference, Vercel expects a CNAME:
   ```
   bunkerdashboard.cuscoventurescorp.org.  CNAME  cname.vercel-dns.com.
   ```
   (An ALIAS/A-record flattening to Vercel's anycast IP also works for some DNS
   providers.) Vercel verifies the record and issues a TLS certificate automatically.
3. Wait for the domain status to show **Valid Configuration** + **SSL** issued
   (usually minutes; DNS propagation can take longer).

## 4. Run the Supabase migration (once)
For the audit trail + watchlist to persist, run `supabase/migrations/0001_metric_snapshots.sql`
in the Supabase SQL Editor for project `zcjzuabqxjpglazzjqdo`. Until then those
features degrade honestly (top bar shows "schema pending").

## 5. Verify
- Visit `https://bunkerdashboard.cuscoventurescorp.org` → Morning Brief loads.
- `…/api/health` returns JSON with the live Tier-1 source count.
- `…/api/snapshots` → `status.reachable: true` (and `rows` once the migration is run).
- Top bar shows the UTC clock, live source count, and audit-trail state.

## Ongoing
- Every push to the production branch triggers an automatic build + deploy.
- Pull requests get preview deployments (set the same Preview env vars if you want
  them functional).
- Logs: Vercel → Deployments → a deployment → **Functions** / **Runtime Logs**.

## Notes
- Region/latency: default Vercel region is fine; external APIs and Supabase are
  reached server-side from the function region.
- No `vercel.json` is required; the Next.js preset covers build + routing.
