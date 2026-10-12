import { NextResponse, type NextRequest } from "next/server";
import { setVendorSession, verifyLoginToken } from "@/lib/auth";

// The emailed link lands here. The token proves which vendor it is; this
// exchanges it for a session cookie and gets it out of the URL, so the address
// the vendor ends up looking at - and might forward, or leave in history - is
// just /manage.
export async function GET(req: NextRequest) {
  const vendorId = verifyLoginToken(req.nextUrl.searchParams.get("t") ?? "");
  if (!vendorId) {
    return NextResponse.redirect(new URL("/manage/login?error=expired", req.url), 303);
  }
  await setVendorSession(vendorId);
  return NextResponse.redirect(new URL("/manage", req.url), 303);
}
