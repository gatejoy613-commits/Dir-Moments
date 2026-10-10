import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { adminCounts } from "@/lib/adminData";
import { CATEGORIES, category } from "@/lib/catalog";
import { completeness, vendorsWhere } from "@/lib/vendors";
import { AdminNav } from "@/components/AdminNav";

export const dynamic = "force-dynamic";

export default async function Vendors({ searchParams }: { searchParams: Promise<{ status?: string; category?: string; q?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const where = ["true"];
  const params: unknown[] = [];
  if (sp.status) { params.push(sp.status); where.push(`v.status = $${params.length + 1}`); }
  if (sp.category) { params.push(sp.category); where.push(`v.category = $${params.length + 1}`); }
  if (sp.q) { params.push(`%${sp.q}%`); where.push(`(v.name ILIKE $${params.length + 1} OR v.phone ILIKE $${params.length + 1})`); }
  const [counts, vendors] = await Promise.all([adminCounts(), vendorsWhere(where.join(" AND "), params, "v.name")]);
  return (
    <>
      <AdminNav current="/admin/vendors" counts={counts} />
      <form className="row" style={{ marginBottom: "1rem" }}>
        <input type="text" name="q" placeholder="Name or phone" defaultValue={sp.q} style={{ flex: 1, minWidth: 140 }} />
        <select name="status" defaultValue={sp.status ?? ""} style={{ width: "auto" }}>
          <option value="">Any status</option>{["pending", "approved", "rejected", "hidden"].map((s) => <option key={s}>{s}</option>)}
        </select>
        <select name="category" defaultValue={sp.category ?? ""} style={{ width: "auto" }}>
          <option value="">Any category</option>{CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.name.en}</option>)}
        </select>
        <button className="btn small">Filter</button>
      </form>
      <div className="table-wrap card"><table>
        <thead><tr><th>Vendor</th><th>Category</th><th>Status</th><th>Plan</th><th>Rating</th><th>Complete</th></tr></thead>
        <tbody>{vendors.map((v) => (
          <tr key={v.id}>
            <td><Link href={`/admin/vendors/${v.id}`}>{v.name}</Link> {v.verified && <span className="tag verified">✓</span>}</td>
            <td>{category(v.category)?.one.en}</td><td>{v.status}</td><td>{v.plan}</td>
            <td>{v.review_count ? `${v.rating.toFixed(1)} (${v.review_count})` : "—"}</td>
            <td>{Math.round(completeness(v) * 100)}%</td>
          </tr>
        ))}</tbody>
      </table></div>
    </>
  );
}
