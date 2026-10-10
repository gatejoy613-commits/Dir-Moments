import { i18n } from "@/lib/i18n";
import { PRICES, TIERS } from "@/lib/tiers";

export const metadata = { title: "Plans for vendors" };

export default async function Pricing() {
  const { lang } = await i18n();
  const am = lang === "am";
  const rows: [string, string, string, string][] = [
    [am ? "ከቅጽ የተሰራ መገለጫ" : "Profile from a category template", "✓", "✓", "✓"],
    [am ? "ፎቶዎች / ቪዲዮዎች" : "Photos / videos", `${TIERS.free.photos} / ${TIERS.free.videos}`, `${TIERS.pro.photos} / ${TIERS.pro.videos}`, `${TIERS.featured.photos} / ${TIERS.featured.videos}`],
    [am ? "ፓኬጆች" : "Packages", "3", am ? "ያልተገደበ" : "Unlimited", am ? "ያልተገደበ" : "Unlimited"],
    [am ? "የመገናኛ ቁልፎች፣ አስተያየቶች፣ ነጻ ቀናት" : "Contact buttons, reviews, availability", "✓", "✓", "✓"],
    [am ? "የተረጋገጠ ምልክት (በአካል ከተጣራ በኋላ)" : "Verified badge (after in-person check)", "✓", "✓", "✓"],
    [am ? "በፍለጋ ውስጥ ቦታ" : "Search ranking", am ? "መደበኛ" : "Normal", am ? "በዘርፉ ቅድሚያ" : "Boost within category", am ? "ከላይ \"ስፖንሰር\" ቦታዎች" : "Top \"Sponsored\" slots"],
    [am ? "ተጨማሪ ገጽታዎች" : "Premium looks", "—", "✓", "✓"],
    [am ? "ስታቲስቲክስ" : "Stats", am ? "እይታዎች" : "Profile views", am ? "እይታ፣ ጥሪ፣ ፍለጋ" : "Views, contact taps, searches", am ? "+ ከዘርፉ አማካይ ጋር ንጽጽር" : "+ comparison to category average"],
    [am ? "በመነሻ ገጽ ላይ" : "Homepage and wedding season picks", "—", "—", "✓"],
    [am ? "ወርሃዊ ዋጋ" : "Monthly", am ? "ነጻ" : "Free", `ETB ${PRICES.pro.month}`, `ETB ${PRICES.featured.month}`],
    [am ? "የሰርግ ወቅት (3 ወር)" : "Wedding season (3 months)", "—", `ETB ${PRICES.pro.season.toLocaleString()}`, `ETB ${PRICES.featured.season.toLocaleString()}`],
    [am ? "ዓመታዊ" : "Yearly", "—", `ETB ${PRICES.pro.year.toLocaleString()}`, `ETB ${PRICES.featured.year.toLocaleString()}`],
  ];
  return (
    <div style={{ marginTop: "1rem" }}>
      <h1>{am ? "ለባለሙያዎች እቅዶች" : "Plans for vendors"}</h1>
      <p className="notice">{am ? "መመዝገብ ነጻ ነው። ኮሚሽን የለም። ክፍያ ቦታ ይጨምራል እንጂ መጥፎ አስተያየትን አያስወግድም።" : "Listing is free and we never take a commission. Paying buys visibility and better tools, never the removal of a bad review."}</p>
      <div className="table-wrap card">
        <table>
          <thead><tr><th></th><th>{am ? "ነጻ" : "Free"}</th><th>Pro</th><th>Featured</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r[0]}>{r.map((c, i) => i === 0 ? <th key={i}>{c}</th> : <td key={i}>{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <p className="small muted" style={{ marginTop: "1rem" }}>
        {am
          ? "የመጀመሪያዎቹ 100 ባለሙያዎች ፕሮን ለ3 ወር በነጻ ያገኛሉ፣ ከዚያ ለመጀመሪያው ዓመት 30% ቅናሽ። ፊቸርድ ቦታዎች በዘርፍና ክፍለ ከተማ የተወሰኑ ናቸው። ክፍያ በቻፓ ሊንክ (ቴሌብር፣ ሲቢኢ ብር፣ ባንክ፣ ካርድ)።"
          : "Founding offer: the first 100 vendors get Pro free for 3 months, then 30% off for the first year. Featured slots are limited per category and sub-city. Payment is prepaid by Chapa link (telebirr, CBE Birr, bank or card); no automatic renewal."}
      </p>
    </div>
  );
}
