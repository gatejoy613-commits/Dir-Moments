import Link from "next/link";
import { CATEGORIES, EVENT_TYPES, category, occasionCategories } from "@/lib/catalog";
import { i18n } from "@/lib/i18n";
import { FOUNDING_VENDOR_LIMIT } from "@/lib/tiers";
import { categoryCounts, homepagePicks, recentlyVerified, siteStats } from "@/lib/vendors";
import { SearchForm } from "@/components/SearchForm";
import { VendorCard } from "@/components/VendorCard";
import { Carousel } from "@/components/Carousel";
import { Slideshow, type Slide } from "@/components/Slideshow";

export const dynamic = "force-dynamic";

// Laid out like apple.com: one idea per full-width band, alternating grey,
// white and black, each opening on a centered headline.
export default async function Home() {
  const { lang, t } = await i18n();
  const [picks, verified, stats, counts] = await Promise.all([
    homepagePicks(),
    recentlyVerified(),
    siteStats(),
    categoryCounts(),
  ]);
  const foundingLeft = Math.max(0, FOUNDING_VENDOR_LIMIT - stats.founding_used);
  const nav = { prev: t("prev"), next: t("next") };
  const photo = (name: string) => ({ src: `/slides/${name}-1376.webp`, srcSet: `/slides/${name}-800.webp 800w, /slides/${name}-1376.webp 1376w` });
  // One slide per celebration; each one is a way straight into its results.
  const slides: Slide[] = [
    { ...photo("wedding"), alt: "", title: t("slideWedding"), text: t("slideWeddingText"), href: "/vendors?occasion=wedding", cta: t("slideWeddingCta") },
    { ...photo("birthday"), alt: "", title: t("slideBirthday"), text: t("slideBirthdayText"), href: "/vendors?occasion=birthday", cta: t("slideBirthdayCta") },
    { ...photo("corporate"), alt: "", title: t("slideCorporate"), text: t("slideCorporateText"), href: "/vendors?occasion=corporate", cta: t("slideCorporateCta") },
    { ...photo("team"), alt: "", title: t("slideTeam"), text: t("slideTeamText"), href: "/vendors", cta: t("browseAll") },
  ];

  return (
    <>
      <div className="bleed flush-top">
        <Slideshow slides={slides} label={t("slidesLabel")}
          labels={{ prev: t("prev"), next: t("next"), pause: t("pause"), play: t("play"), goTo: t("goToSlide"), of: t("slideOf") }} />
      </div>

      <section className="bleed find">
        <div className="inner">
          <SearchForm f={{}} lang={lang} compact title={t("heroTitle")} />
          <p className="reassure">{t("reassure")}</p>
        </div>
      </section>

      {/* Proof the directory is inhabited. Read live, so it can never overstate. */}
      {stats.vendors > 0 && (
        <section className="bleed band dark" aria-labelledby="numbers-title">
          <div className="inner">
            <div className="band-head rise"><h2 id="numbers-title">{t("numbersTitle")}</h2></div>
            <div className="numbers">
              <div><b>{stats.vendors}</b><span>{t("statVendors")}</span></div>
              <div><b>{stats.verified}</b><span>{t("statVerified")}</span></div>
              <div><b>{stats.categories}</b><span>{t("statCategories")}</span></div>
            </div>
          </div>
        </section>
      )}

      <section className="bleed band" aria-labelledby="occasions-title">
        <div className="inner">
          <div className="left-head rise">
            <h2 id="occasions-title">{t("occasionsTitle")} <span className="tone">{t("occasionsTone")}</span></h2>
          </div>
        </div>
        <Carousel label={t("occasionsTitle")} {...nav}>
          {EVENT_TYPES.map((e) => (
            <Link key={e.key} href={`/vendors?occasion=${e.key}`} className="occ-card">
              <h3>{e.name[lang]}</h3>
              <p>{occasionCategories(e.key).slice(0, 4).map((k) => category(k)?.one[lang]).join(", ")}</p>
              <span className="icon" aria-hidden="true">{e.icon}</span>
              <span className="plus" aria-hidden="true">+</span>
              <span className="visually-hidden">{t("seeVendors")}</span>
            </Link>
          ))}
        </Carousel>
      </section>

      <section className="bleed band tight-top" aria-labelledby="cats-title">
        <div className="inner">
          <div className="band-head rise">
            <h2 id="cats-title">{t("categories")}. <span className="tone">{t("categoriesTone")}</span></h2>
          </div>
          <ul className="shelf">
            {CATEGORIES.map((c) => (
              <li key={c.key}>
                <Link href={`/vendors?category=${c.key}`}>
                  <span className="icon" aria-hidden="true">{c.icon}</span>
                  <span className="name">{c.name[lang]}</span>
                  {counts[c.key] ? <span className="n">{counts[c.key]} {t("vendorsShort")}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {(picks.length > 0 || verified.length > 0) && (
        <section className="bleed band gray">
          {picks.length > 0 && (
            <>
              <div className="inner">
                <div className="left-head rise"><h2>{t("seasonPicks")}. <span className="tone">{t("sponsored")}.</span></h2></div>
              </div>
              <Carousel label={t("seasonPicks")} {...nav}>
                {picks.map((v) => <VendorCard key={v.id} v={v} lang={lang} />)}
              </Carousel>
            </>
          )}
          {verified.length > 0 && (
            <>
              <div className="inner" style={{ marginTop: picks.length ? "3.5rem" : 0 }}>
                <div className="left-head rise spread">
                  <h2>{t("recentlyVerified")}. <span className="tone">{t("verifiedTone")}</span></h2>
                  <Link className="more-link" href="/vendors?verified=1">{t("browseAll")}</Link>
                </div>
              </div>
              <Carousel label={t("recentlyVerified")} {...nav}>
                {verified.map((v) => <VendorCard key={v.id} v={v} lang={lang} />)}
              </Carousel>
            </>
          )}
        </section>
      )}

      <section className="bleed band" aria-labelledby="how-title">
        <div className="inner">
          <div className="band-head rise"><h2 id="how-title">{t("howItWorks")}. <span className="tone">{t("howTone")}</span></h2></div>
          <ol className="tiles" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            <li className="tile"><span className="num">1</span><h3>{t("step1Title")}</h3><p>{t("step1Body")}</p></li>
            <li className="tile"><span className="num">2</span><h3>{t("step2Title")}</h3><p>{t("step2Body")}</p></li>
            <li className="tile"><span className="num">3</span><h3>{t("step3Title")}</h3><p>{t("step3Body")}</p></li>
          </ol>
        </div>
      </section>

      <section className="bleed band dark join-band photo flush-bottom" aria-labelledby="join-title">
        <img src="/slides/vendors-1376.webp" srcSet="/slides/vendors-800.webp 800w, /slides/vendors-1376.webp 1376w" sizes="100vw" alt="" loading="lazy" decoding="async" />
        <div className="inner rise">
          <h2 id="join-title">{t("joinTitle")}</h2>
          <p className="sub">{t("noCommission")}</p>
          {foundingLeft > 0 && <p className="founding">{t("foundingOffer")}. {foundingLeft} {t("placesLeft")}.</p>}
          <div className="pills">
            <Link className="btn primary" href="/join">{t("listBusiness")}</Link>
            <Link className="btn" href="/pricing">{t("seePlans")}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
