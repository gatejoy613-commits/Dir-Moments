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
  noResults: { en: "No vendors match these filters. Try another celebration, or clear a filter.", am: "ምንም አልተገኘም። ሌላ ዝግጅት ይሞክሩ ወይም ማጣሪያ ያንሱ።" },
  freeOn: { en: "Showing vendors free on", am: "ነጻ የሆኑ ባለሙያዎች በ" },
  next: { en: "Next", am: "ቀጣይ" },
  prev: { en: "Previous", am: "ቀዳሚ" },
  call: { en: "Call", am: "ይደውሉ" },
  telegram: { en: "Telegram", am: "ቴሌግራም" },
  whatsapp: { en: "WhatsApp", am: "ዋትስአፕ" },
  about: { en: "About", am: "ስለ እኛ" },
  availability: { en: "Availability", am: "ነጻ ቀናት" },
  booked: { en: "Booked", am: "ተይዟል" },
  free: { en: "Free", am: "ነጻ" },
  availabilityHelp: { en: "Shaded dates are already booked. Confirm with the vendor when you call.", am: "የተሸፈኑት ቀናት ተይዘዋል። ሲደውሉ ያረጋግጡ።" },
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
  heroTitle: { en: "Find the right people for your celebration.", am: "ለዝግጅትዎ ትክክለኛውን ባለሙያ ያግኙ።" },
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

  howItWorks: { en: "How it works", am: "እንዴት ይሰራል" },
  step1Title: { en: "Search", am: "ይፈልጉ" },
  step1Body: {
    en: "Pick what you are celebrating and who you need. We show the vendors usually booked for it.",
    am: "የሚያከብሩትን እና የሚያስፈልግዎትን ባለሙያ ይምረጡ። ለዚያ ዝግጅት የሚፈለጉ ባለሙያዎችን እናሳይዎታለን።",
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
  // Search starts from the celebration; availability by date is paused for this phase.
  anyOccasion: { en: "Any celebration", am: "ማንኛውም ዝግጅት" },
  whatDoYouNeed: { en: "Who do you need?", am: "ምን ባለሙያ ያስፈልግዎታል?" },
  showVendors: { en: "Show vendors", am: "ባለሙያዎችን አሳይ" },
  moreFilters: { en: "More filters", am: "ተጨማሪ ማጣሪያዎች" },
  reassure: { en: "Free to use. No commission. You call vendors yourself.", am: "ነጻ ነው። ኮሚሽን የለም። ባለሙያዎቹን ራስዎ ያገኟቸዋል።" },
  seePlans: { en: "See Pro and Featured plans", am: "ፕሮ እና ፊቸርድ እቅዶች" },
  // apple.com-style home bands: a short line under each headline.
  heroTagline: { en: "Photographers, DJs, decorators and more across Addis Ababa.", am: "ፎቶግራፈሮች፣ ዲጄዎች፣ ዲኮር እና ሌሎች በአዲስ አበባ።" },
  occasionsTone: { en: "Start with the day you're planning.", am: "እያቀዱት ባለው ቀን ይጀምሩ።" },
  // Home slideshow: one slide per celebration, each a way into the results.
  slidesLabel: { en: "Celebrations", am: "ክብረ በዓላት" },
  slideWedding: { en: "Weddings.", am: "ሰርግ።" },
  slideWeddingText: { en: "Photographers, videographers, makeup artists and decorators who know the ceremonies.", am: "ስነ ስርዓቱን የሚያውቁ ፎቶግራፈሮች፣ ቪዲዮግራፈሮች፣ የሜካፕ ባለሙያዎችና ዲኮር።" },
  slideWeddingCta: { en: "See wedding vendors", am: "የሰርግ ባለሙያዎችን ይመልከቱ" },
  slideBirthday: { en: "Birthdays.", am: "ልደት።" },
  slideBirthdayText: { en: "Cakes, DJs, decor and someone to catch every candle.", am: "ኬክ፣ ዲጄ፣ ዲኮር እና እያንዳንዱን ቅጽበት የሚያነሳ ፎቶግራፈር።" },
  slideBirthdayCta: { en: "See birthday vendors", am: "የልደት ባለሙያዎችን ይመልከቱ" },
  slideCorporate: { en: "Corporate events.", am: "የድርጅት ዝግጅቶች።" },
  slideCorporateText: { en: "Planners, sound, light and cameras for launches and galas.", am: "ለምርት ማስተዋወቂያና ለጋላ እቅድ አውጪዎች፣ ድምጽ፣ መብራትና ካሜራ።" },
  slideCorporateCta: { en: "See corporate vendors", am: "የድርጅት ዝግጅት ባለሙያዎችን ይመልከቱ" },
  slideTeam: { en: "Everyone you need.", am: "የሚያስፈልግዎ ሁሉ።" },
  slideTeamText: { en: "From the first photo to the last song, in one directory.", am: "ከመጀመሪያው ፎቶ እስከ መጨረሻው ዘፈን፣ በአንድ ቦታ።" },
  pause: { en: "Pause slideshow", am: "ስላይዱን አቁም" },
  play: { en: "Play slideshow", am: "ስላይዱን አጫውት" },
  goToSlide: { en: "Go to slide", am: "ወደ ስላይድ" },
  slideOf: { en: "of", am: "ከ" },
  photos: { en: "Photos", am: "ፎቶዎች" },
  numbersTitle: { en: "Real people. Checked in person.", am: "እውነተኛ ባለሙያዎች። በአካል የተረጋገጡ።" },
  categoriesTone: { en: "Browse by what you need.", am: "በሚያስፈልግዎ ይፈልጉ።" },
  verifiedTone: { en: "Met in person, work checked.", am: "በአካል ተገናኝተን ስራቸውን አይተናል።" },
  howTone: { en: "Three steps. No middleman.", am: "ሶስት ደረጃዎች። ደላላ የለም።" },
  vendorsShort: { en: "vendors", am: "ባለሙያዎች" },
  seeVendors: { en: "See vendors", am: "ባለሙያዎችን ይመልከቱ" },
  signIn: { en: "Sign in", am: "ግባ" },
  account: { en: "Account", am: "አካውንት" },
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
