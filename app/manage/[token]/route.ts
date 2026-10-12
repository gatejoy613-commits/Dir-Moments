import { NextResponse, type NextRequest } from "next/server";
import { setVendorSession } from "@/lib/auth";
import { vendorBy } from "@/lib/vendors";

// Vendors who signed up before email login were told to bookmark
// /manage/<secret token>. Those bookmarks still work: this trades the token for
// a session and sends them to /manage, so from then on they are on the new,
// tokenless page.
//
// A route handler rather than a page because only handlers and server actions
// may set cookies; a server component cannot.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const v = await vendorBy("manage_token", token);
  if (!v) return new NextResponse("Not found", { status: 404 });
  await setVendorSession(v.id);
  return NextResponse.redirect(new URL("/manage", _req.url), 303);
}
