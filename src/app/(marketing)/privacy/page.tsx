import { InfoPage } from "@/components/marketing/info-page";

const sections = [
  {
    title: "What this policy covers",
    paragraphs: [
      "This Privacy Policy explains how iMage collects, uses, stores, and discloses information when people create an account, upload images, enter prompts, run batch edits, and download processed outputs through the service.",
      "This is a first-draft policy for pre-launch review. Where business details are still being finalized, we have marked them clearly so they can be completed before public launch.",
    ],
  },
  {
    title: "Information you provide",
    paragraphs: [
      "You may provide account details such as email address and authentication credentials through our authentication provider. You may also provide source images, text prompts, batch names, and other workflow metadata when you use the editing tools.",
      "If you contact us directly, we may receive your name, contact details, and the contents of your message or support request.",
    ],
    listItems: [
      "Account and login information",
      "Uploaded source images and generated outputs",
      "Per-image prompts, batch titles, and run history",
      "Support and legal contact correspondence",
    ],
  },
  {
    title: "How we use information",
    paragraphs: [
      "We use information to operate the product, secure access to private image jobs, process queued editing tasks, return downloadable results, troubleshoot failures, and improve reliability of the service.",
      "We may also use logs and workflow metadata to investigate abuse, enforce our policies, satisfy legal obligations, and maintain records of prior runs for operational history.",
    ],
  },
  {
    title: "Third-party processing and infrastructure",
    paragraphs: [
      "iMage relies on third-party infrastructure providers. Based on the current implementation, account and storage functions are handled through Supabase, and image-editing requests may be routed through a Nano Banana provider adapter and related model infrastructure.",
      "Those providers may process your images, prompts, and related metadata as needed to deliver the requested output. Their own terms and privacy practices apply to data they handle on our behalf or under their own policies.",
    ],
  },
  {
    title: "Storage, retention, and deletion",
    paragraphs: [
      "We store source images, processed outputs, and workflow records so users can access batches, rerun edits, and download previous results. Specific retention windows are still being finalized.",
      "Retention placeholder: [Insert source image retention period], [insert processed output retention period], and [insert account deletion timeline]. Update this section before launch to reflect the actual operational policy.",
    ],
  },
  {
    title: "Your choices and rights",
    paragraphs: [
      "Depending on where you live, you may have rights to access, correct, delete, or export certain personal information. You may also have the right to object to or restrict some processing activities.",
      "Until self-service account management is finalized, requests can be sent to the contact details listed on our Legal Notice page. We may need to verify your identity before completing certain requests.",
    ],
  },
  {
    title: "Contact",
    paragraphs: [
      "For privacy questions, data requests, or complaints, contact [Insert privacy contact name or team] at legal@example.com and replace that placeholder address before launch.",
    ],
  },
] as const;

export default function PrivacyPage() {
  return (
    <InfoPage
      aside={
        <div className="space-y-4 text-sm">
          <p className="eyebrow">Quick view</p>
          <p className="info-page-copy">iMage processes account details, uploaded images, prompts, and run metadata so users can manage private batch editing workflows.</p>
          <p className="info-page-copy">Retention, operator identity, and final jurisdiction details remain placeholders in this draft.</p>
        </div>
      }
      effectiveDate="April 16, 2026"
      eyebrow="Privacy"
      sections={sections}
      summary="A first-draft explanation of how iMage handles account data, image uploads, prompts, processing records, and third-party infrastructure used to deliver batch image edits."
      title="Privacy Policy"
    />
  );
}