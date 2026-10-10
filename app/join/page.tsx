import Link from "next/link";
import { CATEGORIES } from "@/lib/catalog";
import { i18n } from "@/lib/i18n";

export const metadata = { title: "List your business" };

export default async function Join() {
  const { lang, t } = await i18n();
  return (
    <div style={{ marginTop: "1rem" }}>
      <h1>{t("listBusiness")}</h1>
      <p className="notice">{t("noCommission")}</p>
      <p className="muted">
        {lang === "am"
          ? "ዘርፍዎን ይምረጡ። ለዘርፍዎ የተዘጋጀ ቅጽ ጥሩ መገለጫ በደቂቃዎች እንዲሰሩ ይረዳዎታል። ከመታተሙ በፊት እንገመግመዋለን።"
          : "Pick your category. Each one has its own template with sections and prompts, so you can build a good-looking profile from your phone in minutes. We review every profile before it goes live."}
      </p>
      <div className="cat-grid">
        {CATEGORIES.map((c) => (
          <Link key={c.key} href={`/join/${c.key}`} className="cat"><span className="icon">{c.icon}</span><span>{c.one[lang]}</span></Link>
        ))}
      </div>
      <p className="small" style={{ marginTop: "1rem" }}><Link href="/pricing">{lang === "am" ? "ፕሮ እና ፊቸርድ እቅዶች" : "See Pro and Featured plans"}</Link></p>
    </div>
  );
}
