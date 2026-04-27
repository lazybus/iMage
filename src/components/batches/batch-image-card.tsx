"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { BatchImagePreview } from "@/components/batches/batch-image-preview";
import type { BatchDetailImageCard } from "@/components/batches/batch-detail-client";
import { StatusPill } from "@/components/batches/status-pill";
import { trackEvent } from "@/lib/analytics";

function PlayIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M8.25 6.75v10.5l8.25-5.25-8.25-5.25Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function SpinnerIcon({ className = "h-5 w-5 animate-spin" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" />
      <path className="opacity-90" d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="m5 12 4.2 4.2L19 6.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M7 7l10 10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
      <path d="M17 7 7 17" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path d="M12 4v10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="m8 10 4 4 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M5 19h14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path d="m6 15 6-6 6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

export function BatchImageCard({
  batchId,
  image,
}: {
  batchId: string;
  image: BatchDetailImageCard;
}) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [prompt, setPrompt] = useState(image.editPrompt);
  const [savedPrompt, setSavedPrompt] = useState(image.editPrompt);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isQueuePending, setIsQueuePending] = useState(image.status === "queued" || image.status === "processing");
  const [message, setMessage] = useState<string | null>(null);

  const hasPromptChanges = prompt.trim() !== savedPrompt.trim();
  const isCompleted = image.status === "completed";
  const isQueued = image.status === "queued";
  const isProcessing = image.status === "processing";
  const isRunUnavailable = isQueued || isProcessing;

  useEffect(() => {
    if (image.status === "queued" || image.status === "processing") {
      setIsQueuePending(true);
      return;
    }

    setIsQueuePending(false);
  }, [image.status]);

  async function queueImageRun() {
    const response = await fetch(`/api/images/${image.id}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ batchId, upscaleRequested: false }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? "Unable to start image edit.");
    }
  }

  async function savePrompt() {
    const nextPrompt = prompt.trim();

    if (!nextPrompt) {
      setMessage("Prompt cannot be empty.");
      return false;
    }

    if (!hasPromptChanges) {
      return true;
    }

    setIsSaving(true);
    setMessage(null);

    const response = await fetch(`/api/images/${image.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ editPrompt: nextPrompt }),
    });

    setIsSaving(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(payload?.error ?? "Unable to save prompt.");
      return false;
    }

    setPrompt(nextPrompt);
    setSavedPrompt(nextPrompt);
    setMessage(null);
    return true;
  }

  function handleCancelPromptEdit() {
    setPrompt(savedPrompt);
    setMessage(null);
  }

  const runButtonLabel = isProcessing ? "Processing" : isQueued || isQueuePending || isRunning ? "Queued" : "Edit";

  async function handleRunImage() {
    const canContinue = await savePrompt();

    if (!canContinue) {
      return;
    }

    setIsRunning(true);
    setIsQueuePending(true);
    setMessage(null);

    try {
      await queueImageRun();
    } catch (error) {
      setIsRunning(false);
      setIsQueuePending(false);
      setMessage(error instanceof Error ? error.message : "Unable to start image edit.");
      return;
    }

    setIsRunning(false);

    trackEvent("image_processing_started", {
      trigger: "image_card",
      image_name_length: image.originalFilename.length,
    });
    setMessage("Image queued. Track progress from Processing.");
    router.refresh();
  }

  async function handleRetryImage() {
    const canContinue = await savePrompt();

    if (!canContinue) {
      return;
    }

    setIsRetrying(true);
    setIsQueuePending(true);
    setMessage(null);

    try {
      await queueImageRun();
      setMessage("Retry queued. Track progress from Processing.");
      router.refresh();
    } catch (error) {
      setIsQueuePending(false);
      setMessage(error instanceof Error ? error.message : "Unable to retry image edit.");
    } finally {
      setIsRetrying(false);
    }
  }

  return (
    <article className="panel rounded-[28px] p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="min-w-0 truncate text-2xl font-semibold tracking-[-0.04em]">{image.originalFilename}</h2>
            <StatusPill status={image.status} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? `Expand ${image.originalFilename}` : `Collapse ${image.originalFilename}`}
            className="surface-strong border-theme inline-flex h-11 w-11 items-center justify-center rounded-full border transition hover:-translate-y-0.5 hover-surface"
            onClick={() => setIsCollapsed((current) => !current)}
            type="button"
          >
            {isCollapsed ? <ChevronDownIcon /> : <ChevronUpIcon />}
          </button>
        </div>
      </div>

      {!isCollapsed ? (
        <div className="mt-6 space-y-6">
          <div className="grid gap-2 text-sm">
            <span className="font-semibold text-[var(--foreground)]">Original Prompt</span>
            <div className="relative">
              {hasPromptChanges ? (
                <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
                  <button
                    aria-label="Save prompt changes"
                    className="surface-strong border-theme inline-flex h-8 w-8 items-center justify-center rounded-full border text-[var(--foreground)] transition hover:-translate-y-0.5 hover-surface"
                    disabled={isSaving || isRunning || isRetrying || isQueuePending || isRunUnavailable}
                    onClick={savePrompt}
                    type="button"
                  >
                    {isSaving ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : <CheckIcon />}
                  </button>
                  <button
                    aria-label="Cancel prompt changes"
                    className="surface-strong border-theme inline-flex h-8 w-8 items-center justify-center rounded-full border text-[var(--foreground)] transition hover:-translate-y-0.5 hover-surface"
                    disabled={isSaving || isRunning || isRetrying || isQueuePending || isRunUnavailable}
                    onClick={handleCancelPromptEdit}
                    type="button"
                  >
                    <XIcon />
                  </button>
                </div>
              ) : null}
              <textarea
                className={`textarea min-h-[110px] ${hasPromptChanges ? "pr-24 pt-14" : ""}`}
                onChange={(event) => setPrompt(event.target.value)}
                value={prompt}
              />
            </div>
          </div>

          {image.failureMessage || message || isQueuePending || isRunUnavailable ? (
            <div className="flex flex-wrap items-center gap-3">
              {image.failureMessage ? (
                <button className="button button-secondary" disabled={isSaving || isRunning || isRetrying || isQueuePending || isRunUnavailable} onClick={handleRetryImage} type="button">
                  {isRetrying ? "Retrying image..." : "Retry Image"}
                </button>
              ) : null}
              {message || isQueuePending || isRunUnavailable ? (
                <span className="text-sm muted">{message ?? "Currently queued in the processing menu."}</span>
              ) : null}
            </div>
          ) : null}

          <BatchImagePreview
            action={
              <div className="flex items-center gap-2">
                <button
                  aria-label={isRunning || isQueuePending || isProcessing || isQueued ? "Image queued or processing" : "Edit image"}
                  className="surface-strong border-theme inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition hover:-translate-y-0.5 hover-surface"
                  disabled={isSaving || isRunning || isRetrying || isQueuePending || isRunUnavailable}
                  onClick={handleRunImage}
                  type="button"
                >
                  {isRunning || isQueuePending || isProcessing || isQueued ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : <PlayIcon />}
                  <span>{runButtonLabel}</span>
                </button>
                {isCompleted ? (
                  <Link
                    aria-label="Download image"
                    className="surface-strong border-theme inline-flex h-9 w-9 items-center justify-center rounded-[14px] border transition hover:-translate-y-0.5 hover-surface"
                    href={`/api/images/${image.id}/download`}
                  >
                    <DownloadIcon />
                  </Link>
                ) : null}
              </div>
            }
            filename={image.originalFilename}
            originalAlt={`Original upload for ${image.originalFilename}`}
            originalEmptyLabel="Original preview unavailable"
            originalSrc={image.originalPreviewUrl}
            resultAlt={`Returned result for ${image.originalFilename}`}
            resultEmptyLabel={isCompleted ? "Returned image preview unavailable" : "Returned image not available yet"}
            resultSrc={image.resultPreviewUrl}
          />

          {image.failureMessage ? (
            <div className="surface-soft rounded-[22px] border border-[var(--line)] p-4">
              <p className="text-sm font-semibold text-[var(--foreground)]">Latest failure reason</p>
              <p className="mt-2 text-sm muted">{image.failureMessage}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}