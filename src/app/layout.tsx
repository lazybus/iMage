import type { Metadata } from "next";
import Script from "next/script";

import "@/app/globals.css";
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

export const metadata: Metadata = {
  title: "iMage",
  description: "Batch image editing workflow manager built on Next.js and Supabase.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html data-theme="dark" lang="en" suppressHydrationWarning>
      <body data-theme="dark">
        <Script dangerouslySetInnerHTML={{ __html: themeInitScript }} id="theme-init" strategy="beforeInteractive" />
        <div className="site-frame">
          <div className="site-main">{children}</div>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
