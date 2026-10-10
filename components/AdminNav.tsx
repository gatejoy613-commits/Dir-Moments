import Link from "next/link";
import { logout } from "@/lib/adminActions";

const TABS = [
  ["/admin", "Dashboard"], ["/admin/queue", "Approval queue"], ["/admin/vendors", "Vendors"],
  ["/admin/reviews", "Reviews"], ["/admin/subscriptions", "Subscriptions"], ["/admin/slots", "Sponsored slots"],
];

export function AdminNav({ current, counts }: { current: string; counts?: Record<string, number> }) {
  return (
    <div style={{ marginTop: "1rem" }}>
      <div className="spread"><h1>Admin</h1><form action={logout}><button className="btn small">Log out</button></form></div>
      <nav className="tabs">
        {TABS.map(([href, label]) => (
          <Link key={href} href={href} className={current === href ? "on" : ""}>{label}{counts?.[href] ? ` (${counts[href]})` : ""}</Link>
        ))}
      </nav>
    </div>
  );
}
