"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { trackEvent } from "@/lib/analytics";
import type { BatchStatus } from "@/lib/db/types";

function PlayIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M8.25 6.75v10.5l8.25-5.25-8.25-5.25Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

export function BatchRunControls({
  batchId,
  batchStatus,
  imageCount,
}: {
  batchId: string;
  batchStatus: BatchStatus;
  imageCount: number;
}) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const isQueued = batchStatus === "queued";
  const isProcessing = batchStatus === "processing";
  const isRunUnavailable = isQueued || isProcessing;

  async function runBatch() {
    setIsBusy(true);
    setMessage(null);
    const response = await fetch(`/api/batches/${batchId}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ upscaleRequested: false }),
    });
    setIsBusy(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(payload?.error ?? "Unable to queue the batch.");
      return;
    }

    trackEvent("batch_processing_started", {
      image_count: imageCount,
      trigger: "batch_run_controls",
    });

    setMessage("Batch queued. Track progress from Processing.");

    router.refresh();
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap justify-end gap-3">
        <button className="button button-primary" disabled={isBusy || isRunUnavailable} onClick={runBatch} type="button">
          <PlayIcon />
          <span>{isBusy ? "Queueing images..." : isRunUnavailable ? "Batch in queue..." : "Edit All Images"}</span>
        </button>
        {batchStatus === "completed" ? (
          <Link className="button button-secondary" href={`/api/batches/${batchId}/download`}>
            Download All
          </Link>
        ) : null}
      </div>
      <p className="text-sm muted">{message ?? (isRunUnavailable ? "This batch is already queued in Processing." : "Queue the whole batch and keep working elsewhere in the dashboard.")}</p>
    </div>
  );
}
