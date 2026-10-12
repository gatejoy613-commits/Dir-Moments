import { cookies } from "next/headers";
import type { L, Lang } from "./catalog";

// Amharic copy is a first draft and needs review by a native speaker before launch.
const DICT = {
  appName: { en: "Dir Moments", am: "ድር ሞመንትስ" },
  tagline: { en: "Find photographers, DJs, decorators and more for your event in Addis Ababa. Contact them directly, free.", am: "ለዝግጅትዎ ፎቶግራፈር፣ ዲጄ፣ ዲኮር እና ሌሎችን በአዲስ አበባ ያግኙ። በቀጥታ ያግኟቸው፣ በነጻ።" },
  browse: { en: "Browse", am: "ፈልግ" },
  listBusiness: { en: "List your business", am: "ስራዎን ያስመዝግቡ" },
  search: { en: "Search", am: "ፈልግ" },
  searchPlaceholder: { en: "Name or style, e.g. traditional, drone", am: "ስም ወይም አይነት፣ ለምሳሌ ባህላዊ" },
  allCategories: { en: "All categories", am: "ሁሉም ዘርፎች" },
  anySubcity: { en: "Any sub-city", am: "ሁሉም ክፍለ ከተሞች" },
  eventDate: { en: "Event date", am: "የዝግጅት ቀን" },
  maxBudget: { en: "Max starting price (ETB)", am: "ከፍተኛ መነሻ ዋጋ (ብር)" },
  minRating: { en: "Minimum rating", am: "ዝቅተኛ ደረጃ" },
  any: { en: "Any", am: "ማንኛውም" },
  verifiedOnly: { en: "Verified only", am: "የተረጋገጡ ብቻ" },
  categories: { en: "Categories", am: "ዘርፎች" },
  seasonPicks: { en: "Wedding season picks", am: "የሰርግ ወቅት ምርጫዎች" },
  recentlyVerified: { en: "Recently verified", am: "በቅርቡ የተረጋገጡ" },
  sponsored: { en: "Sponsored", am: "ስፖንሰር" },
  verified: { en: "Verified", am: "የተረጋገጠ" },
  verifiedHelp: { en: "We met this vendor in person and checked their work.", am: "ይህን ባለሙያ በአካል አግኝተን ስራቸውን አረጋግጠናል።" },
  from: { en: "From", am: "ከ" },
  etb: { en: "ETB", am: "ብር" },
  reviews: { en: "reviews", am: "አስተያየቶች" },
  noReviews: { en: "No reviews yet", am: "እስካሁን አስተያየት የለም" },
  results: { en: "results", am: "ውጤቶች" },
  noResults: { en: "No vendors match these filters. Try another date or sub-city.", am: "ምንም አልተገኘም። ሌላ ቀን ወይም ክፍለ ከተማ ይሞክሩ።" },
  freeOn: { en: "Showing vendors free on", am: "ነጻ የሆኑ ባለሙያዎች በ" },
  next: { en: "Next", am: "ቀጣይ" },
  prev: { en: "Previous", am: "ቀዳሚ" },
  call: { en: "Call", am: "ይደውሉ" },
  telegram: { en: "Telegram", am: "ቴሌግራም" },
  whatsapp: { en: "WhatsApp", am: "ዋትስአፕ" },
  servesIn: { en: "Serves", am: "የሚሰሩበት" },
  about: { en: "About", am: "ስለ እኛ" },
  availability: { en: "Availability", am: "ነጻ ቀናት" },
  booked: { en: "Booked", am: "ተይዟል" },
  free: { en: "Free", am: "ነጻ" },
  availabilityHelp: { en: "Dates in red are already booked. Confirm with the vendor when you call.", am: "በቀይ ያሉት ቀናት ተይዘዋል። ሲደውሉ ያረጋግጡ።" },
  writeReview: { en: "Write a review", am: "አስተያየት ይጻፉ" },
  yourName: { en: "Your name", am: "ስምዎ" },
  yourPhone: { en: "Your phone number", am: "ስልክ ቁጥርዎ" },
  rating: { en: "Rating", am: "ደረጃ" },
  yourReview: { en: "Your review", am: "አስተያየትዎ" },
  eventType: { en: "Event type", am: "የዝግጅት አይነት" },
  submit: { en: "Submit", am: "ላክ" },
  reviewThanks: { en: "Thanks. Your review will appear after we check it.", am: "እናመሰግናለን። አስተያየትዎ ከተረጋገጠ በኋላ ይታያል።" },
  reviewRules: { en: "Reviews are checked before they appear. Vendors can reply, but paying never removes a review.", am: "አስተያየቶች ከመታየታቸው በፊት ይረጋገጣሉ። ባለሙያዎች መልስ መስጠት ይችላሉ፤ ክፍያ አስተያየትን አያስወግድም።" },
  vendorReply: { en: "Reply from the vendor", am: "የባለሙያው መልስ" },
  underReview: { en: "Under review", am: "በመጣራት ላይ" },
  packages: { en: "Packages and prices", am: "ፓኬጆችና ዋጋዎች" },
  hours: { en: "hours", am: "ሰዓት" },
  share: { en: "Share", am: "አጋራ" },
  noCommission: { en: "Free to list. No commission. Clients call you directly.", am: "መመዝገብ ነጻ ነው። ኮሚሽን የለም። ደንበኞች በቀጥታ ይደውሉልዎታል።" },
  rankingRules: { en: "How results are ordered", am: "ውጤቶች እንዴት ይደረደራሉ" },
  rankingRulesText: {
    en: "Up to 3 results per page are labelled Sponsored. The rest are ordered by rating, number of reviews, profile completeness and verification. Pro and Featured vendors get a boost in their category. A vendor with a poor rating or repeated no-show reports loses sponsored placement even if paying.",
    am: "በአንድ ገጽ እስከ 3 ውጤቶች ስፖንሰር ተብለው ይታያሉ። ሌሎቹ በደረጃ፣ በአስተያየት ብዛት፣ በመገለጫ ሙሉነትና በማረጋገጫ ይደረደራሉ። ፕሮ እና ፊቸርድ ባለሙያዎች በዘርፋቸው ቅድሚያ ያገኛሉ። ዝቅተኛ ደረጃ ወይም ተደጋጋሚ ያለመገኘት ቅሬታ ያለው ባለሙያ ቢከፍልም የስፖንሰር ቦታ ያጣል።",
  },
  footer: { en: "A free directory of event vendors in Addis Ababa. We never take a commission.", am: "በአዲስ አበባ ያሉ የዝግጅት ባለሙያዎች ነጻ ማውጫ። ኮሚሽን አንወስድም።" },

  // Landing page. The brand no longer says "Addis" or "Events", so the copy
  // has to carry what the site is on its own.
  heroTitle: { en: "Find the right people for your event", am: "ለዝግጅትዎ ትክክለኛውን ባለሙያ ያግኙ" },
  heroLede: {
    en: "Photographers, videographers, makeup artists, decorators, DJs, bands and more across Addis Ababa. Contact them directly.",
    am: "ፎቶግራፈሮች፣ ቪዲዮግራፈሮች፣ የሜካፕ ባለሙያዎች፣ ዲኮር፣ ዲጄዎች፣ ባንዶችና ሌሎች በአዲስ አበባ። በቀጥታ ያግኟቸው።",
  },
  valueFree: { en: "Free to use", am: "ለመጠቀም ነጻ" },
  valueNoCommission: { en: "No commission, ever", am: "ኮሚሽን የለም" },
  valueDirect: { en: "You contact vendors directly", am: "በቀጥታ ያግኟቸዋል" },

  statVendors: { en: "vendors listed", am: "ባለሙያዎች" },
  statVerified: { en: "verified in person", am: "በአካል የተረጋገጡ" },
  statCategories: { en: "categories", am: "ዘርፎች" },
  statSubcities: { en: "sub-cities", am: "ክፍለ ከተሞች" },

  howItWorks: { en: "How it works", am: "እንዴት ይሰራል" },
  step1Title: { en: "Search", am: "ይፈልጉ" },
  step1Body: {
    en: "Pick a category, a sub-city and your event date. Vendors already booked that day are hidden.",
    am: "ዘርፍ፣ ክፍለ ከተማና የዝግጅትዎን ቀን ይምረጡ። በዚያ ቀን የተያዙ ባለሙያዎች አይታዩም።",
  },
  step2Title: { en: "Compare", am: "ያወዳድሩ" },
  step2Body: {
    en: "Look through photos, packages, starting prices and reviews from real clients.",
    am: "ፎቶዎችን፣ ፓኬጆችን፣ የመነሻ ዋጋዎችንና የደንበኞችን አስተያየት ይመልከቱ።",
  },
  step3Title: { en: "Contact them", am: "ያግኙዋቸው" },
  step3Body: {
    en: "Call, Telegram or WhatsApp the vendor yourself. No booking fee and no middleman.",
    am: "በስልክ፣ በቴሌግራም ወይም በዋትስአፕ ራስዎ ያግኙዋቸው። ምንም የአገልግሎት ክፍያ የለም።",
  },

  joinTitle: { en: "Are you an event vendor?", am: "የዝግጅት ባለሙያ ነዎት?" },
  foundingOffer: { en: "Founding offer: the first 100 vendors get Pro free for 3 months", am: "የመስራች ቅናሽ፦ የመጀመሪያዎቹ 100 ባለሙያዎች ፕሮን ለ3 ወር በነጻ" },
  placesLeft: { en: "places left", am: "ቦታዎች ቀርተዋል" },

  // Occasions. Clients arrive planning a wedding, not shopping for a videographer.
  heroEyebrow: { en: "Weddings, engagements, graduations and every celebration in between", am: "ሰርግ፣ ቀለበት፣ ምረቃ እና ሌሎች ክብረ በዓላት" },
  occasionsTitle: { en: "What are you celebrating?", am: "ምን እያከበሩ ነው?" },
  occasionsLede: { en: "Start with the day you are planning and we will show the people who make it happen.", am: "እያቀዱት ባለው ዝግጅት ይጀምሩ፤ የሚያስፈልጉዎትን ባለሙያዎች እናሳይዎታለን።" },
  occasionNote: { en: "The vendors people usually book for this celebration.", am: "ለዚህ ክብረ በዓል አብዛኛውን ጊዜ የሚፈለጉ ባለሙያዎች።" },

  // Results and profile pages.
  inAddis: { en: "in Addis Ababa", am: "በአዲስ አበባ" },
  browseAll: { en: "See all vendors", am: "ሁሉንም ባለሙያዎች ይመልከቱ" },
  noResultsTitle: { en: "Nothing matches yet", am: "እስካሁን ምንም አልተገኘም" },
} satisfies Record<string, L>;

export type DictKey = keyof typeof DICT;

export async function getLang(): Promise<Lang> {
  const c = (await cookies()).get("lang")?.value;
  return c === "am" ? "am" : "en";
}

export function translator(lang: Lang) {
  return (key: DictKey) => DICT[key][lang];
}

export async function i18n() {
  const lang = await getLang();
  return { lang, t: translator(lang), l: (x: L | undefined | null) => (x ? x[lang] || x.en : "") };
}

export function etb(n: number | null | undefined, lang: Lang) {
  if (n == null) return "";
  const s = n.toLocaleString("en-US");
  return lang === "am" ? `${s} ብር` : `ETB ${s}`;
}
