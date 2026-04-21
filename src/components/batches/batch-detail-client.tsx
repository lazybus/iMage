import { BatchImageCard } from "@/components/batches/batch-image-card";
import { BatchRunControls } from "@/components/batches/batch-run-controls";
import type { BatchStatus } from "@/lib/db/types";

export interface BatchDetailImageCard {
  editPrompt: string;
  failureMessage: string | null;
  id: string;
  originalFilename: string;
  originalPreviewUrl: string | null;
  resultPreviewUrl: string | null;
  resultStatus: BatchStatus | null;
  status: BatchStatus;
}

export function BatchDetailClient({
  batchId,
  batchStatus,
  imageCards,
}: {
  batchId: string;
  batchStatus: BatchStatus;
  imageCards: BatchDetailImageCard[];
}) {
  return (
    <>
      <BatchRunControls batchId={batchId} batchStatus={batchStatus} imageCount={imageCards.length} />
      <section className="grid gap-4">
        {imageCards.map((imageCard) => <BatchImageCard batchId={batchId} image={imageCard} key={imageCard.id} />)}
      </section>
    </>
  );
}