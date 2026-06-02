import { NextResponse } from "next/server";
import { snapshotStoreStatus, getHistory } from "@/lib/snapshots";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET(req: Request) {
  const symbol = new URL(req.url).searchParams.get("symbol");
  const status = await snapshotStoreStatus();
  const history = symbol ? await getHistory(symbol, 90) : [];
  return NextResponse.json({ fetchedAt: new Date().toISOString(), status, history });
}
