"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { one, q } from "./db";
import { adminLogin, adminLogout, requireAdmin } from "./auth";
import { addDays, todayAddis } from "./ethiopian";
import { SLOTS_PER_CATEGORY_SUBCITY, TERM_DAYS } from "./tiers";
import { str } from "./util";

function back(fd: FormData, fallback: string) {
  const to = str(fd.get("back"));
  redirect(to.startsWith("/admin") ? to : fallback);
}

export async function login(fd: FormData) {
  const ok = await adminLogin(str(fd.get("password")));
  redirect(ok ? "/admin" : "/admin/login?error=1");
}

export async function logout() {
  await adminLogout();
  redirect("/");
}

export async function setVendorStatus(fd: FormData) {
  await requireAdmin();
  const status = str(fd.get("status"));
  if (!["pending", "approved", "rejected", "hidden"].includes(status)) return;
  await q("UPDATE vendors SET status = $1, admin_note = COALESCE(NULLIF($2, ''), admin_note), updated_at = now() WHERE id = $3",
    [status, str(fd.get("note")), Number(fd.get("id"))]);
  revalidatePath("/admin");
  back(fd, "/admin/queue");
}

export async function setVerified(fd: FormData) {
  await requireAdmin();
  const verified = fd.get("verified") === "1";
  await q("UPDATE vendors SET verified = $1, verified_at = CASE WHEN $1 THEN now() ELSE NULL END WHERE id = $2", [verified, Number(fd.get("id"))]);
  back(fd, "/admin/vendors");
}

export async function updateVendorAdmin(fd: FormData) {
  await requireAdmin();
  await q("UPDATE vendors SET no_show_reports = $1, admin_note = NULLIF($2, '') WHERE id = $3",
    [Math.max(0, Number(fd.get("no_show_reports")) || 0), str(fd.get("admin_note")), Number(fd.get("id"))]);
  back(fd, "/admin/vendors");
}

export async function moderateReview(fd: FormData) {
  await requireAdmin();
  const status = str(fd.get("status"));
  if (!["published", "removed"].includes(status)) return;
  await q("UPDATE reviews SET status = $1 WHERE id = $2", [status, Number(fd.get("id"))]);
  back(fd, "/admin/reviews");
}

/** Activates a subscription after the Chapa payment is confirmed (by hand in the pilot, by webhook later). */
export async function activateSubscription(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const sub = await one<{ term: keyof typeof TERM_DAYS; vendor_id: number }>("SELECT term, vendor_id FROM subscriptions WHERE id = $1", [id]);
  if (!sub) return;
  // Extend from the end of any active plan so paying early never loses days.
  const current = await one<{ e: string }>(
    "SELECT to_char(max(ends_on), 'YYYY-MM-DD') AS e FROM subscriptions WHERE vendor_id = $1 AND status = 'active' AND ends_on >= $2::date",
    [sub.vendor_id, todayAddis()],
  );
  const start = current?.e ? addDays(current.e, 1) : todayAddis();
  const end = addDays(start, TERM_DAYS[sub.term] - 1);
  await q("UPDATE subscriptions SET status = 'active', starts_on = $1, ends_on = $2, chapa_ref = NULLIF($3, '') WHERE id = $4",
    [start, end, str(fd.get("chapa_ref")), id]);
  back(fd, "/admin/subscriptions");
}

export async function grantSubscription(fd: FormData) {
  await requireAdmin();
  const plan = str(fd.get("plan"));
  const term = str(fd.get("term")) as keyof typeof TERM_DAYS;
  if (!["pro", "featured"].includes(plan) || !(term in TERM_DAYS)) return;
  const r = await one<{ id: number }>(
    "INSERT INTO subscriptions (vendor_id, plan, term, amount) VALUES ($1, $2, $3, $4) RETURNING id",
    [Number(fd.get("vendor_id")), plan, term, Number(fd.get("amount")) || 0],
  );
  fd.set("id", String(r!.id));
  await activateSubscription(fd);
}

export async function cancelSubscription(fd: FormData) {
  await requireAdmin();
  await q("UPDATE subscriptions SET status = 'cancelled' WHERE id = $1", [Number(fd.get("id"))]);
  back(fd, "/admin/subscriptions");
}

export async function assignSlot(fd: FormData) {
  await requireAdmin();
  const vendorId = Number(fd.get("vendor_id"));
  const subcity = str(fd.get("subcity"));
  const month = str(fd.get("month"));
  if (!/^\d{4}-\d{2}-01$/.test(month)) return;
  const v = await one<{ category: string }>("SELECT category FROM vendors WHERE id = $1", [vendorId]);
  if (!v) return;
  const used = await one<{ n: number }>("SELECT count(*)::int AS n FROM sponsored_slots WHERE category = $1 AND subcity = $2 AND month = $3", [v.category, subcity, month]);
  if ((used?.n ?? 0) >= SLOTS_PER_CATEGORY_SUBCITY) redirect(`/admin/vendors/${vendorId}?error=slots-full`);
  await q("INSERT INTO sponsored_slots (category, subcity, month, vendor_id) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING", [v.category, subcity, month, vendorId]);
  back(fd, `/admin/vendors/${vendorId}`);
}

export async function removeSlot(fd: FormData) {
  await requireAdmin();
  await q("DELETE FROM sponsored_slots WHERE id = $1", [Number(fd.get("id"))]);
  back(fd, "/admin/slots");
}
