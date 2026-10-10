import { q } from "@/lib/db";

// Records a contact tap (call, Telegram, WhatsApp). Sent with navigator.sendBeacon from the profile page.
export async function POST(req: Request) {
  const body = await req.text();
  let data: { vendorId?: number; channel?: string } = {};
  try { data = JSON.parse(body); } catch {}
  const id = Number(data.vendorId);
  if (!Number.isInteger(id) || !["call", "telegram", "whatsapp"].includes(data.channel ?? "")) {
    return new Response("bad request", { status: 400 });
  }
  await q("INSERT INTO contact_events (vendor_id, channel) SELECT id, $2 FROM vendors WHERE id = $1 AND status = 'approved'", [id, data.channel]);
  return new Response(null, { status: 204 });
}
