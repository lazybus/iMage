import { InfoPage } from "@/components/marketing/info-page";

const sections = [
  {
    title: "Purpose",
    paragraphs: [
      "This Acceptable Use Policy explains the rules for using iMage responsibly. It is intended to protect the service, our infrastructure providers, and other users who rely on private batch image workflows.",
    ],
  },
  {
    title: "Prohibited activity",
    paragraphs: [
      "You may not use the service to engage in illegal activity, violate another person's rights, or interfere with the normal operation or security of the platform.",
    ],
    listItems: [
      "Uploading content you do not have the right to use or process",
      "Submitting prompts or images intended to harass, defraud, or impersonate others",
      "Attempting to bypass authentication, access another user's files, or probe private infrastructure",
      "Automating requests in a way that degrades system stability or disrupts queue processing",
      "Using the service to create or distribute content in violation of law or contractual restrictions",
    ],
  },
  {
    title: "Enforcement",
    paragraphs: [
      "We may remove content, pause jobs, restrict features, or suspend accounts when we reasonably believe this policy, our terms, or applicable law has been violated.",
      "Where appropriate, we may preserve logs, prompts, job metadata, or other evidence needed to investigate abuse and coordinate with providers or authorities.",
    ],
  },
] as const;

export default function AcceptableUsePage() {
  return (
    <InfoPage
      aside={
        <div className="space-y-4 text-sm">
          <p className="eyebrow">Scope</p>
          <p className="info-page-copy">This policy is designed for a product that stores private uploads, queues image jobs, and returns downloadable outputs to authenticated users.</p>
        </div>
      }
      effectiveDate="April 16, 2026"
      eyebrow="Policy"
      sections={sections}
      summary="Rules for lawful, respectful, and secure use of iMage, including restrictions on abusive uploads, rights violations, and attempts to interfere with the platform."
      title="Acceptable Use Policy"
    />
  );
}