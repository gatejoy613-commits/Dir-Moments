import type { Lang } from "./catalog";

// Transactional email through Resend's REST API with fetch, rather than their
// SDK: this is the only message the app ever sends, and the project runs on
// five dependencies.
//
// Supabase's own auth mailer is not an option here - it sends at most two
// emails an hour for the whole project and only to members of the Supabase
// organisation. It is a testing facility, not something vendors can sign in
// through.

const API = "https://api.resend.com/emails";

function config() {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!key || !from) {
    // A missing mailer is a deployment mistake, not a bad address. Say so once,
    // loudly, rather than telling every vendor to check an inbox nothing was
    // ever sent to.
    throw new Error("RESEND_API_KEY and MAIL_FROM must be set to send sign-in links. See .env.example.");
  }
  return { key, from };
}

const COPY: Record<Lang, (url: string, name: string) => { subject: string; heading: string; body: string; button: string; footer: string }> = {
  en: (url, name) => ({
    subject: "Your Dir Moments sign-in link",
    heading: `Sign in to ${name}`,
    body: "Tap the button to manage your listing. The link works once and expires in 30 minutes.",
    button: "Open my listing",
    footer: "If you did not ask for this, you can ignore this email - nobody can reach your listing without the link.",
  }),
  am: (url, name) => ({
    subject: "የዲር ሞመንትስ መግቢያ ሊንክ",
    heading: `ወደ ${name} ይግቡ`,
    body: "መገለጫዎን ለማስተካከል ከታች ያለውን ይንኩ። ሊንኩ በ30 ደቂቃ ውስጥ ጊዜው ያበቃል።",
    button: "መገለጫዬን ክፈት",
    footer: "ይህንን ካልጠየቁ ይህን መልእክት ችላ ይበሉት።",
  }),
};

function render(url: string, name: string, lang: Lang) {
  const t = COPY[lang](url, name);
  // Inline styles and a plain-text part: every mail client strips stylesheets,
  // and some vendors will read this on a phone with images off.
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
 * Sends a sign-in link. Returns false if the message could not be handed to
 * Resend, so the caller can say something honest rather than sending the vendor
 * to an inbox that will stay empty.
 */
export async function sendLoginLink(to: string, url: string, vendorName: string, lang: Lang): Promise<boolean> {
  const { key, from } = config();
  const { subject, html, text } = render(url, vendorName, lang);
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html, text }),
    });
    if (!res.ok) {
      console.error("Resend rejected the sign-in email:", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (e) {
    console.error("Could not reach Resend:", e);
    return false;
  }
}
