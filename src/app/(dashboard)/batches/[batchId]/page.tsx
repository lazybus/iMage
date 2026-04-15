import Link from "next/link";
import { notFound } from "next/navigation";

import { BatchImagePreview } from "@/components/batches/batch-image-preview";
import { BatchRunControls } from "@/components/batches/batch-run-controls";
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
        <div className="mt-8 grid gap-4 rounded-[26px] border border-black/8 bg-white/55 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <strong>Queue controls</strong>
            <Link className="button button-secondary" href={`/api/batches/${batch.id}/download`}>
              Download completed zip
            </Link>
          </div>
          <BatchRunControls batchId={batch.id} imageIds={batch.images.map((image) => image.id)} />
        </div>
      </section>

      <section className="grid gap-4">
        {imageCards.map(({ image, latestResult, originalPreviewUrl, resultPreviewUrl }) => {
          return (
            <article className="panel rounded-[28px] p-6" key={image.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-semibold tracking-[-0.04em]">{image.original_filename}</h2>
                    <StatusPill status={image.status} />
                  </div>
                  <p className="whitespace-pre-wrap muted">
                    <span className="font-semibold text-[var(--ink)]">Prompt:</span> {image.edit_prompt}
                  </p>
                </div>
                {latestResult?.status === "completed" ? (
                  <Link className="button button-secondary" href={`/api/images/${image.id}/download`}>
                    Download image
                  </Link>
                ) : null}
              </div>
              <div className="mt-6">
                <BatchImagePreview
                  filename={image.original_filename}
                  originalAlt={`Original upload for ${image.original_filename}`}
                  originalEmptyLabel="Original preview unavailable"
                  originalSrc={originalPreviewUrl}
                  resultAlt={`Returned result for ${image.original_filename}`}
                  resultEmptyLabel={latestResult?.status === "completed" ? "Returned image preview unavailable" : "Returned image not available yet"}
                  resultSrc={resultPreviewUrl}
                />
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
