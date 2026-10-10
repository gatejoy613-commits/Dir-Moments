import Link from "next/link";
export default function NotFound() {
  return (<div style={{ marginTop: "2rem" }}><h1>Not found</h1><p className="muted">This page doesn&apos;t exist or isn&apos;t public yet.</p><Link href="/vendors">Browse vendors</Link></div>);
}
