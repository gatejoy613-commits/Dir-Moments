import Link from "next/link";
import { CATEGORIES, EVENT_TYPES, SUBCITIES } from "@/lib/catalog";
import { i18n } from "@/lib/i18n";
import { FOUNDING_VENDOR_LIMIT } from "@/lib/tiers";
import { homepagePicks, recentlyVerified, siteStats } from "@/lib/vendors";
import { SearchForm } from "@/components/SearchForm";
import { VendorCard } from "@/components/VendorCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { lang, t } = await i18n();
  const [picks, verified, stats] = await Promise.all([
    homepagePicks(),
    recentlyVerified(),
    siteStats(),
  ]);
  const foundingLeft = Math.max(0, FOUNDING_VENDOR_LIMIT - stats.founding_used);

  return (
    <>
      <section className="hero">
        {/* Decorative: the eyebrow, headline and lede carry the meaning, so no alt text.
            Width and height are set to reserve the space and avoid a layout shift. */}
        <img className="hero-banner" src="/hero.webp" alt="" width={1376} height={467} />
        <div className="hero-body">
        <p className="eyebrow">{t("heroEyebrow")}</p>
        <h1>{t("heroTitle")}</h1>
        <p className="lede">{t("heroLede")}</p>
        <ul className="value-props">
          <li>{t("valueFree")}</li>
          <li>{t("valueNoCommission")}</li>
          <li>{t("valueDirect")}</li>
        </ul>
        </div>
      </section>

      <SearchForm f={{}} lang={lang} compact />

      {/* Proof the directory is inhabited. Read live, so it can never overstate. */}
      {stats.vendors > 0 && (
        <div className="statbar">
          <div><b>{stats.vendors}</b><span>{t("statVendors")}</span></div>
          <div><b>{stats.verified}</b><span>{t("statVerified")}</span></div>
          <div><b>{stats.categories}</b><span>{t("statCategories")}</span></div>
          <div><b>{SUBCITIES.length}</b><span>{t("statSubcities")}</span></div>
        </div>
      )}

      <h2>{t("occasionsTitle")}</h2>
      <p className="muted small">{t("occasionsLede")}</p>
      <div className="occasions">
        {EVENT_TYPES.map((e) => (
          <Link key={e.key} href={`/vendors?occasion=${e.key}`} className="occasion">
            <span className="icon">{e.icon}</span>
            <span className="label">{e.name[lang]}</span>
          </Link>
        ))}
      </div>

      <h2>{t("categories")}</h2>
      <div className="cat-grid">
        {CATEGORIES.map((c) => (
          <Link key={c.key} href={`/vendors?category=${c.key}`} className="cat" style={{ background: c.tint }}>
            <span className="icon">{c.icon}</span>
            <span>{c.name[lang]}</span>
          </Link>
        ))}
      </div>

      {picks.length > 0 && (
        <>
          <h2>{t("seasonPicks")} <span className="tag sponsor" style={{ position: "static" }}>{t("sponsored")}</span></h2>
          <div className="grid">{picks.map((v) => <VendorCard key={v.id} v={v} lang={lang} />)}</div>
        </>
      )}

      {verified.length > 0 && (
        <>
          <h2>{t("recentlyVerified")}</h2>
          <div className="grid">{verified.map((v) => <VendorCard key={v.id} v={v} lang={lang} />)}</div>
        </>
      )}

      <h2>{t("howItWorks")}</h2>
      <ol className="steps">
        <li><b>{t("step1Title")}</b><p className="small muted">{t("step1Body")}</p></li>
        <li><b>{t("step2Title")}</b><p className="small muted">{t("step2Body")}</p></li>
        <li><b>{t("step3Title")}</b><p className="small muted">{t("step3Body")}</p></li>
      </ol>

      <section className="join-cta">
        <h3>{t("joinTitle")}</h3>
        <p className="muted">{t("noCommission")}</p>
        {foundingLeft > 0 && (
          <p className="founding">
            🎁 {t("foundingOffer")} · <b>{foundingLeft}</b> {t("placesLeft")}
          </p>
        )}
        <Link className="btn primary" href="/join">{t("listBusiness")}</Link>
      </section>
    </>
  );
}
