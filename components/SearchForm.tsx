import type { Lang } from "@/lib/catalog";
import { CATEGORIES, EVENT_TYPES } from "@/lib/catalog";
import { translator } from "@/lib/i18n";

export type Filters = { occasion?: string; category?: string; q?: string; maxPrice?: string; minRating?: string; verified?: string };

// The celebration comes first: clients arrive planning a wedding or a birthday,
// not shopping for a category. The occasion narrows the list to the vendors
// usually booked for it; picking a category as well narrows it to that one.
export function SearchForm({ f, lang, compact, title }: { f: Filters; lang: Lang; compact?: boolean; title?: string }) {
  const t = translator(lang);
  const advanced = !!(f.maxPrice || f.minRating || f.verified || f.q);
  return (
    <form action="/vendors" method="get" className="search" role="search">
      <div className="search-body">
        {title && <h1 className="search-title">{title}</h1>}
        <div className="filters main">
          <div className="field">
            <label htmlFor="occasion">{t("occasionsTitle")}</label>
            <select id="occasion" name="occasion" defaultValue={f.occasion ?? ""}>
              <option value="">{t("anyOccasion")}</option>
              {EVENT_TYPES.map((e) => <option key={e.key} value={e.key}>{e.icon} {e.name[lang]}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="category">{t("whatDoYouNeed")}</label>
            <select id="category" name="category" defaultValue={f.category ?? ""}>
              <option value="">{t("allCategories")}</option>
              {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.icon} {c.name[lang]}</option>)}
            </select>
          </div>
          <div className="submit wide"><button className="btn primary block" type="submit">{t("showVendors")}</button></div>
        </div>
        <details className="more" open={advanced || !compact}>
          <summary>{t("moreFilters")}</summary>
          <div className="filters">
            <div className="field">
              <label htmlFor="q">{t("search")}</label>
              <input id="q" type="text" name="q" placeholder={t("searchPlaceholder")} defaultValue={f.q ?? ""} />
            </div>
            <div className="field">
              <label htmlFor="maxPrice">{t("maxBudget")}</label>
              <input id="maxPrice" type="number" inputMode="numeric" min={0} step={500} name="maxPrice" defaultValue={f.maxPrice ?? ""} />
            </div>
            <div className="field">
              <label htmlFor="minRating">{t("minRating")}</label>
              <select id="minRating" name="minRating" defaultValue={f.minRating ?? ""}>
                <option value="">{t("any")}</option>
                <option value="4.5">4.5+ ★</option>
                <option value="4">4+ ★</option>
                <option value="3">3+ ★</option>
              </select>
            </div>
            <div className="checks wide">
              <label><input type="checkbox" name="verified" value="1" defaultChecked={!!f.verified} /> {t("verifiedOnly")}</label>
            </div>
            <div className="wide"><button className="btn primary block" type="submit">{t("showVendors")}</button></div>
          </div>
        </details>
      </div>
    </form>
  );
}
