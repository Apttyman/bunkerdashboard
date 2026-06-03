import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = String(body.token ?? "");
  const want = process.env.SCRAPE_ACCESS_TOKEN;
  if (!want || token !== want) {
    return NextResponse.json({ ok: false, error: "Invalid access token" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("bunker_auth", want, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
