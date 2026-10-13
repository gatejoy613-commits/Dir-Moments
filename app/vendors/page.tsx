import Link from "next/link";
import type { Metadata } from "next";
import { EVENT_TYPES, category } from "@/lib/catalog";
import { i18n } from "@/lib/i18n";
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
  return { title: `${what} in Addis Ababa` };
}

export default async function VendorsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { lang, t } = await i18n();
  const { sponsored, results, total, page, pages } = await searchVendors({
    category: category(sp.category ?? "") ? sp.category : undefined,
    occasion: EVENT_TYPES.some((e) => e.key === sp.occasion) ? sp.occasion : undefined,
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
  const shown = total + sponsored.length;

  return (
    <>
      {/* The apple.com two-tone headline: what you asked for, then what you got. */}
      <header className="results-head">
        <h1>
          {c ? c.name[lang] : occ ? occ.name[lang] : t("allCategories")}.{" "}
          <span className="tone">
            {c && occ
              ? (lang === "am" ? `ለ${occ.name.am}፣ ${shown} ${t("results")} ${t("inAddis")}።` : `${shown} for a ${occ.name.en.toLowerCase()}, in Addis Ababa.`)
              : `${shown} ${t("results")} ${t("inAddis")}.`}
          </span>
        </h1>
        {!c && occ && <p className="results-note">{t("occasionNote")}</p>}
      </header>
      <SearchForm f={sp as Filters} lang={lang} compact />

      <div className="results-body">
      {sponsored.length + results.length === 0 ? (
        <div className="empty">
          <h2>{t("noResultsTitle")}</h2>
          <p className="muted">{t("noResults")}</p>
          <Link className="btn" href="/vendors">{t("browseAll")}</Link>
        </div>
      ) : (
        <div className="grid">
          {sponsored.map((v) => <VendorCard key={`s${v.id}`} v={v} lang={lang} sponsored />)}
          {results.map((v) => <VendorCard key={v.id} v={v} lang={lang} />)}
        </div>
      )}
      </div>

      {pages > 1 && (
        <nav className="pager">
          {page > 1 && <Link className="btn small" href={pageLink(page - 1)}>← {t("prev")}</Link>}
          <span className="small muted">{page} / {pages}</span>
          {page < pages && <Link className="btn small" href={pageLink(page + 1)}>{t("next")} →</Link>}
        </nav>
      )}

      <details className="more" style={{ marginTop: "2.5rem" }}>
        <summary>{t("rankingRules")}</summary>
        <p className="small muted">{t("rankingRulesText")}</p>
      </details>
    </>
  );
}
