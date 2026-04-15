import Link from "next/link";

import { TopMenu } from "@/components/theme/top-menu";

const features = [
  "Upload multiple source images with a different prompt for each one.",
  "Run a single image or the entire batch without leaving the detail page.",
  "Download edited results individually or as a zip once the batch completes.",
  "Keep old batches available for reruns, retries, and audit history.",
];

export default function LandingPage() {
  return (
    <main className="shell py-8 sm:py-10">
      <TopMenu />
      <section className="panel mt-6 overflow-hidden rounded-[40px] p-8 sm:p-12">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div className="space-y-6">
            <p className="eyebrow">Next.js + Supabase</p>
            <h1 className="section-title">Batch image editing with storage, auth, and download control.</h1>
            <p className="max-w-2xl text-lg muted">
              iMage is structured for queue-based editing jobs, private asset storage, and a clean handoff to a Nano Banana
              provider adapter.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link className="button button-primary" href="/batches">
                Dashboard
              </Link>
              <Link className="button button-secondary" href="/register">
                Register
              </Link>
              <Link className="button button-secondary" href="/login">
                Sign in
              </Link>
            </div>
          </div>
          <div className="hero-tint border-theme rounded-[28px] border p-6">
            <p className="eyebrow">Workflow</p>
            <div className="mt-4 grid gap-4">
              {features.map((feature) => (
                <div className="surface-strong rounded-[22px] p-4" key={feature}>
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
