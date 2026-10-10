import { NextResponse, type NextRequest } from "next/server";

export function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get("to") === "am" ? "am" : "en";
  const back = req.headers.get("referer");
  let target = "/";
  try {
    if (back) {
      const u = new URL(back);
      if (u.host === req.headers.get("host")) target = u.pathname + u.search;
    }
  } catch {}
  const res = NextResponse.redirect(new URL(target, req.url), 303);
  res.cookies.set("lang", to, { path: "/", maxAge: 365 * 86400, sameSite: "lax" });
  return res;
}
