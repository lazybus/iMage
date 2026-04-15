import Link from "next/link";

import { StatusPill } from "@/components/batches/status-pill";
import { requireUser } from "@/lib/auth/guards";
import { listUserBatches } from "@/lib/db/queries";

export default async function BatchesPage() {
  const { supabase, user } = await requireUser();
  const batches = await listUserBatches(supabase, user.id);

  return (
    <section className="panel rounded-[32px] p-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 className="section-title mt-3">Your edit batches</h1>
          <p className="mt-3 muted">Revisit old jobs, queue reruns, and download complete outputs.</p>
        </div>
        <Link className="button button-primary" href="/batches/new">
          New batch
        </Link>
      </div>

      {batches.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-black/12 bg-white/55 p-8 text-sm muted">
          No batches yet. Create the first batch to upload original images and prompts.
        </div>
      ) : (
        <div className="grid gap-4">
          {batches.map((batch) => (
            <Link className="rounded-[26px] border border-black/8 bg-white/65 p-5 hover:bg-white" href={`/batches/${batch.id}`} key={batch.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold tracking-[-0.04em]">{batch.title}</h2>
                  <p className="mt-2 text-sm muted">Updated {new Date(batch.updated_at).toLocaleString()}</p>
                </div>
                <StatusPill status={batch.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
