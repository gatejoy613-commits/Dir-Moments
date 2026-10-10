import type { Lang } from "@/lib/catalog";
import { CATEGORIES, SUBCITIES } from "@/lib/catalog";
import { translator } from "@/lib/i18n";
import { dualDate } from "@/lib/ethiopian";

export type Filters = { category?: string; subcity?: string; date?: string; q?: string; maxPrice?: string; minRating?: string; verified?: string };

export function SearchForm({ f, lang, compact }: { f: Filters; lang: Lang; compact?: boolean }) {
  const t = translator(lang);
  const advanced = !!(f.maxPrice || f.minRating || f.verified || f.q);
  return (
    <form action="/vendors" method="get" className="card">
      <div className="filters">
        <div className="field">
          <label htmlFor="category">{t("categories")}</label>
          <select id="category" name="category" defaultValue={f.category ?? ""}>
            <option value="">{t("allCategories")}</option>
            {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.icon} {c.name[lang]}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="subcity">{t("servesIn")}</label>
          <select id="subcity" name="subcity" defaultValue={f.subcity ?? ""}>
            <option value="">{t("anySubcity")}</option>
            {SUBCITIES.map((s) => <option key={s.key} value={s.key}>{s.name[lang]}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="date">{t("eventDate")}</label>
          <input id="date" type="date" name="date" defaultValue={f.date ?? ""} />
          {f.date && /^\d{4}-\d{2}-\d{2}$/.test(f.date) && <div className="hint">{dualDate(f.date, lang)}</div>}
        </div>
        <details className="more wide" open={advanced || !compact}>
          <summary>{lang === "am" ? "ተጨማሪ ማጣሪያዎች" : "More filters"}</summary>
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
              <label><input type="checkbox" name="verified" value="1" defaultChecked={!!f.verified} /> ✓ {t("verifiedOnly")}</label>
            </div>
          </div>
        </details>
        <div className="wide"><button className="btn primary block" type="submit">🔎 {t("search")}</button></div>
      </div>
    </form>
  );
}
