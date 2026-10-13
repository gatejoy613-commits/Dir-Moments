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

// Drawn rather than emoji so they look the same on every phone.
const icon = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
const Phone = () => <svg {...icon}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></svg>;
const Plane = () => <svg {...icon}><path d="m21 3-9 18-2-8-8-2z" /><path d="M21 3 10 13" /></svg>;
const Chat = () => <svg {...icon}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /></svg>;

export function ContactButtons({ vendorId, phone, telegram, whatsapp, labels }: Props) {
  const tg = telegram ? `https://t.me/${telegram.replace(/^@/, "")}` : null;
  const wa = whatsapp ? `https://wa.me/${whatsapp.replace(/[^\d]/g, "")}` : null;
  const count = 1 + (tg ? 1 : 0) + (wa ? 1 : 0);
  return (
    <div className={`contact-bar${count === 2 ? " two" : count === 1 ? " one" : ""}`}>
      <a className="btn primary" href={`tel:${phone}`} onClick={() => track(vendorId, "call")}><Phone />{labels.call}</a>
      {tg && <a className="btn" href={tg} target="_blank" rel="noopener" onClick={() => track(vendorId, "telegram")}><Plane />{labels.telegram}</a>}
      {wa && <a className="btn" href={wa} target="_blank" rel="noopener" onClick={() => track(vendorId, "whatsapp")}><Chat />{labels.whatsapp}</a>}
    </div>
  );
}

// The small call button in a profile's sticky bar. Counted like the others.
export function CallPill({ vendorId, phone, label }: { vendorId: number; phone: string; label: string }) {
  return <a className="btn primary small ln-call" href={`tel:${phone}`} onClick={() => track(vendorId, "call")}>{label}</a>;
}
