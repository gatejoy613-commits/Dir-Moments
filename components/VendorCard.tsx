import Link from "next/link";
import type { Lang } from "@/lib/catalog";
import { category } from "@/lib/catalog";
import { etb, translator } from "@/lib/i18n";
import type { VendorRow } from "@/lib/vendors";

export function VendorCard({ v, lang, sponsored }: { v: VendorRow; lang: Lang; sponsored?: boolean }) {
  const t = translator(lang);
  const cat = category(v.category);
  const name = lang === "am" && v.name_am ? v.name_am : v.name;
  return (
    <Link href={`/v/${v.slug}`} className="vcard">
      <div className="img" style={{ backgroundImage: v.cover_url ? `url("${v.cover_url}")` : undefined }}>
        {sponsored && <span className="tag sponsor">{t("sponsored")}</span>}
      </div>
      <div className="body">
        <span className="name">{name}</span>
        <span className="kind">
          <span>{cat?.one[lang]}</span>
          {v.verified && <span className="tick">✓ {t("verified")}</span>}
        </span>
        <span className="facts">
          {v.review_count > 0
            ? <span className="rate" aria-label={`${v.rating.toFixed(1)} / 5, ${v.review_count} ${t("reviews")}`}><span className="star" aria-hidden="true">★</span> <b>{v.rating.toFixed(1)}</b> ({v.review_count})</span>
            : <span className="rate">{t("noReviews")}</span>}
          {v.starting_price != null && <span className="price"><small>{t("from")}</small>{etb(v.starting_price, lang)}</span>}
        </span>
      </div>
    </Link>
  );
}
