import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// v1 admin access is a single shared password. SMS login for clients and vendors comes next.
const COOKIE = "admin_session";

/**
 * Secrets fall back to a known default in development so `npm run dev` works
 * straight after `git clone`. In production that default is public knowledge,
 * so a missing secret must stop the request instead of quietly signing cookies
 * anyone could forge. Checked per call rather than at import time so that
 * `next build` does not need the production secrets present.
 */
function requireSecret(name: "SESSION_SECRET" | "ADMIN_PASSWORD", devFallback: string) {
  const value = process.env[name];
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error(`${name} is not set. Refusing to fall back to a public default in production.`);
  }
  return devFallback;
}

function sign(value: string) {
  return createHmac("sha256", requireSecret("SESSION_SECRET", "dev-secret")).update(value).digest("hex");
}

export async function isAdmin() {
  const c = (await cookies()).get(COOKIE)?.value;
  if (!c) return false;
  const [issued, sig] = c.split(".");
  if (!issued || !sig) return false;
  const expected = sign(issued);
  if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return false;
  return Date.now() - Number(issued) < 7 * 86400000;
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function adminLogin(password: string) {
  const want = requireSecret("ADMIN_PASSWORD", "admin");
  const a = Buffer.from(password);
  const b = Buffer.from(want);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const issued = String(Date.now());
  (await cookies()).set(COOKIE, `${issued}.${sign(issued)}`, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 7 * 86400 });
  return true;
}

export async function adminLogout() {
  (await cookies()).delete(COOKIE);
}

/** Secret link token that lets a vendor manage their profile until SMS login exists. */
export function newManageToken() {
  return randomBytes(18).toString("base64url");
}

// --- Vendor sign-in -------------------------------------------------------
//
// Vendors used to carry a secret link and were told to bookmark it: lose it and
// you lose your profile, forward it and someone else can edit your listing.
// They now sign in with a link emailed to them, which is re-sendable and short
// lived, and the session lives in a cookie rather than in the URL.
//
// Both values below are signed with the same HMAC as the admin cookie but under
// their own prefixes, so a token minted for one purpose can never be replayed
// as the other.

const VENDOR_COOKIE = "vendor_session";
const LOGIN_LINK_TTL = 30 * 60 * 1000;      // emailed link: 30 minutes
const VENDOR_SESSION_TTL = 30 * 86400000;   // stays signed in: 30 days

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * A signed, expiring token for the emailed sign-in link. Stateless on purpose:
 * nothing to store, nothing to clean up, and it stops working on its own.
 */
export function signLoginToken(vendorId: number) {
  const body = `login:${vendorId}:${Date.now() + LOGIN_LINK_TTL}`;
  return `${Buffer.from(body).toString("base64url")}.${sign(body)}`;
}

export function verifyLoginToken(token: string): number | null {
  const [encoded, sig] = (token || "").split(".");
  if (!encoded || !sig) return null;
  let body: string;
  try {
    body = Buffer.from(encoded, "base64url").toString();
  } catch {
    return null;
  }
  if (!constantTimeEqual(sign(body), sig)) return null;

  const [kind, id, expires] = body.split(":");
  if (kind !== "login") return null;
  if (!(Number(expires) > Date.now())) return null;
  const vendorId = Number(id);
  return Number.isInteger(vendorId) && vendorId > 0 ? vendorId : null;
}

export async function setVendorSession(vendorId: number) {
  const body = `session:${vendorId}:${Date.now()}`;
  const value = `${Buffer.from(body).toString("base64url")}.${sign(body)}`;
  (await cookies()).set(VENDOR_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: VENDOR_SESSION_TTL / 1000,
  });
}

/** The signed-in vendor's id, or null. Never trusts anything from the URL. */
export async function currentVendorId(): Promise<number | null> {
  const value = (await cookies()).get(VENDOR_COOKIE)?.value;
  if (!value) return null;
  const [encoded, sig] = value.split(".");
  if (!encoded || !sig) return null;
  let body: string;
  try {
    body = Buffer.from(encoded, "base64url").toString();
  } catch {
    return null;
  }
  if (!constantTimeEqual(sign(body), sig)) return null;

  const [kind, id, issued] = body.split(":");
  if (kind !== "session") return null;
  if (Date.now() - Number(issued) > VENDOR_SESSION_TTL) return null;
  const vendorId = Number(id);
  return Number.isInteger(vendorId) && vendorId > 0 ? vendorId : null;
}

export async function vendorLogout() {
  (await cookies()).delete(VENDOR_COOKIE);
}
