import { redirect } from "next/navigation";
import Link from "next/link";
import { i18n } from "@/lib/i18n";
import { setUserSession, verifyResetToken } from "@/lib/auth";
import { passwordProblem, profileById, setPassword } from "@/lib/accounts";
import { homeFor } from "@/lib/roles";
import { str } from "@/lib/util";

export const dynamic = "force-dynamic";
export const metadata = { title: "Choose a new password", robots: { index: false } };

async function save(fd: FormData) {
  "use server";
  const token = str(fd.get("t"));
  // Re-checked here, not just when the page rendered: the form could have sat
  // open past the hour, or been posted without ever loading the page.
  const userId = verifyResetToken(token);
  if (!userId) redirect("/account/forgot?error=expired");

  const password = str(fd.get("password"));
  if (passwordProblem(password)) redirect(`/account/reset?t=${encodeURIComponent(token)}&error=weak`);
  if (!(await setPassword(userId, password))) redirect(`/account/reset?t=${encodeURIComponent(token)}&error=failed`);

  // Signed in on success: having just proved control of the inbox, making them
  // type the new password again adds nothing.
  const profile = await profileById(userId);
  await setUserSession(userId);
  redirect(profile ? homeFor(profile.role) : "/");
}

export default async function Reset({ searchParams }: { searchParams: Promise<{ t?: string; error?: string }> }) {
  const sp = await searchParams;
  const { lang } = await i18n();
  const am = lang === "am";
  const token = sp.t ?? "";
  const valid = verifyResetToken(token);

  if (!valid) {
    return (
      <div style={{ marginTop: "1rem", maxWidth: 440 }} className="stack">
        <h1>{am ? "ሊንኩ ጊዜው አልፎበታል" : "That link has expired"}</h1>
        <p className="muted">
          {am ? "የይለፍ ቃል መቀየሪያ ሊንኮች ለአንድ ሰዓት ብቻ ይሰራሉ። እባክዎ አዲስ ይጠይቁ።" : "Reset links last an hour. Ask for a new one and it will work."}
        </p>
        <p><Link className="btn primary" href="/account/forgot">{am ? "አዲስ ሊንክ ጠይቅ" : "Send a new link"}</Link></p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "1rem", maxWidth: 440 }} className="stack">
      <h1>{am ? "አዲስ የይለፍ ቃል ይምረጡ" : "Choose a new password"}</h1>
      {sp.error === "weak" && <div className="notice error">{am ? "ቢያንስ 8 ፊደል ይጠቀሙ።" : "Use at least 8 characters."}</div>}
      {sp.error === "failed" && <div className="notice error">{am ? "ማስቀመጥ አልቻልንም። እንደገና ይሞክሩ።" : "We could not save that. Please try again."}</div>}
      <form action={save} className="card">
        <input type="hidden" name="t" value={token} />
        <div className="field">
          <label htmlFor="password">{am ? "አዲስ የይለፍ ቃል" : "New password"}</label>
          <input id="password" type="password" name="password" required minLength={8} autoComplete="new-password" />
          <div className="hint">{am ? "ቢያንስ 8 ፊደል።" : "At least 8 characters."}</div>
        </div>
        <button className="btn primary block" type="submit">{am ? "አስቀምጥና ግባ" : "Save and sign in"}</button>
      </form>
    </div>
  );
}
