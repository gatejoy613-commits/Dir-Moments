import "./globals.css";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { i18n } from "@/lib/i18n";

export const metadata: Metadata = {
  title: { default: "Dir Moments: find event vendors in Addis Ababa", template: "%s · Dir Moments" },
  description: "A free directory of photographers, videographers, makeup artists, decorators, DJs, singers, bands, cake bakers, painters and event planners in Addis Ababa.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0f6e5a" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { lang, t } = await i18n();
  return (
    <html lang={lang}>
      <body>
        <header className="site-header">
          <div className="wrap">
            <Link href="/" className="logo">Dir<span>Moments</span></Link>
            <nav className="nav">
              <Link href="/vendors">{t("browse")}</Link>
              <Link href="/join" className="hide-sm">{t("listBusiness")}</Link>
              <a className="lang" href={`/lang?to=${lang === "am" ? "en" : "am"}`} hrefLang={lang === "am" ? "en" : "am"}>
                {lang === "am" ? "English" : "አማርኛ"}
              </a>
            </nav>
          </div>
        </header>
        <main className="wrap">{children}</main>
        <footer className="site-footer">
          <div className="wrap stack">
            <p>{t("footer")}</p>
            <p className="row">
              <Link href="/join">{t("listBusiness")}</Link> · <Link href="/pricing">Pro &amp; Featured</Link> · <Link href="/admin">Admin</Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
