import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { adminCounts } from "@/lib/adminData";
import { activateSubscription, cancelSubscription } from "@/lib/adminActions";
import { q } from "@/lib/db";
import { todayAddis } from "@/lib/ethiopian";
import { AdminNav } from "@/components/AdminNav";

export const dynamic = "force-dynamic";

export default async function Subscriptions() {
  await requireAdmin();
  const today = todayAddis();
  const [counts, requested, active] = await Promise.all([
    adminCounts(),
    q(`SELECT s.*, v.name, v.phone, v.id AS vid FROM subscriptions s JOIN vendors v ON v.id = s.vendor_id WHERE s.status = 'requested' ORDER BY s.created_at`),
    q(`SELECT s.*, v.name, v.phone, v.id AS vid, to_char(s.starts_on, 'YYYY-MM-DD') AS st, to_char(s.ends_on, 'YYYY-MM-DD') AS en, (s.ends_on - $1::date) AS days_left
       FROM subscriptions s JOIN vendors v ON v.id = s.vendor_id WHERE s.status = 'active' AND s.ends_on >= $1::date ORDER BY s.ends_on`, [today]),
  ]);
  return (
    <>
      <AdminNav current="/admin/subscriptions" counts={counts} />
      <h2 style={{ marginTop: 0 }}>Waiting for payment</h2>
      <p className="small muted">Send the vendor a Chapa payment link, then record the reference here to activate the plan. Webhook activation comes with the Chapa integration.</p>
      {requested.length === 0 && <p className="muted">None.</p>}
      <div className="stack">{requested.map((s) => (
        <div key={s.id} className="card spread">
          <div><Link href={`/admin/vendors/${s.vid}`}><b>{s.name}</b></Link> <span className="small muted">{s.phone}</span>
            <div className="small">{s.plan} · {s.term} · ETB {s.amount.toLocaleString()}</div></div>
          <div className="row">
            <form action={activateSubscription} className="row"><input type="hidden" name="id" value={s.id} /><input type="hidden" name="back" value="/admin/subscriptions" />
              <input type="text" name="chapa_ref" placeholder={s.term === "founding" ? "(free)" : "Chapa reference"} style={{ width: 160 }} required={s.term !== "founding"} />
              <button className="btn small primary">{s.term === "founding" ? "Activate" : "Mark paid"}</button></form>
            <form action={cancelSubscription}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="back" value="/admin/subscriptions" /><button className="btn small danger">Cancel</button></form>
          </div>
        </div>
      ))}</div>
      <h2>Active plans</h2>
      <p className="small muted">Highlighted rows end within 7 days: send the renewal reminder by SMS.</p>
      <div className="table-wrap card"><table>
        <thead><tr><th>Vendor</th><th>Phone</th><th>Plan</th><th>Term</th><th>Ends</th><th>Days left</th><th>ETB</th></tr></thead>
        <tbody>{active.map((s) => (
          <tr key={s.id} style={s.days_left <= 7 ? { background: "#fff7e6" } : undefined}>
            <td><Link href={`/admin/vendors/${s.vid}`}>{s.name}</Link></td><td>{s.phone}</td><td>{s.plan}</td><td>{s.term}</td><td>{s.en}</td><td>{s.days_left}</td><td>{s.amount.toLocaleString()}</td>
          </tr>
        ))}</tbody>
      </table></div>
    </>
  );
}
