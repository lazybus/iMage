import type { Metadata } from "next";
import Script from "next/script";

import "@/app/globals.css";
import { AnalyticsConsent } from "@/components/theme/analytics-consent";
import { SiteFooter } from "@/components/theme/site-footer";

const themeInitScript = `(() => {
  const storageKey = "image-theme";
  const root = document.documentElement;
  const body = document.body;
  const storedTheme = window.localStorage.getItem(storageKey);
  const theme = storedTheme === "light" || storedTheme === "dark" ? storedTheme : "dark";
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  if (body) {
    body.dataset.theme = theme;
  }
})();`;

const googleAnalyticsId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID?.trim();

const analyticsInitScript = googleAnalyticsId
  ? `window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function gtag(){window.dataLayer.push(arguments);};
window.gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied'
});`
  : null;

export const metadata: Metadata = {
  title: "iMage",
  description: "Batch image editing workflow manager built on Next.js and Supabase.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html data-theme="dark" lang="en" suppressHydrationWarning>
      <body data-theme="dark">
        <Script dangerouslySetInnerHTML={{ __html: themeInitScript }} id="theme-init" strategy="beforeInteractive" />
        {analyticsInitScript ? <Script dangerouslySetInnerHTML={{ __html: analyticsInitScript }} id="analytics-init" strategy="beforeInteractive" /> : null}
        <div className="site-frame">
          <div className="site-main">{children}</div>
          <SiteFooter />
        </div>
        <AnalyticsConsent />
      </body>
    </html>
  );
}
