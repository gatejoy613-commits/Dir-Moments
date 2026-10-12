import { redirect } from "next/navigation";
import Link from "next/link";
import { i18n } from "@/lib/i18n";
import { currentVendorId, requireRole } from "@/lib/accounts";
import { vendorBy, vendorDetail } from "@/lib/vendors";
import { saveVendorForm } from "@/lib/vendorForm";
import { formError } from "@/lib/formErrors";
import { VendorForm } from "@/components/VendorForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit profile", robots: { index: false } };

/** Whose listing this is comes from the session, never from the request. */
async function currentVendor() {
  await requireRole("vendor", "admin");
  const id = await currentVendorId();
  const v = id ? await vendorBy("id", id) : null;
  if (!v) redirect("/join");
  return v;
}

export default async function EditProfile({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { lang } = await i18n();
  const v = await currentVendor();
  const { packages, items } = await vendorDetail(v.id);

  async function save(fd: FormData) {
    "use server";
    // Re-read rather than closing over the vendor: the session may have expired
    // while the form sat open, and a stale id must not be written through.
    const current = await currentVendor();
    const res = await saveVendorForm(fd, current);
    if (!res.ok) redirect(`/manage/edit?error=${res.error}`);
    const n = res.notices.length ? `&notices=${encodeURIComponent(res.notices.join(","))}` : "";
    redirect(`/manage?saved=1${n}`);
  }

  return (
    <div style={{ marginTop: "1rem" }}>
      <p><Link href="/manage">← {lang === "am" ? "ተመለስ" : "Back"}</Link></p>
      <h1>{lang === "am" ? "መገለጫ አስተካክል" : "Edit profile"}</h1>
      {error && <div className="notice error">{formError(error, lang)}</div>}
      <VendorForm categoryKey={v.category} lang={lang} action={save} vendor={v} packages={packages} items={items} plan={v.plan}
        submitLabel={lang === "am" ? "አስቀምጥ" : "Save"} />
    </div>
  );
}
