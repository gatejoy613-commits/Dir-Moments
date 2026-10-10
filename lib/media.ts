import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

// v1 stores uploads on local disk. Production should use cloud storage behind a CDN.
export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
const MAX_INPUT = 15 * 1024 * 1024;

/** Compress and crop a photo for slow connections: max 1200px wide WebP (~100–200 KB). */
export async function savePhoto(file: File): Promise<string | null> {
  if (!file || file.size === 0 || file.size > MAX_INPUT || !file.type.startsWith("image/")) return null;
  const buf = Buffer.from(await file.arrayBuffer());
  try {
    const out = await sharp(buf).rotate().resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true }).webp({ quality: 72 }).toBuffer();
    await mkdir(UPLOAD_DIR, { recursive: true });
    const name = `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}.webp`;
    await writeFile(path.join(UPLOAD_DIR, name), out);
    return `/media/${name}`;
  } catch {
    return null;
  }
}

export async function readMedia(name: string) {
  if (!/^[a-z0-9-]+\.webp$/.test(name)) return null;
  try { return await readFile(path.join(UPLOAD_DIR, name)); } catch { return null; }
}
