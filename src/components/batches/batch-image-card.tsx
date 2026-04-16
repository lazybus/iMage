"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { BatchImagePreview } from "@/components/batches/batch-image-preview";
import type { BatchDetailImageCard } from "@/components/batches/batch-detail-client";
import { StatusPill } from "@/components/batches/status-pill";
import { trackEvent } from "@/lib/analytics";

function PlayIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path d="M8 6.5v11l8-5.5-8-5.5Z" fill="currentColor" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" />
      <path className="opacity-90" d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />
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
  onRunStateChange,
}: {
  batchId: string;
  image: BatchDetailImageCard;
  onRunStateChange: (id: string, label: string, isActive: boolean) => void;
}) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [prompt, setPrompt] = useState(image.editPrompt);
  const [savedPrompt, setSavedPrompt] = useState(image.editPrompt);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const hasPromptChanges = prompt.trim() !== savedPrompt.trim();
  const isCompleted = image.status === "completed";

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
    setMessage("Prompt saved.");
    return true;
  }

  async function handleRunImage() {
    const canContinue = await savePrompt();

    if (!canContinue) {
      return;
    }

    setIsRunning(true);
    setMessage(null);
    onRunStateChange(image.id, image.originalFilename, true);

    const response = await fetch(`/api/images/${image.id}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ batchId, upscaleRequested: false }),
    });

    setIsRunning(false);
    onRunStateChange(image.id, image.originalFilename, false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(payload?.error ?? "Unable to start image edit.");
      return;
    }

    trackEvent("image_processing_started", {
      trigger: "image_card",
      image_name_length: image.originalFilename.length,
    });
    router.refresh();
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
          <div className="flex items-center justify-end gap-3">
            <button
              aria-label={isRunning ? "Editing image" : "Edit image"}
              className="surface-strong border-theme inline-flex h-11 w-11 items-center justify-center rounded-full border transition hover:-translate-y-0.5 hover-surface"
              disabled={isSaving || isRunning}
              onClick={handleRunImage}
              type="button"
            >
              {isRunning ? <SpinnerIcon /> : <PlayIcon />}
            </button>
            {isCompleted ? (
              <Link
                aria-label="Download image"
                className="surface-strong border-theme inline-flex h-11 w-11 items-center justify-center rounded-full border transition hover:-translate-y-0.5 hover-surface"
                href={`/api/images/${image.id}/download`}
              >
                <DownloadIcon />
              </Link>
            ) : null}
          </div>

          <label className="grid gap-2 text-sm">
            <span className="font-semibold text-[var(--foreground)]">Prompt</span>
            <textarea className="textarea min-h-[110px]" onChange={(event) => setPrompt(event.target.value)} value={prompt} />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button className="button button-secondary" disabled={!hasPromptChanges || isSaving || isRunning} onClick={savePrompt} type="button">
              {isSaving ? "Saving prompt..." : "Save Prompt"}
            </button>
            <span className="text-sm muted">{message ?? (hasPromptChanges ? "Unsaved prompt changes." : "Prompt is up to date.")}</span>
          </div>

          <BatchImagePreview
            filename={image.originalFilename}
            originalAlt={`Original upload for ${image.originalFilename}`}
            originalEmptyLabel="Original preview unavailable"
            originalSrc={image.originalPreviewUrl}
            resultAlt={`Returned result for ${image.originalFilename}`}
            resultEmptyLabel={isCompleted ? "Returned image preview unavailable" : "Returned image not available yet"}
            resultSrc={image.resultPreviewUrl}
          />
        </div>
      ) : null}
    </article>
  );
}