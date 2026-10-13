import { redirect } from "next/navigation";
import Link from "next/link";
import { i18n } from "@/lib/i18n";
import { setUserSession } from "@/lib/auth";
import { currentProfile, verifyPassword } from "@/lib/accounts";
import { homeFor } from "@/lib/roles";
import { str } from "@/lib/util";
import { allowAll, BUSY, clientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in", robots: { index: false } };

async function signIn(fd: FormData) {
  "use server";
  const email = str(fd.get("email")).toLowerCase();
  // Per address as well as per IP, so a password cannot be guessed from many IPs.
  const ip = await clientIp();
  if (!(await allowAll([`signin:ip:${ip}`, 20, 900], [`signin:email:${email}`, 10, 900]))) {
    redirect("/account/signin?error=busy");
  }
  const profile = await verifyPassword(email, str(fd.get("password")));
  // One message for a wrong password and for an unknown address, so this form
  // cannot be used to find out who has an account here.
  if (!profile) redirect("/account/signin?error=1");
  await setUserSession(profile.id);
  redirect(homeFor(profile.role));
}

export default async function SignIn({ searchParams }: { searchParams: Promise<{ error?: string; denied?: string }> }) {
  const sp = await searchParams;
  const { lang } = await i18n();
  const am = lang === "am";
  const me = await currentProfile();
  // Someone signed in who landed here was turned away from a page their role
  // does not reach. Bouncing them home would swallow the reason, so say it.
  if (me && !sp.denied) redirect(homeFor(me.role));

  return (
    <div style={{ marginTop: "1rem", maxWidth: 440 }} className="stack">
      <h1>{me ? (am ? "ፈቃድ የለዎትም" : "No access") : (am ? "ይግቡ" : "Sign in")}</h1>
      {sp.denied && (
        <div className="notice warn">
          {am ? "ይህን ገጽ ለማየት ፈቃድ የለዎትም።" : "Your account does not have access to that page."}
          {me && (
            <>
              {" "}
              <Link href={homeFor(me.role)}>{am ? "ወደ ገጽዎ ይመለሱ" : "Back to your pages"}</Link>
            </>
          )}
        </div>
      )}
      {sp.error && <div className="notice error">{sp.error === "busy" ? BUSY[lang] : am ? "ኢሜይል ወይም የይለፍ ቃል ትክክል አይደለም።" : "That email and password do not match."}</div>}
      {!me && <form action={signIn} className="card">
        <div className="field">
          <label htmlFor="email">{am ? "ኢሜይል" : "Email"}</label>
          <input id="email" type="email" name="email" required autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="password">{am ? "የይለፍ ቃል" : "Password"}</label>
          <input id="password" type="password" name="password" required autoComplete="current-password" />
        </div>
        <button className="btn primary block" type="submit">{am ? "ግባ" : "Sign in"}</button>
      </form>}
      {!me && <p className="small"><Link href="/account/forgot">{am ? "የይለፍ ቃል ረሱ?" : "Forgot your password?"}</Link></p>}
      {!me && <p className="small muted">
        {am ? "አካውንት የለዎትም?" : "No account yet?"} <Link href="/account/signup">{am ? "ይመዝገቡ" : "Create one"}</Link>
      </p>}
    </div>
  );
}
