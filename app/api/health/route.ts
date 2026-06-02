import { NextResponse } from "next/server";
import { sourceStatuses } from "@/lib/adapters/registry";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET() {
  const sources = sourceStatuses();
  const summary = {
    tier1Live: sources.filter((s) => s.tier === 1 && s.enabled).length,
    tier1Total: sources.filter((s) => s.tier === 1).length,
    tier3Enabled: sources.filter((s) => s.tier === 3 && s.enabled).length,
    tier4Configured: sources.filter((s) => s.tier === 4 && s.configured).length,
  };
  return NextResponse.json({ fetchedAt: new Date().toISOString(), summary, sources });
}
