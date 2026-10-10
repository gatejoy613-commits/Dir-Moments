import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { adminCounts } from "@/lib/adminData";
import { assignSlot, cancelSubscription, grantSubscription, setVendorStatus, setVerified, updateVendorAdmin } from "@/lib/adminActions";
import { category, subcityName } from "@/lib/catalog";
import { q } from "@/lib/db";
import { todayAddis, addDays } from "@/lib/ethiopian";
import { completeness, sponsorEligible, vendorBy, vendorStats } from "@/lib/vendors";
import { PRICES } from "@/lib/tiers";
import { AdminNav } from "@/components/AdminNav";

export const dynamic = "force-dynamic";

export default async function VendorAdmin({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { error } = await searchParams;
  const v = await vendorBy("id", Number(id));
  if (!v) notFound();
  const today = todayAddis();
  const thisMonth = today.slice(0, 8) + "01";
  const nextMonth = addDays(thisMonth, 32).slice(0, 8) + "01";
  const [counts, subs, slots, stats] = await Promise.all([
    adminCounts(),
    q("SELECT *, to_char(starts_on, 'YYYY-MM-DD') AS s, to_char(ends_on, 'YYYY-MM-DD') AS e FROM subscriptions WHERE vendor_id = $1 ORDER BY created_at DESC", [v.id]),
    q("SELECT *, to_char(month, 'YYYY-MM') AS m FROM sponsored_slots WHERE vendor_id = $1 AND month >= $2::date ORDER BY month", [v.id, thisMonth]),
    vendorStats(v.id, v.category),
  ]);
  const backTo = `/admin/vendors/${v.id}`;
  const hidden = (<><input type="hidden" name="id" value={v.id} /><input type="hidden" name="back" value={backTo} /></>);
  return (
    <>
      <AdminNav current="/admin/vendors" counts={counts} />
      {error === "slots-full" && <div className="notice error">All 5 sponsored slots for that category, sub-city and month are taken.</div>}
      <div className="card stack">
        <div className="spread">
          <div><h2 style={{ margin: 0 }}>{v.name}</h2>
            <div className="small muted">{category(v.category)?.one.en} · {v.subcities.map((s) => subcityName(s, "en")).join(", ")} · {v.phone}</div></div>
          <div className="row">
            <Link className="btn small" href={`/v/${v.slug}`} target="_blank">Profile</Link>
            <Link className="btn small" href={`/manage/${v.manage_token}`} target="_blank">Vendor&apos;s private page</Link>
          </div>
        </div>
        <div className="small">Status <b>{v.status}</b> · Plan <b>{v.plan}</b> · {Math.round(completeness(v) * 100)}% complete · {stats.views} views, {stats.contacts} taps in 30 days · sponsor-eligible: {sponsorEligible(v) ? "yes" : "no"}</div>
        <div className="row">
          {(["approved", "hidden", "rejected", "pending"] as const).filter((s) => s !== v.status).map((s) => (
            <form key={s} action={setVendorStatus}>{hidden}<input type="hidden" name="status" value={s} />
              <button className={`btn small ${s === "approved" ? "primary" : s === "hidden" || s === "rejected" ? "danger" : ""}`}>{s === "approved" ? "Approve" : s === "hidden" ? "Hide" : s === "rejected" ? "Reject" : "Back to queue"}</button></form>
          ))}
          <form action={setVerified}>{hidden}<input type="hidden" name="verified" value={v.verified ? "0" : "1"} />
            <button className="btn small">{v.verified ? "Remove verified badge" : "Mark verified (met in person)"}</button></form>
        </div>
      </div>

      <h2>Notes and no-shows</h2>
      <form action={updateVendorAdmin} className="card">
        {hidden}
        <div className="field"><label>No-show reports</label><input type="number" name="no_show_reports" min={0} defaultValue={v.no_show_reports} />
          <div className="hint">More than 1 removes sponsored placement even if the vendor is paying.</div></div>
        <div className="field"><label>Admin note (shown to the vendor when rejected)</label><textarea name="admin_note" defaultValue={v.admin_note ?? ""} /></div>
        <button className="btn small">Save</button>
      </form>

      <h2>Subscriptions</h2>
      <div className="table-wrap card"><table>
        <thead><tr><th>Plan</th><th>Term</th><th>Status</th><th>Dates</th><th>ETB</th><th>Chapa ref</th><th></th></tr></thead>
        <tbody>{subs.map((s) => (
          <tr key={s.id}><td>{s.plan}</td><td>{s.term}</td><td>{s.status}</td><td>{s.s ? `${s.s} → ${s.e}` : "—"}</td><td>{s.amount}</td><td>{s.chapa_ref ?? ""}</td>
            <td>{s.status !== "cancelled" && <form action={cancelSubscription}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="back" value={backTo} /><button className="btn small danger">Cancel</button></form>}</td></tr>
        ))}</tbody>
      </table></div>
      <form action={grantSubscription} className="card row" style={{ marginTop: ".5rem" }}>
        <input type="hidden" name="vendor_id" value={v.id} /><input type="hidden" name="back" value={backTo} />
        <select name="plan" style={{ width: "auto" }}><option value="pro">Pro</option><option value="featured">Featured</option></select>
        <select name="term" style={{ width: "auto" }}><option value="month">Month</option><option value="season">Season (3 mo)</option><option value="year">Year</option><option value="founding">Founding (free 3 mo)</option></select>
        <input type="number" name="amount" placeholder={`ETB, e.g. ${PRICES.pro.month}`} style={{ width: 140 }} />
        <input type="text" name="chapa_ref" placeholder="Chapa reference" style={{ width: 170 }} />
        <button className="btn small primary">Record payment and activate</button>
      </form>

      <h2>Sponsored slots</h2>
      <p className="small muted">Shown only while the vendor is on Featured, rated 3.5+ (or unrated) and has at most 1 no-show report. Max 5 per category, sub-city and month.</p>
      <ul>{slots.map((s) => <li key={s.id}>{s.m} · {subcityName(s.subcity, "en")}</li>)}</ul>
      <form action={assignSlot} className="card row">
        <input type="hidden" name="vendor_id" value={v.id} /><input type="hidden" name="back" value={backTo} />
        <select name="subcity" style={{ width: "auto" }}>{v.subcities.map((s) => <option key={s} value={s}>{subcityName(s, "en")}</option>)}</select>
        <select name="month" style={{ width: "auto" }}><option value={thisMonth}>{thisMonth.slice(0, 7)}</option><option value={nextMonth}>{nextMonth.slice(0, 7)}</option></select>
        <button className="btn small">Assign slot</button>
      </form>
    </>
  );
}
