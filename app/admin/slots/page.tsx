import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { adminCounts } from "@/lib/adminData";
import { removeSlot } from "@/lib/adminActions";
import { CATEGORIES, SUBCITIES } from "@/lib/catalog";
import { q } from "@/lib/db";
import { addDays, todayAddis } from "@/lib/ethiopian";
import { SLOTS_PER_CATEGORY_SUBCITY } from "@/lib/tiers";
import { AdminNav } from "@/components/AdminNav";

export const dynamic = "force-dynamic";

export default async function Slots({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const thisMonth = todayAddis().slice(0, 8) + "01";
  const nextMonth = addDays(thisMonth, 32).slice(0, 8) + "01";
  const month = sp.month === nextMonth ? nextMonth : thisMonth;
  const [counts, slots] = await Promise.all([
    adminCounts(),
    q("SELECT s.*, v.name, v.id AS vid FROM sponsored_slots s JOIN vendors v ON v.id = s.vendor_id WHERE s.month = $1::date ORDER BY s.category, s.subcity", [month]),
  ]);
  const used = (c: string, s: string) => slots.filter((x) => x.category === c && x.subcity === s).length;
  return (
    <>
      <AdminNav current="/admin/slots" counts={counts} />
      <div className="tabs">
        <Link href="/admin/slots" className={month === thisMonth ? "on" : ""}>{thisMonth.slice(0, 7)}</Link>
        <Link href={`/admin/slots?month=${nextMonth}`} className={month === nextMonth ? "on" : ""}>{nextMonth.slice(0, 7)}</Link>
      </div>
      <p className="small muted">Slots used out of {SLOTS_PER_CATEGORY_SUBCITY} per category and sub-city. Assign slots from a vendor&apos;s admin page.</p>
      <div className="table-wrap card"><table>
        <thead><tr><th></th>{SUBCITIES.map((s) => <th key={s.key} className="small">{s.name.en}</th>)}</tr></thead>
        <tbody>{CATEGORIES.map((c) => (
          <tr key={c.key}><th>{c.icon} {c.name.en}</th>
            {SUBCITIES.map((s) => { const n = used(c.key, s.key); return <td key={s.key} style={{ color: n >= SLOTS_PER_CATEGORY_SUBCITY ? "var(--danger)" : n ? "inherit" : "var(--muted)" }}>{n}</td>; })}
          </tr>
        ))}</tbody>
      </table></div>
      <h2>Holders</h2>
      <div className="table-wrap card"><table>
        <thead><tr><th>Category</th><th>Sub-city</th><th>Vendor</th><th></th></tr></thead>
        <tbody>{slots.map((s) => (
          <tr key={s.id}><td>{s.category}</td><td>{s.subcity}</td><td><Link href={`/admin/vendors/${s.vid}`}>{s.name}</Link></td>
            <td><form action={removeSlot}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="back" value={`/admin/slots?month=${month}`} /><button className="btn small danger">Remove</button></form></td></tr>
        ))}</tbody>
      </table></div>
    </>
  );
}
