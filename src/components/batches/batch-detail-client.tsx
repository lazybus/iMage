"use client";

import { useState } from "react";

import { BatchImageCard } from "@/components/batches/batch-image-card";
import { BatchRunControls } from "@/components/batches/batch-run-controls";
import type { BatchStatus } from "@/lib/db/types";

export interface BatchDetailImageCard {
  editPrompt: string;
  id: string;
  originalFilename: string;
  originalPreviewUrl: string | null;
  resultPreviewUrl: string | null;
  resultStatus: BatchStatus | null;
  status: BatchStatus;
}

interface ActiveImageRun {
  id: string;
  label: string;
}

function ActivityToast({ activeRuns }: { activeRuns: ActiveImageRun[] }) {
  if (activeRuns.length === 0) {
    return null;
  }

  return (
    <div className="panel fixed bottom-5 right-5 z-50 w-[min(360px,calc(100vw-2rem))] rounded-[24px] p-4">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="mt-1 inline-flex h-3 w-3 animate-pulse rounded-full bg-[var(--accent)]" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {activeRuns.length === 1 ? "Editing 1 image" : `Editing ${activeRuns.length} images`}
          </p>
          <p className="mt-1 text-sm muted">
            {activeRuns.map((run) => run.label).join(", ")}
          </p>
        </div>
      </div>
    </div>
  );
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
  const [activeRuns, setActiveRuns] = useState<ActiveImageRun[]>([]);

  function handleRunStateChange(id: string, label: string, isActive: boolean) {
    setActiveRuns((current) => {
      const remainingRuns = current.filter((run) => run.id !== id);

      if (!isActive) {
        return remainingRuns;
      }

      return [...remainingRuns, { id, label }];
    });
  }

  return (
    <>
      <BatchRunControls batchId={batchId} batchStatus={batchStatus} />
      <section className="grid gap-4">
        {imageCards.map((imageCard) => (
          <BatchImageCard batchId={batchId} image={imageCard} key={imageCard.id} onRunStateChange={handleRunStateChange} />
        ))}
      </section>
      <ActivityToast activeRuns={activeRuns} />
    </>
  );
}