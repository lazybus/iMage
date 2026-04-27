import type { Metadata } from "next";

import "@/app/globals.css";
import { AnalyticsConsent } from "@/components/theme/analytics-consent";
import { SiteFooter } from "@/components/theme/site-footer";

export const metadata: Metadata = {
  title: "iMage",
  description: "Batch image editing workflow manager built on Next.js and Supabase.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html data-theme="dark" lang="en" suppressHydrationWarning>
      <body data-theme="dark">
        <div className="site-frame">
          <div className="site-main">{children}</div>
          <SiteFooter />
        </div>
        <AnalyticsConsent />
      </body>
    </html>
  );
}
