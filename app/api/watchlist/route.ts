import { NextResponse } from "next/server";
import { listWatch, addWatch, removeWatch } from "@/lib/watchlist";
import { supabaseConfigured } from "@/lib/supabase";
import { SYMBOL_MAP } from "@/lib/symbols";

export const dynamic = "force-dynamic";

function device(req: Request): string {
  return new URL(req.url).searchParams.get("device")?.slice(0, 64) ?? "";
}

export async function GET(req: Request) {
  const d = device(req);
  return NextResponse.json({ configured: supabaseConfigured(), items: await listWatch(d) });
}

export async function POST(req: Request) {
  const d = device(req);
  const body = await req.json().catch(() => ({}));
  const symbol = String(body.symbol ?? "");
  if (!SYMBOL_MAP[symbol]) return NextResponse.json({ ok: false, error: "Unknown symbol" }, { status: 400 });
  const ok = await addWatch(d, symbol, String(body.note ?? "").slice(0, 280));
  return NextResponse.json({ ok, configured: supabaseConfigured() });
}

export async function DELETE(req: Request) {
  const d = device(req);
  const symbol = new URL(req.url).searchParams.get("symbol") ?? "";
  const ok = await removeWatch(d, symbol);
  return NextResponse.json({ ok });
}
