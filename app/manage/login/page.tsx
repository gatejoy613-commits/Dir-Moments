import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { i18n } from "@/lib/i18n";
import { currentVendorId, signLoginToken } from "@/lib/auth";
import { sendLoginLink } from "@/lib/email";
import { one } from "@/lib/db";
import { str } from "@/lib/util";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in", robots: { index: false } };

async function requestLink(fd: FormData) {
  "use server";
  const { lang } = await i18n();
  const email = str(fd.get("email")).toLowerCase().slice(0, 160);
  if (!email.includes("@")) redirect("/manage/login?error=1");

  const v = await one<{ id: number; name: string; email: string }>(
    "SELECT id, name, email FROM vendors WHERE lower(email) = $1",
    [email],
  );

  // Always report the same thing. Telling an unknown address that it is unknown
  // turns this form into a way to find out which businesses are listed here.
  if (v?.email) {
    const h = await headers();
    const base = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
    const ok = await sendLoginLink(v.email, `${base}/manage/enter?t=${signLoginToken(v.id)}`, v.name, lang);
    if (!ok) redirect("/manage/login?error=send");
  }
  redirect("/manage/login?sent=1");
}

export default async function VendorLogin({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const sp = await searchParams;
  const { lang } = await i18n();
  const am = lang === "am";

  // Already signed in? Nothing to do here.
  if (await currentVendorId()) redirect("/manage");

  return (
    <div style={{ marginTop: "1rem", maxWidth: 440 }} className="stack">
      <h1>{am ? "ወደ መገለጫዎ ይግቡ" : "Sign in to your listing"}</h1>

      {sp.sent ? (
        <>
          <div className="notice">
            <b>{am ? "ኢሜይልዎን ይመልከቱ።" : "Check your email."}</b>{" "}
            {am
              ? "መገለጫዎን የሚከፍት ሊንክ ልከንልዎታል። በ30 ደቂቃ ውስጥ ጊዜው ያበቃል።"
              : "If that address is on a listing, we have sent a link that opens it. The link expires in 30 minutes."}
          </div>
          <p className="small muted">
            {am
              ? "ሊንኩ ካልደረሰዎት የማይፈለጉ መልእክቶች አቃፊዎን ይፈትሹ፤ ወይም እንደገና ይሞክሩ።"
              : "No email? Check your spam folder, or try again in a minute."}
          </p>
          <p><Link className="btn" href="/manage/login">{am ? "እንደገና ላክ" : "Send another link"}</Link></p>
        </>
      ) : (
        <>
          <p className="muted">
            {am
              ? "የተመዘገቡበትን ኢሜይል ያስገቡ፤ መገለጫዎን የሚከፍት ሊንክ እንልክልዎታለን። የሚያስታውሱት የይለፍ ቃል የለም።"
              : "Enter the email you signed up with and we will send you a link that opens your listing. No password to remember."}
          </p>
          {sp.error === "send" && (
            <div className="notice error">
              {am ? "መልእክቱን መላክ አልቻልንም። እባክዎ እንደገና ይሞክሩ።" : "We could not send the email just now. Please try again."}
            </div>
          )}
          {sp.error === "1" && (
            <div className="notice error">{am ? "ትክክለኛ ኢሜይል ያስገቡ።" : "Enter a valid email address."}</div>
          )}
          <form action={requestLink} className="card">
            <div className="field">
              <label htmlFor="email">{am ? "ኢሜይል" : "Email"}</label>
              <input id="email" type="email" name="email" required autoComplete="email" placeholder="you@example.com" />
            </div>
            <button className="btn primary block" type="submit">{am ? "ሊንክ ላክልኝ" : "Email me a link"}</button>
          </form>
          <p className="small muted">
            {am ? "ገና አልተመዘገቡም?" : "Not listed yet?"} <Link href="/join">{am ? "ስራዎን ያስመዝግቡ" : "List your business"}</Link>
          </p>
        </>
      )}
    </div>
  );
}
