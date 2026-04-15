"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { BatchStatus } from "@/lib/db/types";

export function BatchRunControls({
  batchId,
  batchStatus,
}: {
  batchId: string;
  batchStatus: BatchStatus;
}) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);

  async function runBatch() {
    setIsBusy(true);
    await fetch(`/api/batches/${batchId}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ upscaleRequested: false }),
    });
    setIsBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button className="button button-primary" disabled={isBusy} onClick={runBatch} type="button">
        {isBusy ? "Editing all images..." : "Edit All Images"}
      </button>
      {batchStatus === "completed" ? (
        <Link className="button button-secondary" href={`/api/batches/${batchId}/download`}>
          Download All
        </Link>
      ) : null}
    </div>
  );
}
