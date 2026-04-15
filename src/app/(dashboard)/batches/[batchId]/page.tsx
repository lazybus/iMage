import { notFound } from "next/navigation";

import { BatchDetailClient } from "@/components/batches/batch-detail-client";
import { StatusPill } from "@/components/batches/status-pill";
import { requireUser } from "@/lib/auth/guards";
import { getBatchDetail } from "@/lib/db/queries";
import { getStorageBucketName } from "@/lib/supabase/config";

async function createPreviewUrl(
  storage: Awaited<ReturnType<typeof requireUser>>["supabase"]["storage"],
  path: string | null,
) {
  if (!path) {
    return null;
  }

  const { data, error } = await storage.from(getStorageBucketName()).createSignedUrl(path, 60 * 60);

  if (error) {
    return null;
  }

  return data.signedUrl;
}

export default async function BatchDetailPage({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const { supabase, user } = await requireUser();
  const batch = await getBatchDetail(supabase, user.id, batchId);

  if (!batch) {
    notFound();
  }

  const imageCards = await Promise.all(
    batch.images.map(async (image) => {
      const latestResult = image.results[0] ?? null;

      return {
        image,
        latestResult,
        originalPreviewUrl: await createPreviewUrl(supabase.storage, image.input_storage_path),
        resultPreviewUrl: await createPreviewUrl(supabase.storage, latestResult?.output_storage_path ?? null),
      };
    }),
  );

  return (
    <div className="grid gap-6">
      <section className="panel rounded-[32px] p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Batch Detail</p>
            <h1 className="section-title mt-3">{batch.title}</h1>
            <p className="mt-3 muted">Created {new Date(batch.created_at).toLocaleString()}</p>
          </div>
          <StatusPill status={batch.status} />
        </div>
        <div className="surface-soft border-theme mt-8 grid gap-4 rounded-[26px] border p-5">
          <BatchDetailClient
            batchId={batch.id}
            batchStatus={batch.status}
            imageCards={imageCards.map(({ image, latestResult, originalPreviewUrl, resultPreviewUrl }) => ({
              editPrompt: image.edit_prompt,
              id: image.id,
              originalFilename: image.original_filename,
              originalPreviewUrl,
              resultPreviewUrl,
              resultStatus: latestResult?.status ?? null,
              status: image.status,
            }))}
          />
        </div>
      </section>
    </div>
  );
}
