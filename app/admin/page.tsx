import Link from "next/link";
import { one, q } from "@/lib/db";
import { requireAdmin } from "@/lib/accounts";
import { adminCounts } from "@/lib/adminData";
import { todayAddis, addDays } from "@/lib/ethiopian";
import { CATEGORIES } from "@/lib/catalog";
import { AdminNav } from "@/components/AdminNav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false } };

export default async function AdminHome() {
  await requireAdmin();
  const today = todayAddis();
  const since = addDays(today, -30);
  const [counts, k, byCat] = await Promise.all([
    adminCounts(),
    one(`SELECT
      (SELECT count(*) FROM vendors WHERE status = 'approved')::int AS live,
      (SELECT count(*) FROM vendors WHERE status = 'approved' AND verified)::int AS verified,
      (SELECT count(DISTINCT vendor_id) FROM subscriptions WHERE status = 'active' AND $1::date BETWEEN starts_on AND ends_on AND amount > 0)::int AS paying,
      (SELECT count(DISTINCT vendor_id) FROM subscriptions WHERE status = 'active' AND $1::date BETWEEN starts_on AND ends_on)::int AS on_plan,
      (SELECT COALESCE(sum(amount * 30.0 / (ends_on - starts_on + 1)), 0) FROM subscriptions WHERE status = 'active' AND $1::date BETWEEN starts_on AND ends_on)::int AS mrr,
      (SELECT COALESCE(sum(amount), 0) FROM subscriptions WHERE status = 'active' AND starts_on >= $2::date)::int AS collected,
      (SELECT count(*) FROM contact_events WHERE created_at >= $2::date)::int AS taps,
      (SELECT COALESCE(sum(views), 0) FROM vendor_daily_stats WHERE day >= $2::date)::int AS views,
      (SELECT count(*) FROM (SELECT vendor_id FROM contact_events WHERE created_at >= $2::date GROUP BY vendor_id HAVING count(*) >= 5) x)::int AS five_plus,
      (SELECT count(*) FROM subscriptions WHERE status = 'active' AND ends_on BETWEEN $1::date AND $1::date + 7)::int AS expiring`,
      [today, since]),
    q(`SELECT category, count(*) FILTER (WHERE status = 'approved')::int AS live, count(*) FILTER (WHERE status = 'pending')::int AS pending,
        (SELECT count(*) FROM contact_events c JOIN vendors v2 ON v2.id = c.vendor_id WHERE v2.category = v.category AND c.created_at >= $1::date)::int AS taps
       FROM vendors v GROUP BY category`, [since]),
  ]);
  const kpis: [string, number | string][] = [
    ["Live vendors", k.live], ["Verified in person", k.verified], ["On Pro or Featured", k.on_plan], ["Paying vendors", k.paying],
    ["Subscription revenue / month (ETB)", k.mrr.toLocaleString()], ["Collected, last 30 days (ETB)", k.collected.toLocaleString()],
    ["Contact taps, 30 days", k.taps], ["Profile views, 30 days", k.views], ["Vendors with 5+ leads, 30 days", k.five_plus], ["Plans ending in 7 days", k.expiring],
  ];
  return (
    <>
      <AdminNav current="/admin" counts={counts} />
      <div className="kpis">{kpis.map(([label, v]) => <div key={label} className="kpi"><div className="v">{v}</div><div className="small muted">{label}</div></div>)}</div>
      {counts["/admin/queue"] > 0 && <p style={{ marginTop: "1rem" }}><Link className="btn primary" href="/admin/queue">Review {counts["/admin/queue"]} new vendors</Link></p>}
      <h2>By category</h2>
      <div className="table-wrap card"><table>
        <thead><tr><th>Category</th><th>Live</th><th>Pending</th><th>Taps (30d)</th></tr></thead>
        <tbody>{CATEGORIES.map((c) => {
          const r = byCat.find((x) => x.category === c.key);
          return <tr key={c.key}><td>{c.icon} {c.name.en}</td><td>{r?.live ?? 0}</td><td>{r?.pending ?? 0}</td><td>{r?.taps ?? 0}</td></tr>;
        })}</tbody>
      </table></div>
      <p className="small muted" style={{ marginTop: "1rem" }}>Lead-to-booking rate comes from follow-up calls, which aren&apos;t tracked in the app yet.</p>
    </>
  );
}
