import Link from "next/link";
import type { Metadata } from "next";
import { EVENT_TYPES, category } from "@/lib/catalog";
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
  return { title: `${what} in Addis Ababa` };
}

export default async function VendorsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { lang, t } = await i18n();
  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : undefined;
  const { sponsored, results, total, page, pages } = await searchVendors({
    category: category(sp.category ?? "") ? sp.category : undefined,
    occasion: EVENT_TYPES.some((e) => e.key === sp.occasion) ? sp.occasion : undefined,
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
  // The category carries its own tint, so the results page looks like the tile the
  // client tapped to get here. Occasions and the unfiltered list fall back to warm.
  const tint = c?.tint ?? "#fdf4e8";
  const shown = total + sponsored.length;

  return (
    <>
      <header className="results-head" style={{ background: `linear-gradient(160deg, ${tint} 0%, ${tint} 42%, var(--surface) 100%)` }}>
        <span className="results-icon" aria-hidden="true">{c ? c.icon : occ ? occ.icon : "🎉"}</span>
        <div>
          <h1>{c ? c.name[lang] : occ ? occ.name[lang] : t("allCategories")}</h1>
          <p className="small results-meta">
            {shown} {t("results")}
            {` · ${t("inAddis")}`}
            {date ? ` · ${t("freeOn")} ${dualDate(date, lang)}` : ""}
          </p>
          {!c && occ && <p className="small muted">{t("occasionNote")}</p>}
        </div>
      </header>
      <SearchForm f={sp as Filters} lang={lang} compact />

      {sponsored.length + results.length === 0 ? (
        <div className="empty">
          <span className="empty-icon" aria-hidden="true">🔎</span>
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
