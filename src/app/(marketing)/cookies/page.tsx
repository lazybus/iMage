import { InfoPage } from "@/components/marketing/info-page";

const sections = [
  {
    title: "How cookies and similar technologies are used",
    paragraphs: [
      "iMage uses a limited set of browser storage and session technologies to keep users signed in, remember interface preferences, and protect secure routes. The current implementation also stores a local theme preference in the browser.",
      "If analytics, advertising, or broader personalization tools are added later, this policy should be updated before those tools are enabled in production.",
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
      "Future diagnostics or analytics tooling, if later enabled",
    ],
  },
  {
    title: "Your options",
    paragraphs: [
      "You can manage many browser storage settings through your browser controls. Disabling essential cookies or storage may prevent login flows, dashboard access, or protected downloads from functioning correctly.",
      "Cookie-control placeholder: [Insert final consent or preference-management workflow if one is added before launch].",
    ],
  },
] as const;

export default function CookiesPage() {
  return (
    <InfoPage
      aside={
        <div className="space-y-4 text-sm">
          <p className="eyebrow">Current state</p>
          <p className="info-page-copy">The codebase currently uses browser storage for theme preference and relies on authentication/session controls for protected routes.</p>
        </div>
      }
      effectiveDate="April 16, 2026"
      eyebrow="Cookies"
      sections={sections}
      summary="A draft description of the small set of cookie and browser-storage behaviors currently needed to run authentication, route protection, and saved interface preferences in iMage."
      title="Cookie Policy"
    />
  );
}