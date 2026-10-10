import Link from "next/link";
import { CATEGORIES } from "@/lib/catalog";
import { i18n } from "@/lib/i18n";
import { categoryCounts, homepagePicks, recentlyVerified } from "@/lib/vendors";
import { SearchForm } from "@/components/SearchForm";
import { VendorCard } from "@/components/VendorCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { lang, t } = await i18n();
  const [counts, picks, verified] = await Promise.all([categoryCounts(), homepagePicks(), recentlyVerified()]);
  return (
    <>
      <section className="hero">
        <h1>{lang === "am" ? "ለዝግጅትዎ ትክክለኛውን ባለሙያ ያግኙ" : "Find the right people for your event"}</h1>
        <p className="muted">{t("tagline")}</p>
      </section>
      <SearchForm f={{}} lang={lang} compact />

      <h2>{t("categories")}</h2>
      <div className="cat-grid">
        {CATEGORIES.map((c) => (
          <Link key={c.key} href={`/vendors?category=${c.key}`} className="cat">
            <span className="icon">{c.icon}</span>
            <span>{c.name[lang]}<span className="n">{counts[c.key] ?? 0}</span></span>
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

      <div className="card" style={{ marginTop: "2rem" }}>
        <h3>{t("listBusiness")}</h3>
        <p className="muted">{t("noCommission")}</p>
        <Link className="btn primary" href="/join">{t("listBusiness")}</Link>
      </div>
    </>
  );
}
