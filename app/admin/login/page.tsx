import { login } from "@/lib/adminActions";

export const metadata = { title: "Admin login", robots: { index: false } };

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div style={{ maxWidth: 360, margin: "2rem auto" }}>
      <h1>Admin</h1>
      {error && <div className="notice error">Wrong password.</div>}
      <form action={login} className="card">
        <div className="field"><label>Password</label><input type="password" name="password" required autoFocus /></div>
        <button className="btn primary block">Log in</button>
      </form>
    </div>
  );
}
