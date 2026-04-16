import Link from "next/link";

import { InfoPage } from "@/components/marketing/info-page";

const sections = [
  {
    title: "Operator details",
    paragraphs: [
      "Legal entity placeholder: [Insert full legal business name]. Registered address placeholder: [Insert registered or principal business address]. Replace both placeholders before launch.",
      "If iMage is operated through a separate support or compliance vendor, add that relationship here before publishing this page.",
    ],
  },
  {
    title: "How to contact us",
    paragraphs: [
      "General legal contact placeholder: legal@example.com. Privacy contact placeholder: privacy@example.com. Support contact placeholder: support@example.com.",
      "Response-time placeholder: [Insert target response times for legal, privacy, and support requests if you want to make that commitment publicly].",
    ],
  },
  {
    title: "Related policies",
    paragraphs: [
      "This page works alongside our Privacy Policy, Terms of Service, Cookie Policy, and Acceptable Use Policy. Review those pages together so users can understand how the service operates and how requests should be directed.",
    ],
  },
] as const;

export default function LegalPage() {
  return (
    <InfoPage
      aside={
        <div className="space-y-4 text-sm">
          <p className="eyebrow">Policy links</p>
          <div className="grid gap-3">
            <Link className="footer-link" href="/privacy">
              Privacy Policy
            </Link>
            <Link className="footer-link" href="/terms">
              Terms of Service
            </Link>
            <Link className="footer-link" href="/cookies">
              Cookie Policy
            </Link>
            <Link className="footer-link" href="/acceptable-use">
              Acceptable Use Policy
            </Link>
          </div>
        </div>
      }
      effectiveDate="April 16, 2026"
      eyebrow="Contact"
      sections={sections}
      summary="The current draft contact and operator page for iMage. Replace the placeholders on this page with real legal and support details before public launch."
      title="Legal Notice"
    />
  );
}