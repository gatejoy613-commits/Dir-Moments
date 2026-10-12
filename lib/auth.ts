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
