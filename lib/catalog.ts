export type Lang = "en" | "am";
export type L = { en: string; am: string };

export const CATEGORIES = [
  { key: "photographer", name: { en: "Photographers", am: "ፎቶግራፈሮች" }, one: { en: "Photographer", am: "ፎቶግራፈር" }, icon: "📷", tint: "#eef3fb" },
  { key: "videographer", name: { en: "Videographers", am: "ቪዲዮግራፈሮች" }, one: { en: "Videographer", am: "ቪዲዮግራፈር" }, icon: "🎥", tint: "#f0eefa" },
  { key: "makeup", name: { en: "Makeup artists", am: "የሜካፕ ባለሙያዎች" }, one: { en: "Makeup artist", am: "የሜካፕ ባለሙያ" }, icon: "💄", tint: "#fdeef4" },
  { key: "decorator", name: { en: "Decorators", am: "ዲኮር" }, one: { en: "Decorator", am: "ዲኮር" }, icon: "💐", tint: "#fdf0ea" },
  { key: "planner", name: { en: "Event planners", am: "የዝግጅት አስተባባሪዎች" }, one: { en: "Event planner", am: "የዝግጅት አስተባባሪ" }, icon: "📋", tint: "#eef7f3" },
  { key: "dj", name: { en: "DJs", am: "ዲጄዎች" }, one: { en: "DJ", am: "ዲጄ" }, icon: "🎧", tint: "#f3effa" },
  { key: "singer", name: { en: "Singers", am: "ዘፋኞች" }, one: { en: "Singer", am: "ዘፋኝ" }, icon: "🎤", tint: "#fdf3e7" },
  { key: "band", name: { en: "Bands", am: "ባንዶች" }, one: { en: "Band", am: "ባንድ" }, icon: "🎷", tint: "#edf5f8" },
  { key: "baker", name: { en: "Cake bakers", am: "ኬክ ጋጋሪዎች" }, one: { en: "Cake baker", am: "ኬክ ጋጋሪ" }, icon: "🎂", tint: "#fbf1e8" },
  { key: "painter", name: { en: "Painters", am: "ሰዓሊዎች" }, one: { en: "Painter", am: "ሰዓሊ" }, icon: "🎨", tint: "#f1f6ec" },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]["key"];

export function category(key: string) {
  return CATEGORIES.find((c) => c.key === key);
}

export const EVENT_TYPES: { key: string; name: L; icon: string }[] = [
  { key: "wedding", name: { en: "Wedding", am: "ሰርግ" }, icon: "💒" },
  { key: "engagement", name: { en: "Engagement", am: "ቀለበት" }, icon: "💍" },
  { key: "birthday", name: { en: "Birthday", am: "ልደት" }, icon: "🎈" },
  { key: "graduation", name: { en: "Graduation", am: "ምረቃ" }, icon: "🎓" },
  { key: "baptism", name: { en: "Baptism", am: "ክርስትና" }, icon: "🕊️" },
  { key: "corporate", name: { en: "Corporate", am: "የድርጅት" }, icon: "🏢" },
];

/**
 * People do not wake up needing "a videographer", they are planning a wedding.
 * Each occasion maps to the categories usually booked for it, so the site can
 * speak in occasions while search keeps working in categories.
 */
export const OCCASION_CATEGORIES: Record<string, CategoryKey[]> = {
  wedding: ["photographer", "videographer", "makeup", "decorator", "band", "planner"],
  engagement: ["photographer", "makeup", "decorator", "singer", "baker"],
  birthday: ["baker", "dj", "decorator", "photographer"],
  graduation: ["photographer", "videographer", "baker", "painter"],
  baptism: ["photographer", "singer", "baker", "decorator"],
  corporate: ["planner", "photographer", "videographer", "dj"],
};

export function occasionCategories(key: string): CategoryKey[] {
  return OCCASION_CATEGORIES[key] ?? [];
}
