import { InfoPage } from "@/components/marketing/info-page";

const sections = [
  {
    title: "How cookies and similar technologies are used",
    paragraphs: [
      "iMage uses a limited set of browser storage and session technologies to keep users signed in, remember interface preferences, and protect secure routes. The current implementation also stores a local theme preference in the browser.",
      "If you opt in, iMage also loads Google Analytics to measure page visits, successful batch creation, and successful processing starts for image jobs. Analytics remains disabled until consent is granted through the on-site preference controls.",
    ],
  },
  {
    title: "Categories of use",
    paragraphs: [
      "Some cookies or storage items are strictly necessary for authentication, security, and basic product operation. Others may support interface preferences, diagnostics, or performance monitoring.",
    ],
    listItems: [
      "Essential authentication and session controls",
      "Security-related tokens and route protection",
      "Preference storage, such as theme selection",
      "Optional Google Analytics measurement when you opt in",
    ],
  },
  {
    title: "Your options",
    paragraphs: [
      "You can manage many browser storage settings through your browser controls. Disabling essential cookies or storage may prevent login flows, dashboard access, or protected downloads from functioning correctly.",
      "Analytics preferences can be set from the consent banner when you first visit the site and reopened later from the Cookie Preferences control in the footer. Choosing essential-only keeps Google Analytics disabled.",
    ],
  },
] as const;

export default function CookiesPage() {
  return (
    <InfoPage
      aside={
        <div className="space-y-4 text-sm">
          <p className="eyebrow">Current state</p>
          <p className="info-page-copy">The codebase uses browser storage for theme preference, relies on authentication/session controls for protected routes, and now exposes an explicit opt-in control for Google Analytics.</p>
        </div>
      }
      effectiveDate="April 16, 2026"
      eyebrow="Cookies"
      sections={sections}
      summary="A draft description of the small set of cookie and browser-storage behaviors used for authentication, route protection, saved interface preferences, and optional consent-based analytics in iMage."
      title="Cookie Policy"
    />
  );
}