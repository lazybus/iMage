import Link from "next/link";

import { BatchListItem } from "@/components/batches/batch-list-item";
import { requirePageUser } from "@/lib/auth/guards";
import { listUserBatches } from "@/lib/db/queries";

export default async function BatchesPage() {
  const { supabase } = await requirePageUser();
  const batches = await listUserBatches(supabase);

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
        <div className="surface-soft rounded-[24px] border border-dashed border-theme p-8 text-sm muted">
          No batches yet. Create the first batch to upload original images and prompts.
        </div>
      ) : (
        <div className="grid gap-4">
          {batches.map((batch) => (
            <BatchListItem batch={batch} key={batch.id} />
          ))}
        </div>
      )}
    </section>
  );
}
