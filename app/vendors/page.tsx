import Link from "next/link";
import type { Metadata } from "next";
import { EVENT_TYPES, category, subcityName } from "@/lib/catalog";
import { i18n } from "@/lib/i18n";
import { dualDate } from "@/lib/ethiopian";
import { searchVendors } from "@/lib/vendors";
import { SearchForm, type Filters } from "@/components/SearchForm";
import { VendorCard } from "@/components/VendorCard";

export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  const c = category(sp.category ?? "");
  const occ = EVENT_TYPES.find((e) => e.key === sp.occasion);
  const what = c ? c.name.en : occ ? `${occ.name.en} vendors` : "Event vendors";
  const where = sp.subcity ? ` in ${subcityName(sp.subcity, "en")}` : " in Addis Ababa";
  return { title: `${what}${where}` };
}

export default async function VendorsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { lang, t } = await i18n();
  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : undefined;
  const { sponsored, results, total, page, pages } = await searchVendors({
    category: category(sp.category ?? "") ? sp.category : undefined,
    occasion: EVENT_TYPES.some((e) => e.key === sp.occasion) ? sp.occasion : undefined,
    subcity: sp.subcity || undefined,
    date,
    q: sp.q?.trim() || undefined,
    maxPrice: Number(sp.maxPrice) || undefined,
    minRating: Number(sp.minRating) || undefined,
    verified: sp.verified === "1",
    page: Number(sp.page) || 1,
  });
  const c = category(sp.category ?? "");
  const occ = EVENT_TYPES.find((e) => e.key === sp.occasion);
  const pageLink = (p: number) => {
    const u = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]);
    u.set("page", String(p));
    return `/vendors?${u}`;
  };
  return (
    <>
      <h1 style={{ marginTop: "1rem" }}>
        {c ? `${c.icon} ${c.name[lang]}` : occ ? `${occ.icon} ${occ.name[lang]}` : t("allCategories")}
        {sp.subcity ? ` · ${subcityName(sp.subcity, lang)}` : ""}
      </h1>
      {!c && occ && <p className="muted small">{t("occasionNote")}</p>}
      <SearchForm f={sp as Filters} lang={lang} compact />
      <p className="muted small" style={{ marginTop: ".75rem" }}>
        {total + sponsored.length} {t("results")}
        {date ? ` · ${t("freeOn")} ${dualDate(date, lang)}` : ""}
      </p>

      {sponsored.length + results.length === 0 ? (
        <div className="notice warn">{t("noResults")}</div>
      ) : (
        <div className="grid">
          {sponsored.map((v) => <VendorCard key={`s${v.id}`} v={v} lang={lang} sponsored />)}
          {results.map((v) => <VendorCard key={v.id} v={v} lang={lang} />)}
        </div>
      )}

      {pages > 1 && (
        <nav className="pager">
          {page > 1 && <Link className="btn small" href={pageLink(page - 1)}>← {t("prev")}</Link>}
          <span className="small muted" style={{ alignSelf: "center" }}>{page} / {pages}</span>
          {page < pages && <Link className="btn small" href={pageLink(page + 1)}>{t("next")} →</Link>}
        </nav>
      )}

      <details className="more" style={{ marginTop: "1.5rem" }}>
        <summary>{t("rankingRules")}</summary>
        <p className="small muted">{t("rankingRulesText")}</p>
      </details>
    </>
  );
}
