import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Gate the ENTIRE app behind the access token (cookie set at /login). This makes
// the whole dashboard — including scraped personal-use data — private, not public.
// If SCRAPE_ACCESS_TOKEN is unset, the app stays open (no accidental lockout).
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|login|api/login).*)"],
};

export function middleware(req: NextRequest) {
  const token = process.env.SCRAPE_ACCESS_TOKEN;
  if (!token) return NextResponse.next();

  const authed = req.cookies.get("bunker_auth")?.value === token;
  if (authed) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}
