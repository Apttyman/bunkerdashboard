/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Keep the headless-browser deps out of the webpack bundle; load them as real
  // node modules at runtime (required for @sparticuz/chromium on serverless).
  serverExternalPackages: ["@sparticuz/chromium", "playwright-core"],
  // Ensure the Chromium binary is traced into the scrape function on deploy.
  outputFileTracingIncludes: {
    "/api/scrape": ["./node_modules/@sparticuz/chromium/**"],
  },
};

export default nextConfig;
