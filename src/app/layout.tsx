import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "iMage",
  description: "Batch image editing workflow manager built on Next.js and Supabase.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
