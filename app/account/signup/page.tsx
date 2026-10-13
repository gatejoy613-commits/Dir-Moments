import { redirect } from "next/navigation";
import Link from "next/link";
import { i18n } from "@/lib/i18n";
import { setUserSession } from "@/lib/auth";
import { createAccount, currentProfile, passwordProblem, type Role } from "@/lib/accounts";
import { homeFor } from "@/lib/roles";
import { str } from "@/lib/util";
import { allow, BUSY, clientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Create an account", robots: { index: false } };

async function signUp(fd: FormData) {
  "use server";
  const name = str(fd.get("name")).slice(0, 80);
  const email = str(fd.get("email")).toLowerCase().slice(0, 160);
  const password = str(fd.get("password"));
  // Only these two are ever self-assignable. An admin is made by changing the
  // role in the database, never by anything a visitor can post.
  const role: Role = str(fd.get("role")) === "vendor" ? "vendor" : "customer";

  if (!(await allow(`signup:ip:${await clientIp()}`, 5, 3600))) redirect("/account/signup?error=busy");
  if (!name) redirect("/account/signup?error=name");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) redirect("/account/signup?error=email");
  if (passwordProblem(password)) redirect("/account/signup?error=weak");

  const res = await createAccount(email, password, name, role);
  if (!res.ok) redirect(`/account/signup?error=${res.error}`);
  await setUserSession(res.profile.id);
  // A new vendor has no listing yet, so send them straight to creating one.
  redirect(role === "vendor" ? "/join" : homeFor(role));
}

export default async function SignUp({ searchParams }: { searchParams: Promise<{ error?: string; as?: string }> }) {
  const sp = await searchParams;
  const { lang } = await i18n();
  const am = lang === "am";
  const me = await currentProfile();
  if (me) redirect(homeFor(me.role));

  const errors: Record<string, [string, string]> = {
    name: ["Enter your name.", "ስምዎን ያስገቡ።"],
    email: ["Enter a valid email address.", "ትክክለኛ ኢሜይል ያስገቡ።"],
    weak: ["Use at least 8 characters for your password.", "የይለፍ ቃልዎ ቢያንስ 8 ፊደል ይሁን።"],
    taken: ["That email already has an account. Sign in instead.", "ይህ ኢሜይል አስቀድሞ አካውንት አለው። ይግቡ።"],
    failed: ["We could not create the account just now. Please try again.", "አካውንቱን መፍጠር አልቻልንም። እንደገና ይሞክሩ።"],
    busy: [BUSY.en, BUSY.am],
  };
  const err = sp.error ? errors[sp.error] : undefined;
  const asVendor = sp.as === "vendor";

  return (
    <div style={{ marginTop: "1rem", maxWidth: 440 }} className="stack">
      <h1>{am ? "አካውንት ይፍጠሩ" : "Create an account"}</h1>
      {err && <div className="notice error">{am ? err[1] : err[0]}</div>}
      <form action={signUp} className="card">
        <div className="field">
          <label htmlFor="name">{am ? "ስም" : "Your name"}</label>
          <input id="name" type="text" name="name" required maxLength={80} autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="email">{am ? "ኢሜይል" : "Email"}</label>
          <input id="email" type="email" name="email" required autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="password">{am ? "የይለፍ ቃል" : "Password"}</label>
          <input id="password" type="password" name="password" required minLength={8} autoComplete="new-password" />
          <div className="hint">{am ? "ቢያንስ 8 ፊደል።" : "At least 8 characters."}</div>
        </div>
        <fieldset style={{ padding: ".75rem", margin: "0 0 .9rem" }}>
          <legend className="small">{am ? "እዚህ ያሉት ለምንድነው?" : "What brings you here?"}</legend>
          <div className="checks">
            <label><input type="radio" name="role" value="customer" defaultChecked={!asVendor} /> {am ? "ዝግጅት እያዘጋጀሁ ነው" : "I am planning an event"}</label>
            <label><input type="radio" name="role" value="vendor" defaultChecked={asVendor} /> {am ? "ስራዬን ማስመዝገብ እፈልጋለሁ" : "I want to list my business"}</label>
          </div>
        </fieldset>
        <button className="btn primary block" type="submit">{am ? "አካውንት ፍጠር" : "Create account"}</button>
      </form>
      <p className="small muted">
        {am ? "አካውንት አለዎት?" : "Already have an account?"} <Link href="/account/signin">{am ? "ይግቡ" : "Sign in"}</Link>
      </p>
    </div>
  );
}
