import { redirect } from "next/navigation";
import { currentUserId } from "./auth";
import { one, q } from "./db";

// Accounts.
//
// Supabase Auth is used strictly as the credential store: it hashes and checks
// passwords, which is the one part of this that must not be hand-rolled. The
// app keeps its own session cookie (see lib/auth.ts) rather than Supabase's JWT
// sessions, which avoids the refresh-token dance and two dependencies, and
// costs nothing here because the app talks to Postgres directly and never uses
// row-level security.
//
// Password resets are sent through our own mailer rather than Supabase's. Their
// reset link carries its token in the URL fragment, which a server cannot read
// without client-side JavaScript or a reconfigured email template; ours is a
// signed link, in both languages, with the copy in one place.

export type Role = "customer" | "vendor" | "admin";

export type Profile = { id: string; email: string; name: string | null; role: Role };

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for accounts. See .env.example.");
  }
  return { url: url.replace(/\/+$/, ""), key };
}

function headers() {
  const { key } = config();
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

export type SignUpResult =
  | { ok: true; profile: Profile }
  | { ok: false; error: "taken" | "weak" | "failed" };

/**
 * Creates the credential in Supabase and the profile row that carries the role.
 *
 * Created already confirmed: the app sends its own mail, and an unconfirmed
 * account that cannot sign in would strand people behind an email we never sent.
 */
export async function createAccount(email: string, password: string, name: string, role: Role): Promise<SignUpResult> {
  const { url } = config();
  const res = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { name } }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 422 && /already|registered|exists/i.test(body)) return { ok: false, error: "taken" };
    if (/password/i.test(body) && /short|weak|least/i.test(body)) return { ok: false, error: "weak" };
    console.error("Supabase rejected the signup:", res.status, body);
    return { ok: false, error: "failed" };
  }

  const user = (await res.json()) as { id: string };
  await q(
    `INSERT INTO profiles (id, email, name, role) VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name`,
    [user.id, email, name || null, role],
  );
  return { ok: true, profile: { id: user.id, email, name: name || null, role } };
}

/** Checks a password. Returns the profile, or null for both a wrong password and an unknown address. */
export async function verifyPassword(email: string, password: string): Promise<Profile | null> {
  const { url } = config();
  const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { user?: { id?: string } };
  const id = body.user?.id;
  return id ? await profileById(id) : null;
}

export async function setPassword(userId: string, password: string): Promise<boolean> {
  const { url } = config();
  const res = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({ password }),
  });
  if (!res.ok) console.error("Could not set password:", res.status, await res.text().catch(() => ""));
  return res.ok;
}

export async function profileById(id: string) {
  return one<Profile>("SELECT id, email, name, role FROM profiles WHERE id = $1", [id]);
}

export async function profileByEmail(email: string) {
  return one<Profile>("SELECT id, email, name, role FROM profiles WHERE lower(email) = lower($1)", [email]);
}

/** Passwords are checked by Supabase; this only stops obviously hopeless ones early. */
export function passwordProblem(password: string): "short" | null {
  return password.length < 8 ? "short" : null;
}

// --- Who is asking -------------------------------------------------------

/** The signed-in account, or null. Resolved from the session cookie only. */
export async function currentProfile(): Promise<Profile | null> {
  const id = await currentUserId();
  return id ? await profileById(id) : null;
}

/**
 * Requires one of the given roles. Sends anyone else to sign in rather than
 * showing a forbidden page: the usual reason to be here without a role is
 * simply not being signed in yet.
 */
export async function requireRole(...roles: Role[]): Promise<Profile> {
  const p = await currentProfile();
  if (!p) redirect("/account/signin");
  if (!roles.includes(p.role)) redirect("/account/signin?denied=1");
  return p;
}

/**
 * The listing owned by the signed-in account. Ownership comes from
 * vendors.user_id, so a vendor can only ever reach their own listing - there is
 * no id or token in the request that could point anywhere else.
 */
export async function currentVendorId(): Promise<number | null> {
  const id = await currentUserId();
  if (!id) return null;
  const row = await one<{ id: number }>("SELECT id FROM vendors WHERE user_id = $1", [id]);
  return row?.id ?? null;
}

/** True when the signed-in account is an admin. Used to let admins preview unapproved profiles. */
export async function isAdmin(): Promise<boolean> {
  return (await currentProfile())?.role === "admin";
}

export async function requireAdmin(): Promise<Profile> {
  return requireRole("admin");
}
