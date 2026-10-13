import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { i18n } from "@/lib/i18n";
import { signResetToken } from "@/lib/auth";
import { profileByEmail } from "@/lib/accounts";
import { sendPasswordReset } from "@/lib/email";
import { str } from "@/lib/util";
import { allow, BUSY, clientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Forgot password", robots: { index: false } };

async function requestReset(fd: FormData) {
  "use server";
  const { lang } = await i18n();
  const email = str(fd.get("email")).toLowerCase().slice(0, 160);
  if (!(await allow(`forgot:ip:${await clientIp()}`, 5, 3600))) redirect("/account/forgot?error=busy");
  // Past the per-address limit nothing more is sent, but the page answers as
  // usual, so the limit cannot reveal which addresses have accounts.
  const underLimit = await allow(`forgot:email:${email}`, 3, 3600);
  const profile = underLimit ? await profileByEmail(email) : null;

  // The answer is the same either way: saying "no such account" would turn this
  // form into a way to find out who is registered.
  if (profile) {
    const h = await headers();
    const base = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
    const url = `${base}/account/reset?t=${signResetToken(profile.id)}`;
    const sent = await sendPasswordReset(profile.email, url, profile.name || profile.email, lang);
    if (!sent) redirect("/account/forgot?error=send");
  }
  redirect("/account/forgot?sent=1");
}

export default async function Forgot({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const sp = await searchParams;
  const { lang } = await i18n();
  const am = lang === "am";

  return (
    <div style={{ marginTop: "1rem", maxWidth: 440 }} className="stack">
      <h1>{am ? "የይለፍ ቃል ረሱ?" : "Forgot your password?"}</h1>
      {sp.sent ? (
        <>
          <div className="notice">
            <b>{am ? "ኢሜይልዎን ይመልከቱ።" : "Check your email."}</b>{" "}
            {am
              ? "አካውንት ካለዎት የይለፍ ቃል የሚቀይሩበት ሊንክ ልከንልዎታል። በአንድ ሰዓት ውስጥ ጊዜው ያበቃል።"
              : "If that address has an account, we have sent a link to choose a new password. It expires in an hour."}
          </div>
          <p className="small"><Link href="/account/signin">{am ? "ወደ መግቢያ ተመለስ" : "Back to sign in"}</Link></p>
        </>
      ) : (
        <>
          <p className="muted">{am ? "የተመዘገቡበትን ኢሜይል ያስገቡ።" : "Enter the email you signed up with."}</p>
          {sp.error === "busy" && <div className="notice error">{BUSY[lang]}</div>}
          {sp.error === "send" && (
            <div className="notice error">{am ? "መልእክቱን መላክ አልቻልንም። እንደገና ይሞክሩ።" : "We could not send the email just now. Please try again."}</div>
          )}
          <form action={requestReset} className="card">
            <div className="field">
              <label htmlFor="email">{am ? "ኢሜይል" : "Email"}</label>
              <input id="email" type="email" name="email" required autoComplete="email" />
            </div>
            <button className="btn primary block" type="submit">{am ? "ሊንክ ላክልኝ" : "Email me a reset link"}</button>
          </form>
          <p className="small muted"><Link href="/account/signin">{am ? "ተመለስ" : "Back to sign in"}</Link></p>
        </>
      )}
    </div>
  );
}
