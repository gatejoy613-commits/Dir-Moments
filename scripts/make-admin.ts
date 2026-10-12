// Promotes an existing account to admin. The admin role is deliberately not
// self-assignable anywhere in the app, so this is the only way to create one.
//
//   npm run make-admin -- someone@example.com

import { one, q } from "../lib/db";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npm run make-admin -- someone@example.com");
    process.exit(1);
  }
  const p = await one<{ id: string; role: string }>(
    "SELECT id, role FROM profiles WHERE lower(email) = lower($1)", [email],
  );
  if (!p) {
    console.error(`No account for ${email}. Have them sign up at /account/signup first.`);
    process.exit(1);
  }
  if (p.role === "admin") {
    console.log(`${email} is already an admin.`);
    return;
  }
  await q("UPDATE profiles SET role = 'admin' WHERE id = $1", [p.id]);
  console.log(`${email} is now an admin (was ${p.role}).`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
