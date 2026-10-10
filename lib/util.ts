export function slugify(s: string) {
  const base = s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  return base || "vendor";
}

/** Normalise Ethiopian phone numbers to +2519XXXXXXXX / +2517XXXXXXXX when possible. */
export function normalisePhone(raw: string) {
  const d = raw.replace(/[^\d+]/g, "");
  if (/^\+251[79]\d{8}$/.test(d)) return d;
  if (/^251[79]\d{8}$/.test(d)) return "+" + d;
  if (/^0[79]\d{8}$/.test(d)) return "+251" + d.slice(1);
  if (/^[79]\d{8}$/.test(d)) return "+251" + d;
  return null;
}

export function telegramUrl(handle: string) {
  return `https://t.me/${handle.replace(/^@/, "").replace(/^https?:\/\/t\.me\//, "")}`;
}

export function whatsappUrl(phone: string) {
  return `https://wa.me/${phone.replace(/[^\d]/g, "")}`;
}

export function str(v: FormDataEntryValue | null) {
  return typeof v === "string" ? v.trim() : "";
}

export function maskPhone(p: string) {
  return p.length > 6 ? p.slice(0, 7) + "•••" + p.slice(-2) : p;
}
