import { one } from "./db";

export async function adminCounts() {
  const r = await one<{ pending: number; reviews: number; subs: number }>(`SELECT
    (SELECT count(*) FROM vendors WHERE status = 'pending')::int AS pending,
    (SELECT count(*) FROM reviews WHERE status IN ('pending', 'flagged'))::int AS reviews,
    (SELECT count(*) FROM subscriptions WHERE status = 'requested')::int AS subs`);
  return { "/admin/queue": r!.pending, "/admin/reviews": r!.reviews, "/admin/subscriptions": r!.subs };
}
