import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import Link from "next/link";
import { category, EVENT_TYPES, subcityName } from "@/lib/catalog";
import { etb, i18n } from "@/lib/i18n";
import { template, type Section } from "@/lib/templates";
import { todayAddis } from "@/lib/ethiopian";
import { recordView, vendorBy, vendorDetail, type ItemRow, type PackageRow } from "@/lib/vendors";
import { q } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { normalisePhone, str } from "@/lib/util";
import { ContactButtons } from "@/components/ContactButtons";
import { Calendar } from "@/components/Calendar";
import { Stars } from "@/components/Stars";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;
type SP = Promise<Record<string, string | undefined>>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const v = await vendorBy("slug", slug);
  if (!v || v.status !== "approved") return { title: "Not found" };
  const c = category(v.category);
  const desc = `${c?.one.en} in ${v.subcities.map((s) => subcityName(s, "en")).join(", ")}. ${v.bio.slice(0, 140)}`;
  return {
    title: `${v.name} · ${c?.one.en}`,
    description: desc,
    openGraph: { title: v.name, description: desc, images: v.cover_url ? [v.cover_url] : [] },
  };
}

async function submitReview(fd: FormData) {
  "use server";
  const vendorId = Number(fd.get("vendorId"));
  const slug = str(fd.get("slug"));
  const name = str(fd.get("name")).slice(0, 80);
  const phone = normalisePhone(str(fd.get("phone")));
  const rating = Number(fd.get("rating"));
  const body = str(fd.get("body")).slice(0, 2000);
  const eventType = str(fd.get("eventType")) || null;
  if (!name || !phone || !(rating >= 1 && rating <= 5) || body.length < 10) {
    redirect(`/v/${slug}?review=invalid#review-form`);
  }
  // One review per phone number per vendor.
  await q(
    `INSERT INTO reviews (vendor_id, reviewer_name, reviewer_phone, rating, body, event_type)
     SELECT $1, $2, $3, $4, $5, $6
     WHERE EXISTS (SELECT 1 FROM vendors WHERE id = $1 AND status = 'approved')
       AND NOT EXISTS (SELECT 1 FROM reviews WHERE vendor_id = $1 AND reviewer_phone = $3)`,
    [vendorId, name, phone, rating, body, eventType],
  );
  redirect(`/v/${slug}?review=thanks#reviews`);
}

function MediaList({ items, kind }: { items: ItemRow[]; kind?: "video" | "audio" }) {
  return (
    <div className="media-list">
      {items.map((m) => (
        <a key={m.id} href={m.url} target="_blank" rel="noopener nofollow">
          <span>{kind === "audio" ? "🎵" : "▶️"}</span>
          <span>{m.caption || m.url.replace(/^https?:\/\//, "").slice(0, 40)}</span>
        </a>
      ))}
    </div>
  );
}

function Packages({ pkgs, lang }: { pkgs: PackageRow[]; lang: "en" | "am" }) {
  return (
    <div className="pkgs">
      {pkgs.map((p) => (
        <div key={p.id} className="pkg">
          <div className="spread"><b>{lang === "am" && p.name_am ? p.name_am : p.name}</b>
            <span className="price">{p.starting_from ? (lang === "am" ? "ከ " : "From ") : ""}{etb(p.price, lang)}</span>
          </div>
          {p.hours && <div className="small muted">{Number(p.hours)} {lang === "am" ? "ሰዓት" : "hours"}</div>}
          {p.inclusions && <ul className="small" style={{ paddingLeft: "1.1rem", margin: ".4rem 0 0" }}>
            {p.inclusions.split("\n").filter(Boolean).map((line, i) => <li key={i}>{line}</li>)}
          </ul>}
        </div>
      ))}
    </div>
  );
}

export default async function VendorPage({ params, searchParams }: { params: Params; searchParams: SP }) {
  const { slug } = await params;
  const sp = await searchParams;
  const { lang, t, l } = await i18n();
  const v = await vendorBy("slug", slug);
  if (!v) notFound();
  const preview = v.status !== "approved";
  if (preview && sp.preview !== v.manage_token && !(await isAdmin())) notFound();
  if (!preview) await recordView(v.id);

  const { packages, items, busy, reviews } = await vendorDetail(v.id);
  const tpl = template(v.category)!;
  const cat = category(v.category)!;
  const name = lang === "am" && v.name_am ? v.name_am : v.name;
  const bio = (lang === "am" && v.bio_am) || v.bio;
  const h = await headers();
  const url = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}/v/${v.slug}`;

  const renderSection = (s: Section) => {
    const answer = v.sections[s.key];
    if (s.kind === "packages") return packages.length ? <Packages pkgs={packages} lang={lang} /> : null;
    if (s.kind === "gallery") {
      const photos = items.filter((i) => i.section === s.key && i.kind === "photo");
      if (!photos.length) return null;
      return (
        <div className="gallery">
          {photos.map((p) => (
            <figure key={p.id}>
              <img src={p.url} alt={p.caption ?? s.title[lang]} loading="lazy" decoding="async" width={400} height={400} />
              {p.caption && <figcaption>{p.caption}</figcaption>}
            </figure>
          ))}
        </div>
      );
    }
    if (s.kind === "media") {
      const media = items.filter((i) => i.section === s.key && i.kind !== "photo");
      return media.length ? <MediaList items={media} kind={s.media} /> : null;
    }
    if (s.kind === "tags") {
      const tags = answer?.tags ?? [];
      if (!tags.length) return null;
      return <div className="row">{tags.map((k) => <span key={k} className="tag">{s.options?.find((o) => o.key === k)?.name[lang] ?? k}</span>)}</div>;
    }
    const text = (lang === "am" && answer?.am) || answer?.en || answer?.am;
    return text ? <p style={{ whiteSpace: "pre-line" }}>{text}</p> : null;
  };

  const today = todayAddis();
  const jsonLd = {
    "@context": "https://schema.org", "@type": "LocalBusiness", name: v.name, url, telephone: v.phone,
    image: v.cover_url ?? undefined, address: { "@type": "PostalAddress", addressLocality: "Addis Ababa", addressCountry: "ET" },
    ...(v.review_count ? { aggregateRating: { "@type": "AggregateRating", ratingValue: v.rating.toFixed(1), reviewCount: v.review_count } } : {}),
  };

  return (
    <div className={`profile look-${v.look}`} style={{ marginTop: "1rem" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {preview && (
        <div className="notice warn" style={{ marginBottom: "1rem" }}>
          {lang === "am" ? "ቅድመ እይታ፦ ይህ መገለጫ ገና አልጸደቀም።" : `Preview: this profile is ${v.status} and not visible to clients yet.`}
        </div>
      )}
      {/* Tinted with the vendor's own category, so arriving from a category tile feels continuous. */}
      <div className="profile-head" style={{ background: `linear-gradient(160deg, ${cat.tint} 0%, ${cat.tint} 45%, var(--surface) 100%)` }}>
        <div className="cover" style={{ backgroundImage: v.cover_url ? `url("${v.cover_url}")` : undefined }} role="img" aria-label={v.name} />
        <div className="stack">
          <div className="row">
            <Link href={`/vendors?category=${v.category}`} className="tag">{cat.icon} {cat.one[lang]}</Link>
            {v.verified && <span className="tag verified" title={t("verifiedHelp")}>✓ {t("verified")}</span>}
            {v.plan !== "free" && <span className="tag plan">{v.plan === "featured" ? "★ Featured" : "Pro"}</span>}
          </div>
          <h1>{name}</h1>
          {lang === "en" && v.name_am && <div className="muted">{v.name_am}</div>}
          <div>{v.review_count > 0 ? <Stars rating={v.rating} count={v.review_count} label={t("reviews")} /> : <span className="small muted">{t("noReviews")}</span>}</div>
          {v.starting_price != null && <div><span className="muted small">{t("from")}</span> <b className="profile-price">{etb(v.starting_price, lang)}</b></div>}
          <div className="small"><span className="muted">{t("servesIn")}:</span> {v.subcities.map((s) => subcityName(s, lang)).join(", ")}</div>
          <div className="contact-sticky">
            <ContactButtons vendorId={v.id} phone={v.phone} telegram={v.telegram} whatsapp={v.whatsapp}
              labels={{ call: t("call"), telegram: t("telegram"), whatsapp: t("whatsapp") }} />
          </div>
          <div className="row small">
            <span className="muted">{t("share")}:</span>
            <a href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(v.name)}`} target="_blank" rel="noopener">Telegram</a>
            <a href={`https://wa.me/?text=${encodeURIComponent(`${v.name} ${url}`)}`} target="_blank" rel="noopener">WhatsApp</a>
          </div>
        </div>
      </div>

      {bio && (<><h2>{t("about")}</h2><p style={{ whiteSpace: "pre-line" }}>{bio}</p></>)}

      {tpl.sections.map((s) => {
        const content = renderSection(s);
        return content ? <section key={s.key}><h2>{s.title[lang]}</h2>{content}</section> : null;
      })}

      <h2>{t("availability")}</h2>
      <p className="small muted">{t("availabilityHelp")}</p>
      <Calendar start={today} days={70} busy={busy} lang={lang} />

      <h2 id="reviews">{lang === "am" ? "አስተያየቶች" : "Reviews"} {v.review_count > 0 && <Stars rating={v.rating} count={v.review_count} />}</h2>
      {sp.review === "thanks" && <div className="notice">{t("reviewThanks")}</div>}
      {reviews.length === 0 && <p className="muted">{t("noReviews")}</p>}
      {reviews.map((r) => (
        <div key={r.id} className="review">
          <div className="spread">
            <b>{r.reviewer_name}</b>
            <span className="small muted">{r.created_at.toISOString().slice(0, 10)}</span>
          </div>
          <div className="row small">
            <Stars rating={r.rating} />
            {r.event_type && <span className="tag">{EVENT_TYPES.find((e) => e.key === r.event_type)?.name[lang]}</span>}
            {r.status === "flagged" && <span className="tag" title="The vendor asked us to check this review">{t("underReview")}</span>}
          </div>
          <p style={{ marginTop: ".3rem" }}>{r.body}</p>
          {r.vendor_reply && <div className="reply"><b className="small">{t("vendorReply")}</b><div>{r.vendor_reply}</div></div>}
        </div>
      ))}

      {!preview && (
        <details className="more" id="review-form" open={sp.review === "invalid"}>
          <summary>{t("writeReview")}</summary>
          {sp.review === "invalid" && <div className="notice error">{lang === "am" ? "እባክዎ ሁሉንም ይሙሉ፤ ትክክለኛ ስልክ ቁጥር ያስገቡ።" : "Please fill in every field with a valid Ethiopian phone number and at least a sentence."}</div>}
          <p className="small muted">{t("reviewRules")}</p>
          <form action={submitReview} className="card">
            <input type="hidden" name="vendorId" value={v.id} />
            <input type="hidden" name="slug" value={v.slug} />
            <div className="field"><label>{t("yourName")}</label><input type="text" name="name" required maxLength={80} /></div>
            <div className="field"><label>{t("yourPhone")}</label><input type="tel" name="phone" required placeholder="09…" />
              <div className="hint">{lang === "am" ? "አይታተምም። ለማረጋገጥ ብቻ።" : "Not shown publicly. Used to check the review is real."}</div></div>
            <div className="field"><label>{t("eventType")}</label>
              <select name="eventType"><option value="">—</option>{EVENT_TYPES.map((e) => <option key={e.key} value={e.key}>{e.name[lang]}</option>)}</select></div>
            <div className="field"><label>{t("rating")}</label>
              <select name="rating" required defaultValue="5">{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)}</option>)}</select></div>
            <div className="field"><label>{t("yourReview")}</label><textarea name="body" required minLength={10} maxLength={2000} /></div>
            <button className="btn primary" type="submit">{t("submit")}</button>
          </form>
        </details>
      )}
    </div>
  );
}
