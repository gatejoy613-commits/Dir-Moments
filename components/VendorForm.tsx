import type { Lang } from "@/lib/catalog";
import { category, SUBCITIES } from "@/lib/catalog";
import { LOOKS, template } from "@/lib/templates";
import { TIERS, type Plan } from "@/lib/tiers";
import type { ItemRow, PackageRow, VendorRow } from "@/lib/vendors";

type Props = {
  categoryKey: string;
  lang: Lang;
  action: (fd: FormData) => Promise<void>;
  vendor?: VendorRow | null;
  packages?: PackageRow[];
  items?: ItemRow[];
  plan?: Plan;
  submitLabel: string;
};

const T = {
  basics: { en: "Your business", am: "የእርስዎ ስራ" },
  name: { en: "Business or stage name", am: "የስራ ወይም የመድረክ ስም" },
  nameAm: { en: "Name in Amharic (optional)", am: "ስም በአማርኛ (አማራጭ)" },
  phone: { en: "Phone number for calls", am: "ለጥሪ ስልክ ቁጥር" },
  telegram: { en: "Telegram username (optional)", am: "የቴሌግራም ስም (አማራጭ)" },
  whatsapp: { en: "WhatsApp number (optional)", am: "የዋትስአፕ ቁጥር (አማራጭ)" },
  subcities: { en: "Sub-cities you serve", am: "የሚሰሩባቸው ክፍለ ከተሞች" },
  bio: { en: "About you in English", am: "ስለ እርስዎ በእንግሊዝኛ" },
  bioAm: { en: "About you in Amharic", am: "ስለ እርስዎ በአማርኛ" },
  bioHint: { en: "Two or three sentences: experience, style, what makes you different.", am: "ሁለት ሶስት ዓረፍተ ነገሮች፦ ልምድ፣ አይነት፣ ልዩነትዎ።" },
  look: { en: "Look", am: "ገጽታ" },
  lookHint: { en: "Same sections, different style. Gold and Night come with Pro and Featured.", am: "ተመሳሳይ ክፍሎች፣ የተለየ ገጽታ። ወርቃማና ምሽት ከፕሮ ጋር ይመጣሉ።" },
  starting: { en: "Starting price (ETB)", am: "መነሻ ዋጋ (ብር)" },
  startingHint: { en: "Leave empty to use your cheapest package.", am: "ባዶ ከተዉት ዝቅተኛው ፓኬጅ ይወሰዳል።" },
  addPhotos: { en: "Add photos from your phone", am: "ከስልክዎ ፎቶ ያክሉ" },
  photoHint: { en: "Photos are compressed and cropped automatically.", am: "ፎቶዎች በራሳቸው ይጨመቃሉ።" },
  remove: { en: "Remove", am: "አስወግድ" },
  caption: { en: "Caption", am: "መግለጫ" },
  links: { en: "Links, one per line (YouTube, TikTok, Instagram, SoundCloud). Add a title after |", am: "ሊንኮች፣ በየመስመሩ አንድ። ከ | በኋላ ርዕስ ያክሉ" },
  pkgName: { en: "Package name", am: "የፓኬጅ ስም" },
  pkgNameAm: { en: "Name in Amharic", am: "ስም በአማርኛ" },
  price: { en: "Price (ETB)", am: "ዋጋ (ብር)" },
  hours: { en: "Hours", am: "ሰዓት" },
  from: { en: "Price is \"starting from\"", am: "ዋጋው \"ከ\" ነው" },
  inc: { en: "What's included, one per line", am: "የተካተቱ፣ በየመስመሩ አንድ" },
  limit: { en: "Your plan allows", am: "እቅድዎ የሚፈቅደው" },
  photos: { en: "photos", am: "ፎቶዎች" },
  videos: { en: "videos or audio clips", am: "ቪዲዮ ወይም ድምጽ" },
  packages: { en: "packages", am: "ፓኬጆች" },
  english: { en: "English", am: "እንግሊዝኛ" },
  amharic: { en: "Amharic", am: "አማርኛ" },
};

export function VendorForm({ categoryKey, lang, action, vendor, packages = [], items = [], plan = "free", submitLabel }: Props) {
  const tpl = template(categoryKey)!;
  const cat = category(categoryKey)!;
  const limits = TIERS[plan];
  const tr = (k: keyof typeof T) => T[k][lang];
  const pkgRows = Math.min(12, Math.max(limits.packages === Infinity ? packages.length + 2 : limits.packages, 1));
  const photoCount = items.filter((i) => i.kind === "photo").length;

  return (
    <form action={action}>
      <input type="hidden" name="category" value={categoryKey} />
      <fieldset>
        <legend>{cat.icon} {tr("basics")}</legend>
        <div className="field"><label>{tr("name")}</label><input type="text" name="name" required maxLength={80} defaultValue={vendor?.name} /></div>
        <div className="field"><label>{tr("nameAm")}</label><input type="text" name="name_am" maxLength={80} defaultValue={vendor?.name_am ?? ""} lang="am" /></div>
        <div className="field"><label>{tr("phone")}</label><input type="tel" name="phone" required placeholder="09XX XXX XXX" defaultValue={vendor?.phone} /></div>
        <div className="field"><label>{tr("telegram")}</label><input type="text" name="telegram" placeholder="@yourname" defaultValue={vendor?.telegram ?? ""} /></div>
        <div className="field"><label>{tr("whatsapp")}</label><input type="tel" name="whatsapp" placeholder="09XX XXX XXX" defaultValue={vendor?.whatsapp ?? ""} /></div>
        <div className="field">
          <label>{tr("subcities")}</label>
          <div className="checks">
            {SUBCITIES.map((s) => (
              <label key={s.key}><input type="checkbox" name="subcities" value={s.key} defaultChecked={vendor?.subcities.includes(s.key)} /> {s.name[lang]}</label>
            ))}
          </div>
        </div>
        <div className="field">
          <label>{tr("bio")}</label>
          <textarea name="bio" maxLength={3000} defaultValue={vendor?.bio} placeholder={tr("bioHint")} />
        </div>
        <div className="field">
          <label>{tr("bioAm")}</label>
          <textarea name="bio_am" maxLength={3000} defaultValue={vendor?.bio_am} lang="am" placeholder={T.bioHint.am} />
        </div>
        <div className="field">
          <label>{tr("starting")}</label>
          <input type="number" inputMode="numeric" name="starting_price" min={0} step={100} defaultValue={vendor?.starting_price ?? ""} />
          <div className="hint">{tr("startingHint")}</div>
        </div>
        <div className="field">
          <label>{tr("look")}</label>
          <div className="checks">
            {LOOKS.map((l) => (
              <label key={l.key} style={l.paid && !limits.premiumLooks ? { opacity: 0.5 } : undefined}>
                <input type="radio" name="look" value={l.key} disabled={l.paid && !limits.premiumLooks}
                  defaultChecked={(vendor?.look ?? "classic") === l.key} /> {l.name[lang]}
              </label>
            ))}
          </div>
          <div className="hint">{tr("lookHint")}</div>
        </div>
      </fieldset>

      <p className="small muted">
        {tr("limit")}: {limits.photos} {tr("photos")} · {limits.videos} {tr("videos")} · {limits.packages === Infinity ? "∞" : limits.packages} {tr("packages")}
      </p>

      {tpl.sections.map((s) => {
        const answer = vendor?.sections[s.key];
        return (
          <fieldset key={s.key}>
            <legend>{s.title[lang]}</legend>
            <p className="hint">💡 {s.prompt[lang]}</p>

            {s.kind === "text" && (
              <>
                <div className="field"><label className="small">{tr("english")}</label>
                  <textarea name={`s_${s.key}_en`} defaultValue={answer?.en ?? ""} placeholder={s.example?.en} /></div>
                <div className="field"><label className="small">{tr("amharic")}</label>
                  <textarea name={`s_${s.key}_am`} defaultValue={answer?.am ?? ""} placeholder={s.example?.am} lang="am" /></div>
              </>
            )}

            {s.kind === "tags" && (
              <div className="checks">
                {s.options!.map((o) => (
                  <label key={o.key}><input type="checkbox" name={`s_${s.key}_tags`} value={o.key} defaultChecked={answer?.tags?.includes(o.key)} /> {o.name[lang]}</label>
                ))}
              </div>
            )}

            {s.kind === "gallery" && (
              <>
                {items.filter((i) => i.section === s.key && i.kind === "photo").length > 0 && (
                  <div className="gallery" style={{ marginBottom: ".75rem" }}>
                    {items.filter((i) => i.section === s.key && i.kind === "photo").map((it) => (
                      <figure key={it.id}>
                        <img src={it.url} alt="" loading="lazy" width={200} height={200} />
                        <input type="text" name={`item_${it.id}_caption`} defaultValue={it.caption ?? ""} placeholder={tr("caption")} style={{ minHeight: 34, fontSize: ".8rem", marginTop: 4 }} />
                        <label className="small" style={{ fontWeight: 400 }}><input type="checkbox" name={`item_${it.id}_remove`} value="1" /> {tr("remove")}</label>
                      </figure>
                    ))}
                  </div>
                )}
                <label className="small">{tr("addPhotos")}</label>
                <input type="file" name={`g_${s.key}_files`} accept="image/*" multiple />
                <div className="hint">{tr("photoHint")} ({photoCount}/{limits.photos})</div>
              </>
            )}

            {s.kind === "media" && (
              <div className="field">
                <label className="small">{tr("links")}</label>
                <textarea name={`m_${s.key}_links`} placeholder="https://youtu.be/… | Wedding at Sheraton"
                  defaultValue={items.filter((i) => i.section === s.key && i.kind !== "photo").map((i) => `${i.url}${i.caption ? ` | ${i.caption}` : ""}`).join("\n")} />
              </div>
            )}

            {s.kind === "packages" && (
              <div className="stack">
                {Array.from({ length: pkgRows }).map((_, i) => {
                  const p = packages[i];
                  return (
                    <div key={i} className="pkg">
                      <div className="filters">
                        <div className="field"><label className="small">{tr("pkgName")} {i + 1}</label><input type="text" name={`pk_${i}_name`} defaultValue={p?.name} placeholder={i === 0 ? "Silver" : i === 1 ? "Gold" : "Platinum"} /></div>
                        <div className="field"><label className="small">{tr("pkgNameAm")}</label><input type="text" name={`pk_${i}_name_am`} defaultValue={p?.name_am ?? ""} lang="am" /></div>
                        <div className="field"><label className="small">{tr("price")}</label><input type="number" inputMode="numeric" min={0} step={100} name={`pk_${i}_price`} defaultValue={p?.price} /></div>
                        <div className="field"><label className="small">{tr("hours")}</label><input type="number" inputMode="decimal" min={0} step={0.5} name={`pk_${i}_hours`} defaultValue={p?.hours ? Number(p.hours) : ""} /></div>
                        <div className="field wide"><label className="small">{tr("inc")}</label><textarea name={`pk_${i}_inc`} defaultValue={p?.inclusions} style={{ minHeight: 70 }} /></div>
                        <div className="checks wide"><label><input type="checkbox" name={`pk_${i}_from`} value="1" defaultChecked={p?.starting_from} /> {tr("from")}</label></div>
                      </div>
                    </div>
                  );
                })}
                {s.example && <div className="hint">{s.example[lang]}</div>}
              </div>
            )}
          </fieldset>
        );
      })}

      <button className="btn primary block" type="submit">{submitLabel}</button>
    </form>
  );
}
