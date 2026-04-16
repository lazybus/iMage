import { InfoPage } from "@/components/marketing/info-page";

const sections = [
  {
    title: "Service overview",
    paragraphs: [
      "iMage provides an authenticated workflow for uploading images, attaching prompts, running queued image edits, and retrieving processed results. These Terms of Service govern your access to and use of the service.",
      "This draft is designed to give the product a launch-ready structure before final legal review. Replace all placeholders with final business details before relying on these terms in production.",
    ],
  },
  {
    title: "Eligibility and accounts",
    paragraphs: [
      "You must provide accurate account information and keep your login credentials secure. You are responsible for activity that occurs under your account unless it results from our failure to use reasonable security measures.",
      "We may suspend or restrict access if we reasonably believe an account is being used unlawfully, in violation of these terms, or in a way that threatens the service or other users.",
    ],
  },
  {
    title: "Your content",
    paragraphs: [
      "You retain ownership of the source images, prompts, and other content you submit, subject to the rights needed for us and our providers to host, process, transmit, and return outputs through the service.",
      "You represent that you have the rights necessary to upload and process your content, including any rights required for the images, text, trademarks, or likenesses contained in that content.",
    ],
  },
  {
    title: "Acceptable use",
    paragraphs: [
      "You may not use iMage to break the law, violate others' rights, bypass security, overload the system, or submit content that infringes intellectual property, privacy, or publicity rights.",
      "Our Acceptable Use Policy is incorporated into these terms and provides additional detail on prohibited activities.",
    ],
  },
  {
    title: "AI-generated output and service limitations",
    paragraphs: [
      "Image generation and editing outputs may be incomplete, inaccurate, or unsuitable for a particular use. You are responsible for reviewing outputs before relying on them in production, publishing them, or distributing them to others.",
      "We do not guarantee uninterrupted availability, exact turnaround times, or that any prompt will produce a particular result. Features, providers, and model integrations may change over time.",
    ],
  },
  {
    title: "Termination and governing terms",
    paragraphs: [
      "We may suspend or terminate access when reasonably necessary to protect the service, comply with law, investigate abuse, or enforce these terms. You may stop using the service at any time.",
      "Governing law placeholder: [Insert governing law and venue]. Commercial terms placeholder: [Insert subscription, billing, or enterprise terms if applicable].",
    ],
  },
  {
    title: "Contact",
    paragraphs: [
      "For legal notices or questions about these Terms, contact [Insert legal entity name] at legal@example.com and replace this placeholder before launch.",
    ],
  },
] as const;

export default function TermsPage() {
  return (
    <InfoPage
      aside={
        <div className="space-y-4 text-sm">
          <p className="eyebrow">Important</p>
          <p className="info-page-copy">Users remain responsible for the rights they need to upload images, submit prompts, and use generated outputs.</p>
          <p className="info-page-copy">This draft does not yet define billing, SLAs, or a final governing-law clause.</p>
        </div>
      }
      effectiveDate="April 16, 2026"
      eyebrow="Legal"
      sections={sections}
      summary="Draft terms covering account access, uploaded content, acceptable use, AI output limitations, and the baseline rules for using iMage."
      title="Terms of Service"
    />
  );
}