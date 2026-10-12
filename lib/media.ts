import sharp from "sharp";
import { randomBytes } from "node:crypto";

// v1 wrote uploads to local disk. No free host keeps a filesystem across a
// redeploy or a restart, so vendor photos would quietly disappear - and photos
// are the whole product for a photographer. They now go to Supabase Storage,
// the same project that holds the database, and are served from its CDN rather
// than back through the app.
//
// Uploaded over the Storage REST API with fetch rather than @supabase/supabase-js:
// this is the only thing the app needs from it, and the project deliberately
// runs on five dependencies.

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "media";
const MAX_INPUT = 15 * 1024 * 1024;

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    // Missing configuration is a deployment mistake, not a bad photo. Throwing
    // says so once, loudly, instead of letting every upload report itself as an
    // unreadable image while the vendor tries smaller and smaller files.
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to accept photo uploads. See .env.example.",
    );
  }
  return { url: url.replace(/\/+$/, ""), key };
}

/** Public URL of a stored object. The bucket is public, so nothing is signed. */
function publicUrl(name: string) {
  return `${config().url}/storage/v1/object/public/${BUCKET}/${name}`;
}

/**
 * Compress a photo for slow connections (max 1200px WebP, ~100-200 KB) and put
 * it in the bucket. Returns the public URL, or null when the file is not an
 * image we can read or the upload fails - the caller shows "photo-failed" and
 * keeps the rest of the profile.
 */
export async function savePhoto(file: File): Promise<string | null> {
  if (!file || file.size === 0 || file.size > MAX_INPUT || !file.type.startsWith("image/")) return null;
  const { url, key } = config();

  let out: Buffer;
  try {
    out = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 72 })
      .toBuffer();
  } catch {
    return null;
  }

  const name = `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}.webp`;
  let res: Response;
  try {
    res = await fetch(`${url}/storage/v1/object/${BUCKET}/${name}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "image/webp",
        // Names carry random bytes, so an object is never rewritten and can be
        // cached for as long as the CDN will hold it.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
      body: new Uint8Array(out),
    });
  } catch (e) {
    console.error("Storage upload failed to reach Supabase:", e);
    return null;
  }

  if (!res.ok) {
    console.error("Storage upload rejected:", res.status, await res.text().catch(() => ""));
    return null;
  }
  return publicUrl(name);
}
