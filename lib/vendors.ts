import { q, one } from "./db";
import { template } from "./templates";
import { occasionCategories } from "./catalog";
import { todayAddis } from "./ethiopian";
import {
  type Plan, SPONSORED_PER_PAGE, SPONSOR_MIN_RATING, SPONSOR_MAX_NO_SHOWS,
} from "./tiers";

export type VendorRow = {
  id: number;
  slug: string;
  name: string;
  name_am: string | null;
  category: string;
  look: string;
  bio: string;
  bio_am: string;
  sections: Record<string, { en?: string; am?: string; tags?: string[] }>;
  phone: string;
  telegram: string | null;
  whatsapp: string | null;
  starting_price: number | null;
  status: "pending" | "approved" | "rejected" | "hidden";
  verified: boolean;
  no_show_reports: number;
  admin_note: string | null;
  manage_token: string;
  created_at: Date;
  rating: number;
  review_count: number;
  plan: Plan;
  plan_ends_on: string | null;
  cover_url: string | null;
  package_count: number;
  item_sections: string[] | null;
};

// $1 is always "today" in Addis so plan status is evaluated on the local date.
const VENDOR_SELECT = `
SELECT v.*,
  COALESCE(r.avg_rating, 0)::float AS rating,
  COALESCE(r.cnt, 0)::int AS review_count,
  COALESCE(s.plan, 'free') AS plan,
  to_char(s.ends_on, 'YYYY-MM-DD') AS plan_ends_on,
  (SELECT url FROM portfolio_items p WHERE p.vendor_id = v.id AND p.kind = 'photo' ORDER BY position, id LIMIT 1) AS cover_url,
  (SELECT count(*) FROM packages pk WHERE pk.vendor_id = v.id)::int AS package_count,
  (SELECT array_agg(DISTINCT section) FROM portfolio_items p WHERE p.vendor_id = v.id) AS item_sections
FROM vendors v
LEFT JOIN LATERAL (
  SELECT avg(rating) AS avg_rating, count(*) AS cnt FROM reviews
  WHERE vendor_id = v.id AND status IN ('published', 'flagged')
) r ON true
LEFT JOIN LATERAL (
  SELECT plan, ends_on FROM subscriptions
  WHERE vendor_id = v.id AND status = 'active' AND $1::date BETWEEN starts_on AND ends_on
  ORDER BY (plan = 'featured') DESC, ends_on DESC LIMIT 1
) s ON true`;

/** Share of the profile that is filled in, 0..1. Complete profiles rank higher. */
export function completeness(v: VendorRow): number {
  const t = template(v.category);
  const checks: boolean[] = [
    v.bio.trim().length + v.bio_am.trim().length > 40,
    !!(v.telegram || v.whatsapp),
    v.starting_price != null,
    !!v.cover_url,
  ];
  const itemSections = new Set(v.item_sections ?? []);
  for (const s of t?.sections ?? []) {
    if (s.kind === "packages") checks.push(v.package_count > 0);
    else if (s.kind === "gallery" || s.kind === "media") checks.push(itemSections.has(s.key));
    else if (s.kind === "tags") checks.push((v.sections[s.key]?.tags?.length ?? 0) > 0);
    else checks.push(!!(v.sections[s.key]?.en?.trim() || v.sections[s.key]?.am?.trim()));
  }
  return checks.filter(Boolean).length / checks.length;
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Stable shuffle that changes once a day, used to rotate sponsored and homepage picks. */
function dailyRotate<T extends { id: number }>(items: T[], salt: string) {
  const day = todayAddis();
  return [...items].sort((a, b) => hash(`${day}:${salt}:${a.id}`) - hash(`${day}:${salt}:${b.id}`));
}

export type SearchParams = {
  category?: string;
  /** A client-facing occasion (wedding, graduation...). Widens to the categories booked for it. */
  occasion?: string;
  date?: string;
  minRating?: number;
  maxPrice?: number;
  verified?: boolean;
  q?: string;
  page?: number;
};

export const PAGE_SIZE = 12;

export function sponsorEligible(v: VendorRow) {
  return (
    v.plan === "featured" &&
    (v.review_count === 0 || v.rating >= SPONSOR_MIN_RATING) &&
    v.no_show_reports <= SPONSOR_MAX_NO_SHOWS
  );
}

export function score(v: VendorRow, text?: string) {
  const n = v.review_count;
  const bayes = (v.rating * n + 3.5 * 4) / (n + 4); // pulls vendors with few reviews toward the middle
  let s =
    0.4 * (bayes / 5) +
    0.15 * Math.min(1, Math.log(1 + n) / Math.log(30)) +
    0.2 * completeness(v) +
    0.1 * (v.verified ? 1 : 0);
  if (text) {
    const t = text.toLowerCase();
    if (v.name.toLowerCase().includes(t) || (v.name_am ?? "").includes(text)) s += 0.15;
  }
  if (v.plan !== "free") s += 0.08; // Pro and Featured: boost within category
  return s;
}

export async function searchVendors(p: SearchParams) {
  const today = todayAddis();
  const params: unknown[] = [today];
  const where = ["v.status = 'approved'"];
  if (p.category) { params.push(p.category); where.push(`v.category = $${params.length}`); }
  else if (p.occasion) {
    const cats = occasionCategories(p.occasion);
    if (cats.length) { params.push(cats); where.push(`v.category = ANY($${params.length})`); }
  }
  if (p.date) {
    params.push(p.date);
    where.push(`NOT EXISTS (SELECT 1 FROM availability a WHERE a.vendor_id = v.id AND a.day = $${params.length}::date)`);
  }
  if (p.verified) where.push("v.verified");
  if (p.maxPrice) { params.push(p.maxPrice); where.push(`v.starting_price <= $${params.length}`); }
  if (p.q) {
    params.push(`%${p.q}%`);
    const i = params.length;
    where.push(`(v.name ILIKE $${i} OR v.name_am ILIKE $${i} OR v.bio ILIKE $${i} OR v.bio_am ILIKE $${i} OR v.sections::text ILIKE $${i})`);
  }
  let rows = await q<VendorRow>(`${VENDOR_SELECT} WHERE ${where.join(" AND ")}`, params);
  if (p.minRating) rows = rows.filter((v) => v.review_count > 0 && v.rating >= p.minRating!);

  const page = Math.max(1, p.page ?? 1);

  // Sponsored: Featured vendors holding a slot this month for the category (and sub-city when filtered).
  let sponsored: VendorRow[] = [];
  if (page === 1) {
    const month = today.slice(0, 8) + "01";
    const slotParams: unknown[] = [month];
    let slotWhere = "month = $1";
    if (p.category) { slotParams.push(p.category); slotWhere += ` AND category = $${slotParams.length}`; }
    const slotVendors = new Set(
      (await q<{ vendor_id: number }>(`SELECT DISTINCT vendor_id FROM sponsored_slots WHERE ${slotWhere}`, slotParams)).map((r) => r.vendor_id),
    );
    sponsored = dailyRotate(rows.filter((v) => slotVendors.has(v.id) && sponsorEligible(v)), "sponsored").slice(0, SPONSORED_PER_PAGE);
  }
  const sponsoredIds = new Set(sponsored.map((v) => v.id));
  const ranked = rows
    .filter((v) => !sponsoredIds.has(v.id))
    .map((v) => ({ v, s: score(v, p.q) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.v);

  const start = (page - 1) * PAGE_SIZE;
  const results = ranked.slice(start, start + PAGE_SIZE);
  await recordImpressions([...sponsored, ...results].map((v) => v.id));
  return { sponsored, results, total: ranked.length, page, pages: Math.max(1, Math.ceil(ranked.length / PAGE_SIZE)) };
}

export async function homepagePicks(limit = 6) {
  const rows = await q<VendorRow>(`${VENDOR_SELECT} WHERE v.status = 'approved'`, [todayAddis()]);
  return dailyRotate(rows.filter(sponsorEligible), "home").slice(0, limit);
}

export async function recentlyVerified(limit = 6) {
  return q<VendorRow>(
    `${VENDOR_SELECT} WHERE v.status = 'approved' AND v.verified ORDER BY v.verified_at DESC NULLS LAST LIMIT ${limit}`,
    [todayAddis()],
  );
}

/**
 * Headline counts for the landing page. A directory lives or dies on looking
 * inhabited, so these are read live rather than hard-coded. One round trip,
 * because the database may be remote.
 */
export async function siteStats() {
  const r = await one<{ vendors: number; verified: number; categories: number; founding_used: number }>(
    `SELECT
       (SELECT count(*) FROM vendors WHERE status = 'approved')::int AS vendors,
       (SELECT count(*) FROM vendors WHERE status = 'approved' AND verified)::int AS verified,
       (SELECT count(DISTINCT category) FROM vendors WHERE status = 'approved')::int AS categories,
       (SELECT count(DISTINCT vendor_id) FROM subscriptions WHERE term = 'founding')::int AS founding_used`,
  );
  return r!;
}

export async function categoryCounts() {
  const rows = await q<{ category: string; n: number }>(
    "SELECT category, count(*)::int AS n FROM vendors WHERE status = 'approved' GROUP BY category",
  );
  return Object.fromEntries(rows.map((r) => [r.category, r.n])) as Record<string, number>;
}

export async function vendorBy(field: "slug" | "id" | "manage_token", value: string | number) {
  return one<VendorRow>(`${VENDOR_SELECT} WHERE v.${field} = $2`, [todayAddis(), value]);
}

export async function vendorsWhere(where: string, params: unknown[] = [], order = "v.created_at DESC") {
  return q<VendorRow>(`${VENDOR_SELECT} WHERE ${where} ORDER BY ${order}`, [todayAddis(), ...params]);
}

export type PackageRow = { id: number; name: string; name_am: string | null; inclusions: string; hours: string | null; price: number; starting_from: boolean };
export type ItemRow = { id: number; section: string; kind: "photo" | "video" | "audio"; url: string; caption: string | null };
export type ReviewRow = {
  id: number; vendor_id: number; reviewer_name: string; reviewer_phone: string; event_type: string | null; rating: number; body: string;
  vendor_reply: string | null; status: string; flag_reason: string | null; created_at: Date;
};

export async function vendorDetail(vendorId: number) {
  const [packages, items, busy, reviews] = await Promise.all([
    q<PackageRow>("SELECT * FROM packages WHERE vendor_id = $1 ORDER BY position, id", [vendorId]),
    q<ItemRow>("SELECT * FROM portfolio_items WHERE vendor_id = $1 ORDER BY position, id", [vendorId]),
    q<{ day: string }>(
      "SELECT to_char(day, 'YYYY-MM-DD') AS day FROM availability WHERE vendor_id = $1 AND day >= $2::date ORDER BY day",
      [vendorId, todayAddis()],
    ),
    q<ReviewRow>(
      "SELECT * FROM reviews WHERE vendor_id = $1 AND status IN ('published', 'flagged') ORDER BY created_at DESC",
      [vendorId],
    ),
  ]);
  return { packages, items, busy: busy.map((b) => b.day), reviews };
}

export async function recordView(vendorId: number) {
  await q(
    `INSERT INTO vendor_daily_stats (vendor_id, day, views) VALUES ($1, $2, 1)
     ON CONFLICT (vendor_id, day) DO UPDATE SET views = vendor_daily_stats.views + 1`,
    [vendorId, todayAddis()],
  );
}

export async function recordImpressions(ids: number[]) {
  if (!ids.length) return;
  await q(
    `INSERT INTO vendor_daily_stats (vendor_id, day, impressions)
     SELECT unnest($1::int[]), $2::date, 1
     ON CONFLICT (vendor_id, day) DO UPDATE SET impressions = vendor_daily_stats.impressions + 1`,
    [ids, todayAddis()],
  );
}

export async function vendorStats(vendorId: number, category: string, days = 30) {
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const mine = await one<{ views: number; impressions: number; contacts: number }>(
    `SELECT
       COALESCE((SELECT sum(views) FROM vendor_daily_stats WHERE vendor_id = $1 AND day >= $2::date), 0)::int AS views,
       COALESCE((SELECT sum(impressions) FROM vendor_daily_stats WHERE vendor_id = $1 AND day >= $2::date), 0)::int AS impressions,
       (SELECT count(*) FROM contact_events WHERE vendor_id = $1 AND created_at >= $2::date)::int AS contacts`,
    [vendorId, since],
  );
  const avg = await one<{ views: number; contacts: number }>(
    `SELECT
       COALESCE(avg(views), 0)::float AS views, COALESCE(avg(contacts), 0)::float AS contacts
     FROM (
       SELECT v.id,
         COALESCE((SELECT sum(views) FROM vendor_daily_stats s WHERE s.vendor_id = v.id AND s.day >= $2::date), 0) AS views,
         (SELECT count(*) FROM contact_events c WHERE c.vendor_id = v.id AND c.created_at >= $2::date) AS contacts
       FROM vendors v WHERE v.category = $1 AND v.status = 'approved'
     ) t`,
    [category, since],
  );
  const byChannel = await q<{ channel: string; n: number }>(
    "SELECT channel, count(*)::int AS n FROM contact_events WHERE vendor_id = $1 AND created_at >= $2::date GROUP BY channel",
    [vendorId, since],
  );
  return { ...mine!, avg: avg!, byChannel: Object.fromEntries(byChannel.map((r) => [r.channel, r.n])) as Record<string, number> };
}
