// Creates the public bucket vendor photos are uploaded to. Safe to re-run:
// an existing bucket is reported and left alone.
//
//   npm run storage:setup

const url = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const bucket = process.env.SUPABASE_STORAGE_BUCKET || "media";

async function main() {
  if (!url || !key) {
    console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env first. See .env.example.");
    process.exit(1);
  }

  const auth = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

  const existing = await fetch(`${url}/storage/v1/bucket/${bucket}`, { headers: auth });
  if (existing.ok) {
    const b = await existing.json();
    console.log(`Bucket "${bucket}" already exists (public: ${b.public}).`);
    if (!b.public) console.log('It is private. Profile photos are shown to everyone, so set it to public in the dashboard.');
    return;
  }

  const res = await fetch(`${url}/storage/v1/bucket`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({
      id: bucket,
      name: bucket,
      // Portfolio photos appear on public profiles, so the objects are public
      // and need no signing. Nothing private is ever put in this bucket.
      public: true,
      // savePhoto only ever writes WebP, and already caps the input at 15 MB.
      // Both limits are repeated here so a stray key cannot fill the project.
      allowed_mime_types: ["image/webp"],
      file_size_limit: 5 * 1024 * 1024,
    }),
  });

  if (!res.ok) {
    console.error(`Could not create bucket "${bucket}":`, res.status, await res.text().catch(() => ""));
    process.exit(1);
  }
  console.log(`Created public bucket "${bucket}".`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
