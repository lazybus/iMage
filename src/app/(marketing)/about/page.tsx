import { InfoPage } from "@/components/marketing/info-page";

const sections = [
  {
    title: "What iMage is built to do",
    paragraphs: [
      "iMage is designed for people who need a cleaner way to manage repeatable image-editing work. Instead of running one-off edits in isolation, the product organizes uploads into batches so each image can carry its own prompt, status, output, and rerun history.",
      "The current implementation is structured around authenticated dashboards, private storage, downloadable results, and queue-oriented processing endpoints that can connect to external image providers.",
    ],
  },
  {
    title: "How the workflow works",
    paragraphs: [
      "Users create an account, upload source images, define prompts per image, and launch either individual runs or full-batch processing. As jobs complete, users can review status, inspect outputs, and download final assets one at a time or as grouped exports.",
      "That workflow is intended to support production-minded image operations where traceability, batching, and reruns matter as much as the edit itself.",
    ],
  },
  {
    title: "Current project status",
    paragraphs: [
      "This site is still in an early launch phase. Some legal, operational, and retention details have intentionally been left as placeholders while the product owner finalizes business and compliance decisions.",
      "If you are reviewing the service before launch, use the footer links to inspect the current draft policies and identify any sections that need final business input or attorney review.",
    ],
  },
] as const;

export default function AboutPage() {
  return (
    <InfoPage
      aside={
        <div className="space-y-4 text-sm">
          <p className="eyebrow">Core ideas</p>
          <p className="info-page-copy">Batch structure, private asset handling, prompt-per-image control, queued processing, and straightforward downloads.</p>
        </div>
      }
      effectiveDate="April 16, 2026"
      eyebrow="About"
      sections={sections}
      summary="A short introduction to the product direction behind iMage and the workflow it is designed to support for authenticated, batch-oriented image editing."
      title="About iMage"
    />
  );
}