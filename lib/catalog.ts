export type Lang = "en" | "am";
export type L = { en: string; am: string };

export const CATEGORIES = [
  { key: "photographer", name: { en: "Photographers", am: "ፎቶግራፈሮች" }, one: { en: "Photographer", am: "ፎቶግራፈር" }, icon: "📷" },
  { key: "videographer", name: { en: "Videographers", am: "ቪዲዮግራፈሮች" }, one: { en: "Videographer", am: "ቪዲዮግራፈር" }, icon: "🎥" },
  { key: "makeup", name: { en: "Makeup artists", am: "የሜካፕ ባለሙያዎች" }, one: { en: "Makeup artist", am: "የሜካፕ ባለሙያ" }, icon: "💄" },
  { key: "decorator", name: { en: "Decorators", am: "ዲኮር" }, one: { en: "Decorator", am: "ዲኮር" }, icon: "💐" },
  { key: "planner", name: { en: "Event planners", am: "የዝግጅት አስተባባሪዎች" }, one: { en: "Event planner", am: "የዝግጅት አስተባባሪ" }, icon: "📋" },
  { key: "dj", name: { en: "DJs", am: "ዲጄዎች" }, one: { en: "DJ", am: "ዲጄ" }, icon: "🎧" },
  { key: "singer", name: { en: "Singers", am: "ዘፋኞች" }, one: { en: "Singer", am: "ዘፋኝ" }, icon: "🎤" },
  { key: "band", name: { en: "Bands", am: "ባንዶች" }, one: { en: "Band", am: "ባንድ" }, icon: "🎷" },
  { key: "baker", name: { en: "Cake bakers", am: "ኬክ ጋጋሪዎች" }, one: { en: "Cake baker", am: "ኬክ ጋጋሪ" }, icon: "🎂" },
  { key: "painter", name: { en: "Painters", am: "ሰዓሊዎች" }, one: { en: "Painter", am: "ሰዓሊ" }, icon: "🎨" },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]["key"];

export function category(key: string) {
  return CATEGORIES.find((c) => c.key === key);
}

export const SUBCITIES: { key: string; name: L }[] = [
  { key: "addis-ketema", name: { en: "Addis Ketema", am: "አዲስ ከተማ" } },
  { key: "akaky-kaliti", name: { en: "Akaky Kaliti", am: "አቃቂ ቃሊቲ" } },
  { key: "arada", name: { en: "Arada", am: "አራዳ" } },
  { key: "bole", name: { en: "Bole", am: "ቦሌ" } },
  { key: "gullele", name: { en: "Gullele", am: "ጉለሌ" } },
  { key: "kirkos", name: { en: "Kirkos", am: "ቂርቆስ" } },
  { key: "kolfe-keranio", name: { en: "Kolfe Keranio", am: "ኮልፌ ቀራኒዮ" } },
  { key: "lemi-kura", name: { en: "Lemi Kura", am: "ለሚ ኩራ" } },
  { key: "lideta", name: { en: "Lideta", am: "ልደታ" } },
  { key: "nifas-silk-lafto", name: { en: "Nifas Silk-Lafto", am: "ንፋስ ስልክ ላፍቶ" } },
  { key: "yeka", name: { en: "Yeka", am: "የካ" } },
];

export function subcityName(key: string, lang: Lang) {
  return SUBCITIES.find((s) => s.key === key)?.name[lang] ?? key;
}

export const EVENT_TYPES: { key: string; name: L }[] = [
  { key: "wedding", name: { en: "Wedding", am: "ሰርግ" } },
  { key: "engagement", name: { en: "Engagement", am: "ቀለበት" } },
  { key: "birthday", name: { en: "Birthday", am: "ልደት" } },
  { key: "graduation", name: { en: "Graduation", am: "ምረቃ" } },
  { key: "baptism", name: { en: "Baptism", am: "ክርስትና" } },
  { key: "corporate", name: { en: "Corporate", am: "የድርጅት" } },
];
