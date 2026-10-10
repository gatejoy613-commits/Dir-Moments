import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// v1 admin access is a single shared password. SMS login for clients and vendors comes next.
const COOKIE = "admin_session";

function sign(value: string) {
  return createHmac("sha256", process.env.SESSION_SECRET || "dev-secret").update(value).digest("hex");
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
  const want = process.env.ADMIN_PASSWORD || "admin";
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
