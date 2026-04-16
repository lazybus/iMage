import Link from "next/link";

import { TopMenu } from "@/components/theme/top-menu";

const benefits = [
  {
    title: "Batch work without batch chaos",
    description:
      "Upload a full set of images, attach a natural-language instruction to each file, and queue everything from one place.",
  },
  {
    title: "Built for fast review cycles",
    description:
      "Check results as they finish, rerun only the images that need another pass, and keep the rest of the batch moving.",
  },
  {
    title: "Private by default",
    description:
      "Use secure accounts, keep source files in private storage, and control when polished outputs are downloaded or shared.",
  },
  {
    title: "Hours back for real creative work",
    description:
      "Reduce repetitive production edits so designers can spend less time in advanced editing tools and more time on direction and final quality.",
  },
] as const;

const workflowSteps = [
  {
    step: "01",
    title: "Upload your image set",
    description: "Bring in campaign variations, product shots, or routine creative assets in one batch.",
  },
  {
    step: "02",
    title: "Write the instruction for each image",
    description: "Add a prompt per file so every image gets the exact edit request it needs.",
  },
  {
    step: "03",
    title: "Queue the work",
    description: "Send one image or the full batch through the queue and keep production moving in the background.",
  },
  {
    step: "04",
    title: "Review, download, iterate",
    description: "Inspect outputs, grab final files, and rerun only the images that still need refinement.",
  },
] as const;

const audienceCards = [
  {
    title: "Graphic design teams",
    description:
      "Handle repetitive resize, cleanup, replacement, and visual variation tasks without turning every request into manual production labor.",
  },
  {
    title: "Creative operations",
    description:
      "Standardize how batches are submitted, processed, reviewed, and delivered across recurring internal or client work.",
  },
  {
    title: "Agencies and studios",
    description:
      "Move faster on high-volume edits when a project needs many similar changes across a large asset library.",
  },
] as const;

const trustPoints = [
  "Secure accounts for team access",
  "Private image storage for uploaded assets and outputs",
  "Clear batch history for review and reruns",
  "Controlled download flow when results are ready",
] as const;

export default function LandingPage() {
  return (
    <main className="shell py-8 sm:py-10">
      <TopMenu />

      <section className="panel landing-hero mt-6 overflow-hidden rounded-[40px] px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="landing-badge">Public beta</span>
              <span className="eyebrow">Bulk AI image editing for production teams</span>
            </div>

            <div className="space-y-4">
              <h1 className="section-title max-w-4xl">
                Queue high-volume image edits with custom instructions for every image.
              </h1>
              <p className="max-w-2xl text-lg leading-8 muted">
                iMage helps creative teams upload image batches, add a natural-language prompt to each file, queue the work,
                review results, download outputs, and iterate until everything is ready to ship.
              </p>
              <p className="max-w-2xl text-base leading-7 muted">
                Secure accounts and private image storage keep production assets protected while your team saves hours otherwise
                lost to repetitive manual editing.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link className="button button-primary" href="/register">
                Join the beta
              </Link>
              <Link className="button button-secondary" href="/login">
                Sign in
              </Link>
              <Link className="button button-secondary" href="/batches">
                View dashboard
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="landing-mini-card">
                <p className="landing-mini-label">Upload</p>
                <p className="landing-mini-copy">Bring in large sets of source images without splitting work across scattered tools.</p>
              </div>
              <div className="landing-mini-card">
                <p className="landing-mini-label">Queue</p>
                <p className="landing-mini-copy">Queue as many images as you need and keep every file tied to its own instruction.</p>
              </div>
              <div className="landing-mini-card">
                <p className="landing-mini-label">Iterate</p>
                <p className="landing-mini-copy">Review results, refine prompts, and rerun selected images until the output is right.</p>
              </div>
            </div>
          </div>

          <aside className="landing-side-panel rounded-[30px] border border-[var(--line)] p-5 sm:p-6">
            <div className="space-y-5">
              <div>
                <p className="eyebrow">Workflow and outcomes</p>
                <h2 className="mt-3 text-2xl leading-tight">A production-friendly path from raw assets to approved outputs.</h2>
              </div>

              <div className="grid gap-3">
                <div className="landing-detail-card">
                  <span className="landing-detail-kicker">Input</span>
                  <p>Upload source images and define the edit request for each file in plain language.</p>
                </div>
                <div className="landing-detail-card">
                  <span className="landing-detail-kicker">Processing</span>
                  <p>Queue one image or the full batch so repetitive edit work can move without constant manual handling.</p>
                </div>
                <div className="landing-detail-card">
                  <span className="landing-detail-kicker">Output</span>
                  <p>Review completed results, download what is approved, and rerun only the images that still need another pass.</p>
                </div>
              </div>

              <div className="landing-outcome-grid">
                <div className="landing-outcome-card">
                  <span className="landing-outcome-value">Less tool hopping</span>
                  <span className="landing-outcome-copy">Keep upload, prompting, queuing, review, and download in one workflow.</span>
                </div>
                <div className="landing-outcome-card">
                  <span className="landing-outcome-value">More usable time</span>
                  <span className="landing-outcome-copy">
                    Reduce repetitive edits that normally absorb hours in advanced editing software.
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {benefits.map((benefit) => (
          <article className="panel rounded-[28px] p-6" key={benefit.title}>
            <p className="eyebrow">Benefit</p>
            <h2 className="mt-3 text-2xl leading-tight">{benefit.title}</h2>
            <p className="mt-3 leading-7 muted">{benefit.description}</p>
          </article>
        ))}
      </section>

      <section className="panel mt-6 rounded-[36px] px-6 py-8 sm:px-8 sm:py-10 lg:px-12">
        <div className="max-w-3xl space-y-3">
          <p className="eyebrow">Workflow</p>
          <h2 className="section-title text-[clamp(1.8rem,3vw,3rem)]">From image batch to reviewed delivery in four steps.</h2>
          <p className="leading-7 muted">
            The product promise is simple: upload, prompt, queue, review, download, and refine. The workflow is designed for teams
            handling the same kind of edit request again and again.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-4">
          {workflowSteps.map((step) => (
            <article className="landing-step-card" key={step.step}>
              <span className="landing-step-number">{step.step}</span>
              <h3 className="mt-4 text-xl">{step.title}</h3>
              <p className="mt-3 leading-7 muted">{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="panel rounded-[34px] px-6 py-8 sm:px-8">
          <p className="eyebrow">Who it is for</p>
          <h2 className="mt-3 text-3xl leading-tight">Made for designers and creative teams with repetitive editing workloads.</h2>
          <p className="mt-4 leading-7 muted">
            If your team keeps receiving the same kinds of production requests across large image sets, iMage gives you a more direct
            way to move that work through a repeatable system.
          </p>
        </div>

        <div className="grid gap-4">
          {audienceCards.map((card) => (
            <article className="panel rounded-[28px] p-6" key={card.title}>
              <h3 className="text-2xl leading-tight">{card.title}</h3>
              <p className="mt-3 leading-7 muted">{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel mt-6 rounded-[36px] px-6 py-8 sm:px-8 sm:py-10 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div className="space-y-4">
            <p className="eyebrow">Security and storage</p>
            <h2 className="text-3xl leading-tight sm:text-4xl">Keep client work and internal assets in a private, account-based workflow.</h2>
            <p className="leading-7 muted">
              iMage is structured around secure accounts and private image storage so teams can manage sensitive assets with more
              control than ad hoc file sharing and disconnected editing requests.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {trustPoints.map((point) => (
              <div className="landing-trust-card" key={point}>
                <p>{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel mt-6 rounded-[36px] px-6 py-8 text-center sm:px-8 sm:py-10 lg:px-12 lg:py-12">
        <p className="eyebrow">Final CTA</p>
        <h2 className="mx-auto mt-3 max-w-3xl text-3xl leading-tight sm:text-4xl">
          Start using a faster batch-editing workflow without adding more repetitive production overhead.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl leading-7 muted">
          Join the public beta to test a cleaner way to process image batches, review outcomes, and iterate on edits with your team.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link className="button button-primary" href="/register">
            Create account
          </Link>
          <Link className="button button-secondary" href="/login">
            Access existing workspace
          </Link>
        </div>
      </section>
    </main>
  );
}
