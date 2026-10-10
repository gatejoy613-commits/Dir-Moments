import Link from "next/link";
import type { Lang } from "@/lib/catalog";
import { category, subcityName } from "@/lib/catalog";
import { etb, translator } from "@/lib/i18n";
import type { VendorRow } from "@/lib/vendors";
import { Stars } from "./Stars";

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
        <div className="spread">
          <span className="name">{name}</span>
          {v.verified && <span className="tag verified">✓ {t("verified")}</span>}
        </div>
        <div className="small muted">
          {cat?.icon} {cat?.one[lang]} · {v.subcities.slice(0, 2).map((s) => subcityName(s, lang)).join(", ")}
          {v.subcities.length > 2 ? ` +${v.subcities.length - 2}` : ""}
        </div>
        <div className="spread" style={{ marginTop: ".35rem" }}>
          {v.review_count > 0 ? <Stars rating={v.rating} count={v.review_count} /> : <span className="small muted">{t("noReviews")}</span>}
          {v.starting_price != null && <span className="small"><span className="muted">{t("from")}</span> <b>{etb(v.starting_price, lang)}</b></span>}
        </div>
      </div>
    </Link>
  );
}
