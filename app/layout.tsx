import "./globals.css";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { i18n } from "@/lib/i18n";
import { currentProfile } from "@/lib/accounts";
import { homeFor } from "@/lib/roles";

export const metadata: Metadata = {
  title: { default: "Dir Moments: find event vendors in Addis Ababa", template: "%s · Dir Moments" },
  description: "A free directory of photographers, videographers, makeup artists, decorators, DJs, singers, bands, cake bakers, painters and event planners in Addis Ababa.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1c1420" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { lang, t } = await i18n();
  const me = await currentProfile();
  return (
    <html lang={lang}>
      <body>
        <header className="site-header">
          <div className="wrap">
            <Link href="/" className="logo" aria-label="Dir Moments, home">Dir<span>Moments</span></Link>
            <nav className="nav">
              <Link href="/vendors">{t("browse")}</Link>
              <Link href="/join" className="hide-sm">{t("listBusiness")}</Link>
              {me
                ? <Link href={homeFor(me.role)}>{me.name || t("account")}</Link>
                : <Link href="/account/signin">{t("signIn")}</Link>}
              <a className="lang" href={`/lang?to=${lang === "am" ? "en" : "am"}`} hrefLang={lang === "am" ? "en" : "am"}>
                {lang === "am" ? "English" : "አማርኛ"}
              </a>
            </nav>
          </div>
        </header>
        <main className="wrap">{children}</main>
        <footer className="site-footer">
          <div className="wrap foot">
            <p style={{ margin: 0 }}>{t("footer")}</p>
            <ul className="foot-links">
              <li><Link href="/vendors">{t("browse")}</Link></li>
              <li><Link href="/join">{t("listBusiness")}</Link></li>
              <li><Link href="/pricing">Pro &amp; Featured</Link></li>
              <li><Link href="/admin">Admin</Link></li>
            </ul>
          </div>
        </footer>
      </body>
    </html>
  );
}
