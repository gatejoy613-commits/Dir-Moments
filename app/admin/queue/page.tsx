import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { adminCounts } from "@/lib/adminData";
import { setVendorStatus, setVerified } from "@/lib/adminActions";
import { category, subcityName } from "@/lib/catalog";
import { completeness, vendorsWhere } from "@/lib/vendors";
import { AdminNav } from "@/components/AdminNav";

export const dynamic = "force-dynamic";

export default async function Queue() {
  await requireAdmin();
  const [counts, vendors] = await Promise.all([adminCounts(), vendorsWhere("v.status = 'pending'", [], "v.created_at ASC")]);
  return (
    <>
      <AdminNav current="/admin/queue" counts={counts} />
      {vendors.length === 0 && <p className="muted">Nothing waiting. 🎉</p>}
      <div className="stack">
        {vendors.map((v) => (
          <div key={v.id} className="card stack">
            <div className="spread">
              <div><b>{v.name}</b> {v.name_am && <span className="muted">· {v.name_am}</span>}
                <div className="small muted">{category(v.category)?.one.en} · {v.subcities.map((s) => subcityName(s, "en")).join(", ")} · {v.phone}{v.telegram ? ` · @${v.telegram}` : ""}</div>
                <div className="small muted">Signed up {v.created_at.toISOString().slice(0, 16).replace("T", " ")} · {Math.round(completeness(v) * 100)}% complete</div>
              </div>
              <div className="row">
                <Link className="btn small" href={`/v/${v.slug}`} target="_blank">Preview</Link>
                <Link className="btn small" href={`/admin/vendors/${v.id}`}>Details</Link>
              </div>
            </div>
            {v.bio && <p className="small">{v.bio.slice(0, 300)}</p>}
            <div className="row">
              <form action={setVendorStatus}><input type="hidden" name="id" value={v.id} /><input type="hidden" name="status" value="approved" /><input type="hidden" name="back" value="/admin/queue" />
                <button className="btn primary small">Approve</button></form>
              <form action={setVerified}>
                <input type="hidden" name="id" value={v.id} /><input type="hidden" name="verified" value={v.verified ? "0" : "1"} /><input type="hidden" name="back" value="/admin/queue" />
                <button className="btn small">{v.verified ? "Unmark verified" : "Mark verified (met in person)"}</button></form>
              <form action={setVendorStatus} className="row" style={{ flex: 1 }}>
                <input type="hidden" name="id" value={v.id} /><input type="hidden" name="status" value="rejected" /><input type="hidden" name="back" value="/admin/queue" />
                <input type="text" name="note" placeholder="Reason shown to the vendor" style={{ flex: 1, minWidth: 160 }} />
                <button className="btn small danger">Reject</button></form>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
