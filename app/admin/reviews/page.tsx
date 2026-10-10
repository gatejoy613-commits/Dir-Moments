import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { adminCounts } from "@/lib/adminData";
import { moderateReview } from "@/lib/adminActions";
import { q } from "@/lib/db";
import { maskPhone } from "@/lib/util";
import { AdminNav } from "@/components/AdminNav";
import { Stars } from "@/components/Stars";

export const dynamic = "force-dynamic";

export default async function Reviews() {
  await requireAdmin();
  const [counts, rows] = await Promise.all([
    adminCounts(),
    q(`SELECT r.*, v.name AS vendor_name, v.slug,
        (SELECT count(*) FROM reviews r2 WHERE r2.reviewer_phone = r.reviewer_phone)::int AS by_phone
       FROM reviews r JOIN vendors v ON v.id = r.vendor_id
       WHERE r.status IN ('pending', 'flagged') ORDER BY r.status DESC, r.created_at`),
  ]);
  return (
    <>
      <AdminNav current="/admin/reviews" counts={counts} />
      <p className="small muted">Publish real reviews; remove fake or abusive ones. A vendor&apos;s plan never affects this decision.</p>
      {rows.length === 0 && <p className="muted">Nothing to moderate.</p>}
      <div className="stack">
        {rows.map((r) => (
          <div key={r.id} className="card stack">
            <div className="spread">
              <div><b>{r.reviewer_name}</b> <span className="small muted">{maskPhone(r.reviewer_phone)} · {r.by_phone} review(s) from this phone</span></div>
              <span className="tag">{r.status}</span>
            </div>
            <div className="small">for <Link href={`/v/${r.slug}`} target="_blank">{r.vendor_name}</Link> · <Stars rating={r.rating} /></div>
            <p>{r.body}</p>
            {r.status === "flagged" && <div className="notice warn small">Vendor flagged it: {r.flag_reason}</div>}
            <div className="row">
              <form action={moderateReview}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="published" /><input type="hidden" name="back" value="/admin/reviews" />
                <button className="btn small primary">{r.status === "flagged" ? "Keep published" : "Publish"}</button></form>
              <form action={moderateReview}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="removed" /><input type="hidden" name="back" value="/admin/reviews" />
                <button className="btn small danger">Remove</button></form>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
