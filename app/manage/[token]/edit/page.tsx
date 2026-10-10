import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { i18n } from "@/lib/i18n";
import { vendorBy, vendorDetail } from "@/lib/vendors";
import { saveVendorForm } from "@/lib/vendorForm";
import { formError } from "@/lib/formErrors";
import { VendorForm } from "@/components/VendorForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit profile", robots: { index: false } };

type Params = Promise<{ token: string }>;

export default async function EditProfile({ params, searchParams }: { params: Params; searchParams: Promise<{ error?: string }> }) {
  const { token } = await params;
  const { error } = await searchParams;
  const { lang } = await i18n();
  const v = await vendorBy("manage_token", token);
  if (!v) notFound();
  const { packages, items } = await vendorDetail(v.id);

  async function save(fd: FormData) {
    "use server";
    const current = await vendorBy("manage_token", token);
    if (!current) notFound();
    const res = await saveVendorForm(fd, current);
    if (!res.ok) redirect(`/manage/${token}/edit?error=${res.error}`);
    const n = res.notices.length ? `&notices=${encodeURIComponent(res.notices.join(","))}` : "";
    redirect(`/manage/${token}?saved=1${n}`);
  }

  return (
    <div style={{ marginTop: "1rem" }}>
      <p><Link href={`/manage/${token}`}>← {lang === "am" ? "ተመለስ" : "Back"}</Link></p>
      <h1>{lang === "am" ? "መገለጫ አስተካክል" : "Edit profile"}</h1>
      {error && <div className="notice error">{formError(error, lang)}</div>}
      <VendorForm categoryKey={v.category} lang={lang} action={save} vendor={v} packages={packages} items={items} plan={v.plan}
        submitLabel={lang === "am" ? "አስቀምጥ" : "Save"} />
    </div>
  );
}
