import type { ReactNode } from "react";

import { TopMenu } from "@/components/theme/top-menu";

type InfoSection = {
  title: string;
  paragraphs: readonly string[];
  listItems?: readonly string[];
};

type InfoPageProps = {
  eyebrow: string;
  title: string;
  summary: string;
  effectiveDate: string;
  sections: readonly InfoSection[];
  aside?: ReactNode;
};

export function InfoPage({ eyebrow, title, summary, effectiveDate, sections, aside }: InfoPageProps) {
  return (
    <main className="shell py-8 sm:py-10">
      <TopMenu />
      <section className="info-page panel rounded-[40px] px-6 py-8 sm:px-10 sm:py-12">
        <div className="info-page-grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="space-y-8">
            <header className="space-y-5 border-b border-[var(--line)] pb-8">
              <p className="eyebrow">{eyebrow}</p>
              <div className="space-y-4">
                <h1 className="section-title">{title}</h1>
                <p className="info-page-summary">{summary}</p>
              </div>
              <p className="text-sm muted">Effective date: {effectiveDate}</p>
            </header>

            <div className="space-y-8">
              {sections.map((section) => (
                <section className="space-y-4" key={section.title}>
                  <h2 className="info-page-heading">{section.title}</h2>
                  {section.paragraphs.map((paragraph) => (
                    <p className="info-page-copy" key={paragraph}>
                      {paragraph}
                    </p>
                  ))}
                  {section.listItems ? (
                    <ul className="info-page-list">
                      {section.listItems.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>
          </div>

          {aside ? <aside className="info-page-aside surface-soft rounded-[28px] p-6">{aside}</aside> : null}
        </div>
      </section>
    </main>
  );
}