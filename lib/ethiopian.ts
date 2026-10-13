import type { Lang } from "./catalog";

// Gregorian <-> Ethiopian (Amete Mihret) via Julian Day Number.
const ETH_EPOCH = 1723856;

const MONTHS = {
  en: ["Meskerem", "Tikimt", "Hidar", "Tahsas", "Tir", "Yekatit", "Megabit", "Miyazia", "Ginbot", "Sene", "Hamle", "Nehase", "Pagume"],
  am: ["መስከረም", "ጥቅምት", "ኅዳር", "ታኅሣሥ", "ጥር", "የካቲት", "መጋቢት", "ሚያዝያ", "ግንቦት", "ሰኔ", "ሐምሌ", "ነሐሴ", "ጳጉሜ"],
};
const WEEKDAYS = {
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  am: ["እሑድ", "ሰኞ", "ማክሰኞ", "ረቡዕ", "ሐሙስ", "ዓርብ", "ቅዳሜ"],
};
const GREG_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function gregToJdn(y: number, m: number, d: number) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

function jdnToGreg(jdn: number) {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  return {
    day: e - Math.floor((153 * m + 2) / 5) + 1,
    month: m + 3 - 12 * Math.floor(m / 10),
    year: 100 * b + d - 4800 + Math.floor(m / 10),
  };
}

export function toEthiopian(y: number, m: number, d: number) {
  const jdn = gregToJdn(y, m, d);
  const r = (jdn - ETH_EPOCH) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  return {
    year: 4 * Math.floor((jdn - ETH_EPOCH) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460),
    month: Math.floor(n / 30) + 1,
    day: (n % 30) + 1,
  };
}

export function fromEthiopian(y: number, m: number, d: number) {
  const jdn = ETH_EPOCH + 365 + 365 * (y - 1) + Math.floor(y / 4) + 30 * m + d - 31;
  return jdnToGreg(jdn);
}

/** Parse a YYYY-MM-DD string as a calendar date (no time zone). */
export function parseIso(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

export function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function weekday(iso: string) {
  const { y, m, d } = parseIso(iso);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function ethLabel(iso: string, lang: Lang) {
  const { y, m, d } = parseIso(iso);
  const e = toEthiopian(y, m, d);
  return `${MONTHS[lang][e.month - 1]} ${e.day}, ${e.year}`;
}

export function gregLabel(iso: string) {
  const { y, m, d } = parseIso(iso);
  return `${d} ${GREG_MONTHS[m - 1]} ${y}`;
}

/** "Sat 17 Jan 2027 · Tir 9, 2019 E.C." */
export function dualDate(iso: string, lang: Lang) {
  const wd = WEEKDAYS[lang][weekday(iso)];
  return lang === "am"
    ? `${wd}፣ ${ethLabel(iso, "am")} ዓ.ም. · ${gregLabel(iso)}`
    : `${wd} ${gregLabel(iso)} · ${ethLabel(iso, "en")} E.C.`;
}

const WEEKDAYS_LONG = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  am: WEEKDAYS.am,
};

export function weekdayName(iso: string, lang: Lang) {
  return WEEKDAYS_LONG[lang][weekday(iso)];
}

export function ethMonthName(month: number, lang: Lang) {
  return MONTHS[lang][month - 1];
}

/** Today's date in Addis Ababa (UTC+3) as YYYY-MM-DD. */
export function todayAddis() {
  const now = new Date(Date.now() + 3 * 3600 * 1000);
  return now.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number) {
  const { y, m, d } = parseIso(iso);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
