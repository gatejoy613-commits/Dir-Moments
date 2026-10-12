import { notFound, redirect } from "next/navigation";
import { category } from "@/lib/catalog";
import { i18n } from "@/lib/i18n";
import { saveVendorForm } from "@/lib/vendorForm";
import { requireRole } from "@/lib/accounts";
import { formError } from "@/lib/formErrors";
import { VendorForm } from "@/components/VendorForm";

type Params = Promise<{ category: string }>;

async function create(fd: FormData) {
  "use server";
  // The listing belongs to the account that creates it; that is what makes
  // "edit your own listing only" true later.
  const me = await requireRole("vendor", "admin");
  const res = await saveVendorForm(fd, null, me.id);
  const cat = String(fd.get("category"));
  if (!res.ok) redirect(`/join/${cat}?error=${res.error}`);
  const n = res.notices.length ? `&notices=${encodeURIComponent(res.notices.join(","))}` : "";
  redirect(`/manage?welcome=1${n}`);
}

export default async function JoinCategory({ params, searchParams }: { params: Params; searchParams: Promise<{ error?: string }> }) {
  const { category: key } = await params;
  const { error } = await searchParams;
  const cat = category(key);
  if (!cat) notFound();
  await requireRole("vendor", "admin");
  const { lang } = await i18n();
  return (
    <div style={{ marginTop: "1rem" }}>
      <h1>{cat.icon} {cat.one[lang]}</h1>
      <p className="muted">{lang === "am" ? "ያለዎትን ይሙሉ፤ የቀረውን በኋላ ማከል ይችላሉ።" : "Fill in what you have now; you can add the rest later from your private link."}</p>
      {error && <div className="notice error">{formError(error, lang)}</div>}
      <VendorForm categoryKey={key} lang={lang} action={create} submitLabel={lang === "am" ? "ለግምገማ ላክ" : "Send for review"} />
    </div>
  );
}
