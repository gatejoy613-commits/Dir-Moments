import { NextResponse, type NextRequest } from "next/server";
import { signOut } from "@/lib/auth";

// A route handler, and POST only: a GET would let any image or link on another
// site sign the user out.
export async function POST(req: NextRequest) {
  await signOut();
  return NextResponse.redirect(new URL("/", req.url), 303);
}
