import { cookies } from "next/headers";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * One HMAC behind every signed value the app issues - session cookies and
 * password reset links - each under its own prefix so none can be replayed as
 * another.
 *
 * The secret falls back to a known default in development so `npm run dev`
 * works straight after `git clone`. In production that default is public
 * knowledge, so a missing secret must stop the request rather than quietly
 * signing cookies anyone could forge. Checked per call rather than at import,
 * so `next build` does not need the production secret present.
 */
function sign(value: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET is not set. Refusing to fall back to a public default in production.");
    }
    return createHmac("sha256", "dev-secret").update(value).digest("hex");
  }
  return createHmac("sha256", secret).update(value).digest("hex");
}

/** Opaque token on a vendor row, used to preview a profile that is not approved yet. */
export function newManageToken() {
  return randomBytes(18).toString("base64url");
}

// --- Accounts -------------------------------------------------------------
//
// Supabase Auth checks the password; from there the app keeps its own session,
// signed with the same HMAC as the admin cookie but under its own prefix, so no
// value minted for one purpose can be replayed as another.

const SESSION_COOKIE = "session";
const SESSION_TTL = 30 * 86400000;   // stays signed in: 30 days
const RESET_TTL = 60 * 60 * 1000;    // password reset link: 1 hour

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function seal(body: string) {
  return `${Buffer.from(body).toString("base64url")}.${sign(body)}`;
}

/** Opens a sealed value and checks the signature. Returns the parts, or null. */
function open(value: string | undefined, kind: string): string[] | null {
  const [encoded, sig] = (value || "").split(".");
  if (!encoded || !sig) return null;
  let body: string;
  try {
    body = Buffer.from(encoded, "base64url").toString();
  } catch {
    return null;
  }
  if (!constantTimeEqual(sign(body), sig)) return null;
  const parts = body.split(":");
  return parts[0] === kind ? parts : null;
}

export async function setUserSession(userId: string) {
  (await cookies()).set(SESSION_COOKIE, seal(`user:${userId}:${Date.now()}`), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL / 1000,
  });
}

/** The signed-in account id, or null. Never trusts anything from the URL. */
export async function currentUserId(): Promise<string | null> {
  const parts = open((await cookies()).get(SESSION_COOKIE)?.value, "user");
  if (!parts) return null;
  const [, userId, issued] = parts;
  if (Date.now() - Number(issued) > SESSION_TTL) return null;
  return userId || null;
}

export async function signOut() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** A signed, expiring link for "forgot password". Stateless: nothing to store. */
export function signResetToken(userId: string) {
  return seal(`reset:${userId}:${Date.now() + RESET_TTL}`);
}

export function verifyResetToken(token: string): string | null {
  const parts = open(token, "reset");
  if (!parts) return null;
  const [, userId, expires] = parts;
  if (!(Number(expires) > Date.now())) return null;
  return userId || null;
}
