"use client";

// Links work without JavaScript; when JS is available each tap is counted with sendBeacon.
type Props = {
  vendorId: number;
  phone: string;
  telegram?: string | null;
  whatsapp?: string | null;
  labels: { call: string; telegram: string; whatsapp: string };
};

function track(vendorId: number, channel: string) {
  try {
    const body = JSON.stringify({ vendorId, channel });
    if (!navigator.sendBeacon?.("/api/contact", body)) {
      fetch("/api/contact", { method: "POST", body, keepalive: true });
    }
  } catch {}
}

export function ContactButtons({ vendorId, phone, telegram, whatsapp, labels }: Props) {
  const tg = telegram ? `https://t.me/${telegram.replace(/^@/, "")}` : null;
  const wa = whatsapp ? `https://wa.me/${whatsapp.replace(/[^\d]/g, "")}` : null;
  return (
    <div className="contact-bar">
      <a className="btn primary" href={`tel:${phone}`} onClick={() => track(vendorId, "call")}>📞 {labels.call}</a>
      {tg ? (
        <a className="btn" href={tg} target="_blank" rel="noopener" onClick={() => track(vendorId, "telegram")}>✈️ {labels.telegram}</a>
      ) : <span />}
      {wa ? (
        <a className="btn" href={wa} target="_blank" rel="noopener" onClick={() => track(vendorId, "whatsapp")}>💬 {labels.whatsapp}</a>
      ) : <span />}
    </div>
  );
}
