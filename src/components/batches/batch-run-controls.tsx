"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function BatchRunControls({
  batchId,
  imageIds,
}: {
  batchId: string;
  imageIds: string[];
}) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState<string | null>(null);
  const [upscale, setUpscale] = useState(false);

  async function runBatch() {
    setIsBusy("batch");
    await fetch(`/api/batches/${batchId}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ upscaleRequested: upscale }),
    });
    setIsBusy(null);
    router.refresh();
  }

  async function runImage(imageId: string) {
    setIsBusy(imageId);
    await fetch(`/api/images/${imageId}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ batchId, upscaleRequested: upscale }),
    });
    setIsBusy(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-3 text-sm muted">
        <input checked={upscale} onChange={(event) => setUpscale(event.target.checked)} type="checkbox" />
        Request upscale when the provider supports it
      </label>
      <div className="flex flex-wrap gap-3">
        <button className="button button-primary" disabled={isBusy !== null} onClick={runBatch} type="button">
          {isBusy === "batch" ? "Queueing batch..." : "Run full batch"}
        </button>
        {imageIds.map((imageId, index) => (
          <button
            className="button button-secondary"
            disabled={isBusy !== null}
            key={imageId}
            onClick={() => runImage(imageId)}
            type="button"
          >
            {isBusy === imageId ? `Queueing image ${index + 1}...` : `Run image ${index + 1}`}
          </button>
        ))}
      </div>
    </div>
  );
}
