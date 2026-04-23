import type { Route } from "next";
import Link from "next/link";

import { AnalyticsPreferencesButton } from "@/components/theme/analytics-preferences-button";

type FooterLink = {
  href: Route;
  label: string;
};

const productLinks: readonly FooterLink[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/batches", label: "Dashboard" },
  { href: "/login", label: "Sign in" },
];

const legalLinks: readonly FooterLink[] = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/cookies", label: "Cookie Policy" },
  { href: "/acceptable-use", label: "Acceptable Use" },
];

const supportLinks: readonly FooterLink[] = [
  { href: "/legal", label: "Legal Notice" },
  { href: "/register", label: "Create account" },
  { href: "/batches", label: "Your batches" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  const hasAnalyticsPreferences = Boolean(process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID?.trim());

  return (
    <footer className="footer-shell">
      <div className="shell">
        <div className="footer-panel panel rounded-[34px] px-6 py-8 sm:px-8 sm:py-10">
          <div className="footer-grid gap-10">
            <section className="space-y-4">
              <div className="eyebrow">
                <span className="text-[var(--brand-mark)]">I</span>
                <span className="text-[var(--brand-word)]">Mage</span>
              </div>
              <p className="footer-tagline">Easy batch image editing powered by AI.</p>
            </section>

            <nav aria-label="Footer" className="footer-link-groups grid gap-8 sm:grid-cols-3">
              <div className="space-y-4">
                <p className="eyebrow">Product</p>
                <ul className="footer-link-list">
                  {productLinks.map((link) => (
                    <li key={link.href}>
                      <Link className="footer-link" href={link.href}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <p className="eyebrow">Legal</p>
                <ul className="footer-link-list">
                  {legalLinks.map((link) => (
                    <li key={link.href}>
                      <Link className="footer-link" href={link.href}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <p className="eyebrow">Support</p>
                <ul className="footer-link-list">
                  {supportLinks.map((link) => (
                    <li key={link.href}>
                      <Link className="footer-link" href={link.href}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          </div>

          <div className="footer-meta mt-8 gap-4 border-t border-[var(--line)] pt-6 text-sm muted">
            <p>© {year} iMage.</p>
            <div className="flex flex-wrap items-center gap-4">
              {hasAnalyticsPreferences ? <AnalyticsPreferencesButton /> : null}
              <a
                className="footer-link"
                href="https://tobstudios.com"
                rel="noreferrer"
                target="_blank"
              >
                Powered by Tob Studios.
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}