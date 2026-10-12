import type { Lang } from "./catalog";

// Transactional email through Resend's REST API with fetch, rather than their
// SDK: the app sends one kind of message and the project runs on five
// dependencies.
//
// Password resets go through here rather than through Supabase Auth's own
// mailer, for two reasons. Supabase's built-in sender allows two emails an hour
// for the whole project and only to members of the Supabase organisation. And
// its reset link carries the token in the URL fragment, which a server cannot
// read without client-side JavaScript or a reconfigured dashboard template -
// while this app needs the copy in two languages, in one place.

const API = "https://api.resend.com/emails";

function config() {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!key || !from) {
    // A missing mailer is a deployment mistake, not a bad address. Say so once,
    // loudly, rather than pointing people at an inbox nothing was sent to.
    throw new Error("RESEND_API_KEY and MAIL_FROM must be set to send email. See .env.example.");
  }
  return { key, from };
}

type Words = { subject: string; heading: string; body: string; button: string; footer: string };

const RESET: Record<Lang, (name: string) => Words> = {
  en: (name) => ({
    subject: "Reset your Dir Moments password",
    heading: "Reset your password",
    body: `Someone asked to reset the password for ${name}. Choose a new one below. The link expires in an hour.`,
    button: "Choose a new password",
    footer: "If this was not you, ignore this email. Your password has not changed.",
  }),
  am: (name) => ({
    subject: "የይለፍ ቃልዎን ይቀይሩ",
    heading: "የይለፍ ቃል ይቀይሩ",
    body: `ለ${name} የይለፍ ቃል ለመቀየር ጥያቄ ደርሶናል። አዲስ ለመምረጥ ከታች ይንኩ። ሊንኩ በአንድ ሰዓት ውስጥ ጊዜው ያበቃል።`,
    button: "አዲስ የይለፍ ቃል ይምረጡ",
    footer: "እርስዎ ካልጠየቁ ይህን መልእክት ችላ ይበሉት። የይለፍ ቃልዎ አልተቀየረም።",
  }),
};

function render(url: string, lang: Lang, t: Words) {
  // Inline styles and a plain-text part: mail clients strip stylesheets, and
  // plenty of people will read this on a phone with images off.
  const html = `<!doctype html>
<html lang="${lang}"><body style="margin:0;padding:24px;background:#faf8f5;font-family:system-ui,-apple-system,'Segoe UI',Roboto,'Noto Sans Ethiopic',sans-serif;color:#1d1b19">
  <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e7e1d9;border-radius:14px;padding:28px">
    <div style="font-weight:800;font-size:18px;margin-bottom:18px">Dir<span style="color:#0f6e5a">Moments</span></div>
    <h1 style="font-size:20px;margin:0 0 10px">${t.heading}</h1>
    <p style="margin:0 0 20px;color:#6b645c;line-height:1.5">${t.body}</p>
    <a href="${url}" style="display:inline-block;background:#0f6e5a;color:#fff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:10px">${t.button}</a>
    <p style="margin:22px 0 0;font-size:13px;color:#6b645c;line-height:1.5">${t.footer}</p>
  </div>
</body></html>`;
  return { subject: t.subject, html, text: `${t.heading}\n\n${t.body}\n\n${url}\n\n${t.footer}` };
}

/**
 * Sends a password reset link. Returns false if the message could not be handed
 * to Resend, so the caller can say something honest rather than claiming to
 * have sent mail that never left.
 */
export async function sendPasswordReset(to: string, url: string, name: string, lang: Lang): Promise<boolean> {
  const { key, from } = config();
  const { subject, html, text } = render(url, lang, RESET[lang](name));
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html, text }),
    });
    if (!res.ok) {
      console.error("Resend rejected the email:", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (e) {
    console.error("Could not reach Resend:", e);
    return false;
  }
}
