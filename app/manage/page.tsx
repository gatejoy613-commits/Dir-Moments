import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { category } from "@/lib/catalog";
import { etb, i18n } from "@/lib/i18n";
import { addDays, dualDate, todayAddis } from "@/lib/ethiopian";
import { completeness, vendorBy, vendorStats } from "@/lib/vendors";
import { one, q } from "@/lib/db";
import { currentVendorId, requireRole } from "@/lib/accounts";
import { FOUNDING_VENDOR_LIMIT, PRICES, TIERS } from "@/lib/tiers";
import { noticeText } from "@/lib/formErrors";
import { str } from "@/lib/util";
import { Stars } from "@/components/Stars";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your profile", robots: { index: false } };

/**
 * Every action re-reads the vendor from the session cookie. Nothing posted with
 * the form decides whose listing is being changed, so a stray or forwarded form
 * cannot act on someone else's profile.
 */
async function currentVendor() {
  await requireRole("vendor", "admin");
  const id = await currentVendorId();
  const v = id ? await vendorBy("id", id) : null;
  if (!v) redirect("/join");
  return v;
}

async function replyReview(fd: FormData) {
  "use server";
  const v = await currentVendor();
  await q("UPDATE reviews SET vendor_reply = $1 WHERE id = $2 AND vendor_id = $3", [str(fd.get("reply")).slice(0, 1000) || null, Number(fd.get("reviewId")), v.id]);
  redirect(`/manage#reviews`);
}

async function flagReview(fd: FormData) {
  "use server";
  const v = await currentVendor();
  await q("UPDATE reviews SET status = 'flagged', flag_reason = $1 WHERE id = $2 AND vendor_id = $3 AND status = 'published'",
    [str(fd.get("reason")).slice(0, 500) || "No reason given", Number(fd.get("reviewId")), v.id]);
  redirect(`/manage#reviews`);
}

async function requestPlan(fd: FormData) {
  "use server";
  const v = await currentVendor();
  const plan = str(fd.get("plan"));
  const term = str(fd.get("term"));
  if (!["pro", "featured"].includes(plan) || !["month", "season", "year", "founding"].includes(term)) return;
  const pending = await one("SELECT 1 FROM subscriptions WHERE vendor_id = $1 AND status = 'requested'", [v.id]);
  if (!pending) {
    let amount = 0;
    if (term === "founding") {
      const used = await one<{ n: number }>("SELECT count(DISTINCT vendor_id)::int AS n FROM subscriptions WHERE term = 'founding'");
      const had = await one("SELECT 1 FROM subscriptions WHERE vendor_id = $1", [v.id]);
      if (plan !== "pro" || had || (used?.n ?? 0) >= FOUNDING_VENDOR_LIMIT) return;
    } else {
      amount = PRICES[plan as "pro" | "featured"][term as "month" | "season" | "year"];
    }
    await q("INSERT INTO subscriptions (vendor_id, plan, term, amount) VALUES ($1, $2, $3, $4)", [v.id, plan, term, amount]);
  }
  redirect(`/manage?requested=1#plan`);
}

export default async function Manage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { lang } = await i18n();
  const am = lang === "am";
  const v = await currentVendor();
  const [stats, allReviews, subs, foundingUsed] = await Promise.all([
    vendorStats(v.id, v.category),
    q("SELECT * FROM reviews WHERE vendor_id = $1 AND status <> 'removed' ORDER BY created_at DESC", [v.id]),
    q("SELECT *, to_char(starts_on, 'YYYY-MM-DD') AS s, to_char(ends_on, 'YYYY-MM-DD') AS e FROM subscriptions WHERE vendor_id = $1 ORDER BY created_at DESC", [v.id]),
    one<{ n: number }>("SELECT count(DISTINCT vendor_id)::int AS n FROM subscriptions WHERE term = 'founding'"),
  ]);
  const cat = category(v.category)!;
  const done = Math.round(completeness(v) * 100);
  const tier = TIERS[v.plan];
  const pendingRequest = subs.find((s) => s.status === "requested");
  const foundingAvailable = !subs.length && (foundingUsed?.n ?? 0) < FOUNDING_VENDOR_LIMIT;
  const statusText: Record<string, [string, string]> = {
    pending: ["Waiting for review. We check every profile, and may call you to arrange an in-person visit for the verified badge.", "በግምገማ ላይ። እያንዳንዱን መገለጫ እንፈትሻለን፤ ለማረጋገጫ ልንደውልልዎ እንችላለን።"],
    approved: ["Live. Clients can find you.", "ታትሟል። ደንበኞች ሊያገኙዎት ይችላሉ።"],
    rejected: ["Not approved. Check the note below and update your profile; saving sends it back to us for another look.", "አልጸደቀም። ማስታወሻውን ይመልከቱ፤ መገለጫዎን አስተካክለው ሲያስቀምጡ እንደገና እንገመግመዋለን።"],
    hidden: ["Hidden by our team. Contact us.", "በቡድናችን ተደብቋል። ያግኙን።"],
  };

  return (
    <div style={{ marginTop: "1rem" }} className="stack">
      {sp.welcome && (
        <div className="notice">
          <b>{am ? "ተመዝግበዋል!" : "You're registered!"}</b>{" "}
          {am ? "መገለጫዎ ተፈጥሯል። በማንኛውም ጊዜ በኢሜይልዎ መግባት ይችላሉ።" : "Your listing is created. You can sign back in any time with your email — nothing to bookmark."}
        </div>
      )}
      {sp.saved && <div className="notice">{am ? "ተቀምጧል።" : "Saved."}</div>}
      {sp.notices?.split(",").map((n) => <div key={n} className="notice warn">{noticeText(n, lang)}</div>)}

      <div className="spread">
        <div>
          <h1>{v.name}</h1>
          <div className="small muted">{cat.icon} {cat.one[lang]} · {v.plan === "free" ? (am ? "ነጻ" : "Free") : v.plan === "pro" ? "Pro" : "Featured"}{v.plan_ends_on ? ` · ${am ? "እስከ" : "until"} ${dualDate(v.plan_ends_on, lang)}` : ""}</div>
        </div>
        <div className="row">
          <Link className="btn" href={`/v/${v.slug}?preview=${v.manage_token}`}>{am ? "መገለጫውን እይ" : "View profile"}</Link>
          <Link className="btn primary" href="/manage/edit">{am ? "አስተካክል" : "Edit profile"}</Link>
          <form action="/account/signout" method="post"><button className="btn small" type="submit">{am ? "ውጣ" : "Sign out"}</button></form>
        </div>
      </div>

      <div className={`notice ${v.status === "approved" ? "" : "warn"}`}>
        <b>{am ? "ሁኔታ" : "Status"}:</b> {statusText[v.status][am ? 1 : 0]} {v.verified && <span className="tag verified">✓ {am ? "የተረጋገጠ" : "Verified"}</span>}
        {v.admin_note && v.status !== "approved" && <div className="small" style={{ marginTop: ".4rem" }}>{v.admin_note}</div>}
      </div>

      <div className="card">
        <div className="spread"><b>{am ? "የመገለጫ ሙሉነት" : "Profile completeness"}</b><span>{done}%</span></div>
        <div className="progress" style={{ marginTop: ".4rem" }}><div style={{ width: `${done}%` }} /></div>
        <p className="small muted" style={{ marginTop: ".4rem" }}>{am ? "ሙሉ መገለጫዎች በፍለጋ ከፍ ብለው ይታያሉ።" : "Complete profiles rank higher in search."}</p>
      </div>

      <h2>{am ? "ያለፉት 30 ቀናት" : "Last 30 days"}</h2>
      <div className="kpis">
        <div className="kpi"><div className="v">{stats.views}</div><div className="small muted">{am ? "የመገለጫ እይታዎች" : "Profile views"}</div></div>
        {tier.stats !== "views" ? (
          <>
            <div className="kpi"><div className="v">{stats.contacts}</div><div className="small muted">{am ? "የመገናኛ ጠቅታዎች" : "Contact taps"}</div>
              <div className="small muted">📞 {stats.byChannel.call ?? 0} · ✈️ {stats.byChannel.telegram ?? 0} · 💬 {stats.byChannel.whatsapp ?? 0}</div></div>
            <div className="kpi"><div className="v">{stats.impressions}</div><div className="small muted">{am ? "በፍለጋ የታዩበት" : "Searches you appeared in"}</div></div>
          </>
        ) : (
          <div className="kpi"><div className="small muted">{am ? "የጥሪና የፍለጋ ስታቲስቲክስ ከፕሮ ጋር ይመጣሉ።" : "Contact taps and search appearances come with Pro."}</div></div>
        )}
        {tier.stats === "full+compare" && (
          <div className="kpi"><div className="small muted">{am ? "የዘርፉ አማካይ" : "Category average"}</div>
            <div>{Math.round(stats.avg.views)} {am ? "እይታ" : "views"} · {stats.avg.contacts.toFixed(1)} {am ? "ጠቅታ" : "taps"}</div></div>
        )}
      </div>

      <h2 id="reviews">{am ? "አስተያየቶች" : "Reviews"}</h2>
      {allReviews.length === 0 && <p className="muted">{am ? "እስካሁን አስተያየት የለም። ደንበኞችዎ እንዲጽፉ ይጠይቁ።" : "No reviews yet. Ask happy clients to leave one on your profile."}</p>}
      {allReviews.map((r) => (
        <div key={r.id} className="review">
          <div className="spread"><b>{r.reviewer_name}</b><Stars rating={r.rating} /></div>
          {r.status !== "published" && <span className="tag">{r.status === "pending" ? (am ? "በግምገማ ላይ" : "Waiting for moderation") : (am ? "ለማጣራት ተጠቁሟል" : "Flagged for our check")}</span>}
          <p>{r.body}</p>
          <form action={replyReview} className="field">
            <input type="hidden" name="reviewId" value={r.id} />
            <textarea name="reply" defaultValue={r.vendor_reply ?? ""} placeholder={am ? "መልስዎ (በይፋ ይታያል)" : "Your public reply"} style={{ minHeight: 60 }} />
            <button className="btn small" type="submit">{am ? "መልስ አስቀምጥ" : "Save reply"}</button>
          </form>
          {r.status === "published" && (
            <details className="more">
              <summary className="small">{am ? "ለማጣራት ጠቁም" : "Flag for our check"}</summary>
              <form action={flagReview} className="row">
                <input type="hidden" name="reviewId" value={r.id} />
                <input type="text" name="reason" placeholder={am ? "ምክንያት" : "Why? e.g. not my client"} style={{ flex: 1 }} />
                <button className="btn small danger" type="submit">{am ? "ጠቁም" : "Flag"}</button>
              </form>
              <p className="small muted">{am ? "ክፍያ አስተያየትን አያስወግድም። እኛ እናጣራለን።" : "Flagging asks us to check; paying never removes a review."}</p>
            </details>
          )}
        </div>
      ))}

      <h2 id="plan">{am ? "እቅድ" : "Plan"}</h2>
      {sp.requested && <div className="notice">{am ? "ጥያቄዎ ደርሶናል። የቻፓ የክፍያ ሊንክ በኤስኤምኤስ እንልክልዎታለን።" : "Request received. We'll send you a Chapa payment link by SMS; your plan starts once payment is confirmed."}</div>}
      {pendingRequest && !sp.requested && (
        <div className="notice warn">{am ? "የክፍያ ጥያቄ በመጠባበቅ ላይ" : "Waiting for payment"}: {pendingRequest.plan} · {pendingRequest.term} · {etb(pendingRequest.amount, lang)}</div>
      )}
      <div className="grid">
        {(["pro", "featured"] as const).map((plan) => (
          <div key={plan} className="card stack">
            <h3>{plan === "pro" ? "Pro" : "Featured"}</h3>
            <p className="small muted">
              {plan === "pro"
                ? (am ? "በዘርፍዎ ቅድሚያ፣ 40 ፎቶዎች፣ ያልተገደበ ፓኬጆች፣ ሙሉ ስታቲስቲክስ።" : "Boost in your category, 40 photos, unlimited packages, full stats, premium looks.")
                : (am ? "ከላይ \"ስፖንሰር\" ቦታ በዘርፍና ክፍለ ከተማ፣ በመነሻ ገጽ ላይ፣ 80 ፎቶዎች።" : "Top \"Sponsored\" slots in your category and sub-city, homepage picks, 80 photos.")}
            </p>
            {plan === "pro" && foundingAvailable && (
              <form action={requestPlan}><input type="hidden" name="plan" value="pro" /><input type="hidden" name="term" value="founding" />
                <button className="btn primary block" type="submit" disabled={!!pendingRequest}>🎁 {am ? "የመስራች ቅናሽ፦ 3 ወር ነጻ" : "Founding offer: 3 months free"}</button>
              </form>
            )}
            {(["month", "season", "year"] as const).map((term) => (
              <form key={term} action={requestPlan}><input type="hidden" name="plan" value={plan} /><input type="hidden" name="term" value={term} />
                <button className="btn block" type="submit" disabled={!!pendingRequest}>
                  {term === "month" ? (am ? "ወርሃዊ" : "Monthly") : term === "season" ? (am ? "የሰርግ ወቅት (3 ወር)" : "Wedding season (3 months)") : (am ? "ዓመታዊ" : "Yearly")} · {etb(PRICES[plan][term], lang)}
                </button>
              </form>
            ))}
          </div>
        ))}
      </div>
      {subs.filter((s) => s.status === "active").length > 0 && (
        <div className="small muted">
          {subs.filter((s) => s.status === "active").map((s) => (
            <div key={s.id}>{s.plan} · {s.term} · {dualDate(s.s, lang)} → {dualDate(s.e, lang)}{s.e < addDays(todayAddis(), 7) && s.e >= todayAddis() ? (am ? " · በቅርቡ ያበቃል" : " · ends soon") : ""}</div>
          ))}
        </div>
      )}
    </div>
  );
}
