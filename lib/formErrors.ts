import type { Lang } from "./catalog";

const ERRORS: Record<string, { en: string; am: string }> = {
  name: { en: "Please enter your business name.", am: "እባክዎ የስራ ስምዎን ያስገቡ።" },
  email: { en: "Enter a valid email address. You will sign in with it.", am: "ትክክለኛ ኢሜይል ያስገቡ፡ በእሱ ይገባሉ።" },
  "email-taken": { en: "That email already has a listing. Sign in instead.", am: "ይህ ኢሜይል አስቀድሞ ተመዝግቦል። ይግቡ።" },
  phone: { en: "Please enter a valid Ethiopian phone number, like 0911 234 567.", am: "እባክዎ ትክክለኛ ስልክ ቁጥር ያስገቡ፣ ለምሳሌ 0911 234 567።" },
  category: { en: "Pick a category.", am: "ዘርፍ ይምረጡ።" },
};

export function formError(code: string | undefined, lang: Lang) {
  return code ? ERRORS[code]?.[lang] ?? code : null;
}

export function noticeText(code: string, lang: Lang) {
  const [kind, n] = code.split(":");
  const en: Record<string, string> = {
    photos: `Your plan allows ${n} photos, so the extra ones were not added. Upgrade to Pro for 40.`,
    videos: `Your plan allows ${n} videos or audio clips, so the extra links were not added.`,
    packages: `Your plan allows ${n} packages, so the extra ones were not saved. Pro has unlimited packages.`,
    "photo-failed": "One photo could not be read. Try a JPG or PNG under 15 MB.",
  };
  const am: Record<string, string> = {
    photos: `እቅድዎ ${n} ፎቶዎችን ይፈቅዳል፤ ተጨማሪዎቹ አልገቡም። ፕሮ 40 ይፈቅዳል።`,
    videos: `እቅድዎ ${n} ቪዲዮዎችን ይፈቅዳል፤ ተጨማሪዎቹ አልገቡም።`,
    packages: `እቅድዎ ${n} ፓኬጆችን ይፈቅዳል፤ ተጨማሪዎቹ አልተቀመጡም።`,
    "photo-failed": "አንድ ፎቶ ሊነበብ አልቻለም። ከ15 ሜባ በታች JPG ወይም PNG ይሞክሩ።",
  };
  return (lang === "am" ? am : en)[kind] ?? code;
}
