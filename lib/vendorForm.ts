import { pool } from "./db";
import { category } from "./catalog";
import { template, LOOKS } from "./templates";
import { TIERS, type Plan } from "./tiers";
import { savePhoto } from "./media";
import { newManageToken } from "./auth";
import { normalisePhone, slugify, str } from "./util";
import type { VendorRow } from "./vendors";

export type SaveResult =
  | { ok: true; vendorId: number; slug: string; token: string; notices: string[] }
  | { ok: false; error: string };

const MAX_PACKAGE_ROWS = 12;

/** Creates or updates a vendor from the template-driven profile form. */
export async function saveVendorForm(fd: FormData, existing: VendorRow | null): Promise<SaveResult> {
  const cat = existing?.category ?? str(fd.get("category"));
  const tpl = template(cat);
  if (!tpl || !category(cat)) return { ok: false, error: "category" };
  const plan: Plan = existing?.plan ?? "free";
  const limits = TIERS[plan];
  const notices: string[] = [];

  const name = str(fd.get("name")).slice(0, 80);
  const phone = normalisePhone(str(fd.get("phone")));
  if (!name) return { ok: false, error: "name" };
  if (!phone) return { ok: false, error: "phone" };

  const whatsappRaw = str(fd.get("whatsapp"));
  const whatsapp = whatsappRaw ? normalisePhone(whatsappRaw) : null;
  const telegram = str(fd.get("telegram")).replace(/^https?:\/\/t\.me\//, "").replace(/^@/, "").replace(/[^A-Za-z0-9_]/g, "").slice(0, 40) || null;

  let look = str(fd.get("look")) || "classic";
  const lookDef = LOOKS.find((l) => l.key === look);
  if (!lookDef || (lookDef.paid && !limits.premiumLooks)) look = "classic";

  const sections: VendorRow["sections"] = {};
  for (const s of tpl.sections) {
    if (s.kind === "text") {
      const en = str(fd.get(`s_${s.key}_en`)).slice(0, 2000);
      const am = str(fd.get(`s_${s.key}_am`)).slice(0, 2000);
      if (en || am) sections[s.key] = { en, am };
    } else if (s.kind === "tags") {
      const tags = fd.getAll(`s_${s.key}_tags`).map(String).filter((k) => s.options?.some((o) => o.key === k));
      if (tags.length) sections[s.key] = { tags };
    }
  }

  // Packages
  type Pkg = { name: string; name_am: string; price: number; hours: number | null; from: boolean; inc: string };
  const pkgs: Pkg[] = [];
  for (let i = 0; i < MAX_PACKAGE_ROWS; i++) {
    const pname = str(fd.get(`pk_${i}_name`)).slice(0, 80);
    const price = Number(str(fd.get(`pk_${i}_price`)).replace(/[^\d]/g, ""));
    if (!pname || !price) continue;
    const hours = Number(str(fd.get(`pk_${i}_hours`)));
    pkgs.push({
      name: pname, name_am: str(fd.get(`pk_${i}_name_am`)).slice(0, 80), price,
      hours: hours > 0 ? Math.min(hours, 99) : null, from: fd.get(`pk_${i}_from`) === "1",
      inc: str(fd.get(`pk_${i}_inc`)).slice(0, 1000),
    });
  }
  if (pkgs.length > limits.packages) {
    notices.push(`packages:${limits.packages}`);
    pkgs.length = limits.packages;
  }
  const startingRaw = Number(str(fd.get("starting_price")).replace(/[^\d]/g, ""));
  const startingPrice = startingRaw || (pkgs.length ? Math.min(...pkgs.map((p) => p.price)) : null);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    let vendorId: number;
    let slug: string;
    let token: string;
    const values = [
      name, str(fd.get("name_am")).slice(0, 80) || null, look,
      str(fd.get("bio")).slice(0, 3000), str(fd.get("bio_am")).slice(0, 3000), JSON.stringify(sections),
      phone, telegram, whatsapp, startingPrice,
    ];
    if (existing) {
      vendorId = existing.id; slug = existing.slug; token = existing.manage_token;
      await client.query(
        `UPDATE vendors SET name=$1, name_am=$2, look=$3, bio=$4, bio_am=$5, sections=$6,
           phone=$7, telegram=$8, whatsapp=$9, starting_price=$10, updated_at=now() WHERE id=$11`,
        [...values, vendorId],
      );
    } else {
      const base = slugify(name);
      slug = base;
      for (let n = 2; (await client.query("SELECT 1 FROM vendors WHERE slug = $1", [slug])).rowCount; n++) slug = `${base}-${n}`;
      token = newManageToken();
      const r = await client.query(
        `INSERT INTO vendors (name, name_am, look, bio, bio_am, sections, phone, telegram, whatsapp, starting_price, category, slug, manage_token)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
        [...values, cat, slug, token],
      );
      vendorId = r.rows[0].id;
    }

    await client.query("DELETE FROM packages WHERE vendor_id = $1", [vendorId]);
    for (const [i, p] of pkgs.entries()) {
      await client.query(
        "INSERT INTO packages (vendor_id, name, name_am, inclusions, hours, price, starting_from, position) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
        [vendorId, p.name, p.name_am || null, p.inc, p.hours, p.price, p.from, i],
      );
    }

    // Existing photos: captions and removals.
    const existingItems = (await client.query<{ id: number; kind: string; section: string }>(
      "SELECT id, kind, section FROM portfolio_items WHERE vendor_id = $1", [vendorId],
    )).rows;
    for (const it of existingItems.filter((x) => x.kind === "photo")) {
      if (fd.get(`item_${it.id}_remove`) === "1") {
        await client.query("DELETE FROM portfolio_items WHERE id = $1", [it.id]);
      } else if (fd.has(`item_${it.id}_caption`)) {
        await client.query("UPDATE portfolio_items SET caption = $1 WHERE id = $2", [str(fd.get(`item_${it.id}_caption`)).slice(0, 120) || null, it.id]);
      }
    }
    let photoCount = Number((await client.query("SELECT count(*) FROM portfolio_items WHERE vendor_id = $1 AND kind = 'photo'", [vendorId])).rows[0].count);
    let videoCount = 0;
    let photoLimitHit = false;
    let videoLimitHit = false;

    for (const s of tpl.sections) {
      if (s.kind === "gallery") {
        const files = fd.getAll(`g_${s.key}_files`).filter((f): f is File => typeof f !== "string" && f.size > 0);
        let pos = Number((await client.query("SELECT COALESCE(max(position), 0) AS m FROM portfolio_items WHERE vendor_id = $1 AND section = $2", [vendorId, s.key])).rows[0].m);
        for (const f of files) {
          if (photoCount >= limits.photos) { photoLimitHit = true; break; }
          const url = await savePhoto(f);
          if (!url) { notices.push("photo-failed"); continue; }
          await client.query("INSERT INTO portfolio_items (vendor_id, section, kind, url, position) VALUES ($1,$2,'photo',$3,$4)", [vendorId, s.key, url, ++pos]);
          photoCount++;
        }
      } else if (s.kind === "media") {
        await client.query("DELETE FROM portfolio_items WHERE vendor_id = $1 AND section = $2 AND kind <> 'photo'", [vendorId, s.key]);
        const lines = str(fd.get(`m_${s.key}_links`)).split("\n").map((l) => l.trim()).filter(Boolean);
        let pos = 0;
        for (const line of lines) {
          const [rawUrl, ...cap] = line.split("|");
          const url = rawUrl.trim();
          if (!/^https:\/\/[^\s]+$/.test(url)) continue;
          if (videoCount >= limits.videos) { videoLimitHit = true; break; }
          await client.query(
            "INSERT INTO portfolio_items (vendor_id, section, kind, url, caption, position) VALUES ($1,$2,$3,$4,$5,$6)",
            [vendorId, s.key, s.media === "audio" ? "audio" : "video", url, cap.join("|").trim().slice(0, 120) || null, ++pos],
          );
          videoCount++;
        }
      }
    }
    if (photoLimitHit) notices.push(`photos:${limits.photos}`);
    if (videoLimitHit) notices.push(`videos:${limits.videos}`);
    await client.query("COMMIT");
    return { ok: true, vendorId, slug, token, notices };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
