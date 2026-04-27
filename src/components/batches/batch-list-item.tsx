"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { StatusPill } from "@/components/batches/status-pill";
import type { BatchRecord } from "@/lib/db/types";

function DuplicateIcon() {
  return (
    <svg aria-hidden="true" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24">
      <rect height="9" rx="2" stroke="currentColor" strokeWidth="1.7" width="9" x="9.25" y="9.25" />
      <rect height="9" rx="2" stroke="currentColor" strokeWidth="1.7" width="9" x="5.75" y="5.75" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M5.25 7.5h13.5m-9.75 0V6a.75.75 0 0 1 .75-.75h4.5A.75.75 0 0 1 15 6v1.5m-7.5 0v9.75A1.5 1.5 0 0 0 9 18.75h6a1.5 1.5 0 0 0 1.5-1.5V7.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-20" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

type BusyAction = "delete" | "duplicate" | null;
type DialogMode = BusyAction;

const actionButtonClassName =
  "surface-strong border-theme inline-flex h-11 w-11 items-center justify-center rounded-full border text-[var(--foreground)] transition hover:-translate-y-0.5 hover-surface disabled:cursor-not-allowed disabled:opacity-60";
const destructiveButtonClassName =
  "button border border-[color:color-mix(in_srgb,var(--danger-soft)_72%,var(--line))] bg-[var(--danger-soft)] text-[var(--foreground)]";

function BatchActionModal({
  batchTitle,
  busyAction,
  dialogError,
  dialogMode,
  duplicateTitle,
  onClose,
  onConfirmDelete,
  onConfirmDuplicate,
  onDuplicateTitleChange,
}: {
  batchTitle: string;
  busyAction: BusyAction;
  dialogError: string | null;
  dialogMode: DialogMode;
  duplicateTitle: string;
  onClose: () => void;
  onConfirmDelete: () => void;
  onConfirmDuplicate: () => void;
  onDuplicateTitleChange: (value: string) => void;
}) {
  if (dialogMode === null) {
    return null;
  }

  const isDeleteDialog = dialogMode === "delete";
  const isBusy = busyAction === dialogMode;

  return createPortal(
    <div
      aria-modal="true"
      className="fixed inset-0 z-[100] flex min-h-screen w-screen items-center justify-center bg-[rgba(8,11,9,0.82)] p-4 backdrop-blur-sm sm:p-8"
      onClick={onClose}
      role="dialog"
    >
      <div className="panel mx-auto w-full max-w-xl rounded-[30px] p-5 sm:p-6" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">{isDeleteDialog ? "Delete batch" : "Duplicate batch"}</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
              {isDeleteDialog ? `Remove ${batchTitle}?` : `Create a copy of ${batchTitle}`}
            </h3>
          </div>
          <button className="button button-secondary" disabled={isBusy} onClick={onClose} type="button">
            Close
          </button>
        </div>

        {isDeleteDialog ? (
          <div className="surface-soft border-theme mt-5 rounded-[24px] border p-4">
            <p className="text-sm text-[var(--foreground)]">This removes the batch, uploaded images, and generated results from your workspace.</p>
            <p className="mt-2 text-sm muted">This action cannot be undone.</p>
          </div>
        ) : (
          <label className="mt-5 grid gap-2">
            <span className="text-sm font-medium">New batch name</span>
            <input
              autoFocus
              className="field"
              onChange={(event) => onDuplicateTitleChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onConfirmDuplicate();
                }
              }}
              placeholder="Spring portrait edits (copy)"
              value={duplicateTitle}
            />
            <p className="text-sm muted">The copy keeps the same source images and prompts, then opens as a new batch.</p>
          </label>
        )}

        {dialogError ? <p className="mt-4 text-sm text-[var(--foreground)]">{dialogError}</p> : null}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button className="button button-secondary" disabled={isBusy} onClick={onClose} type="button">
            Cancel
          </button>
          <button className={isDeleteDialog ? destructiveButtonClassName : "button button-primary"} disabled={isBusy} onClick={isDeleteDialog ? onConfirmDelete : onConfirmDuplicate} type="button">
            {isBusy ? <SpinnerIcon /> : null}
            <span>
              {isBusy ? (isDeleteDialog ? "Deleting..." : "Duplicating...") : isDeleteDialog ? "Delete batch" : "Create copy"}
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function BatchListItem({ batch }: { batch: BatchRecord }) {
  const router = useRouter();
  const [busyAction, setBusyAction] = useState<BusyAction>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [duplicateTitle, setDuplicateTitle] = useState(`${batch.title} (copy)`);

  useEffect(() => {
    if (dialogMode === null) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && busyAction === null) {
        setDialogMode(null);
        setDialogError(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [busyAction, dialogMode]);

  function closeDialog() {
    if (busyAction !== null) {
      return;
    }

    setDialogMode(null);
    setDialogError(null);
  }

  function openDuplicateDialog() {
    setDuplicateTitle(`${batch.title} (copy)`);
    setDialogError(null);
    setDialogMode("duplicate");
  }

  function openDeleteDialog() {
    setDialogError(null);
    setDialogMode("delete");
  }

  async function handleDuplicate() {
    const trimmedTitle = duplicateTitle.trim();
    if (!trimmedTitle) {
      setDialogError("Enter a name to duplicate this batch.");
      return;
    }

    setBusyAction("duplicate");
    setDialogError(null);

    const response = await fetch(`/api/batches/${batch.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: trimmedTitle }),
    });

    setBusyAction(null);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setDialogError(payload?.error ?? "Unable to duplicate batch.");
      return;
    }

    const payload = (await response.json()) as { batchId: string };
    closeDialog();
    router.push(`/batches/${payload.batchId}`);
    router.refresh();
  }

  async function handleDelete() {
    setBusyAction("delete");
    setDialogError(null);

    const response = await fetch(`/api/batches/${batch.id}`, {
      method: "DELETE",
    });

    setBusyAction(null);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setDialogError(payload?.error ?? "Unable to delete batch.");
      return;
    }

    closeDialog();
    router.refresh();
  }

  return (
    <>
      <article className="surface-muted rounded-[26px] border border-theme p-5 transition hover-surface">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <Link className="min-w-0 flex-1" href={`/batches/${batch.id}`}>
            <h2 className="text-2xl font-semibold tracking-[-0.04em]">{batch.title}</h2>
            <p className="mt-2 text-sm muted">Updated {new Date(batch.updated_at).toLocaleString()}</p>
          </Link>

          <div className="flex items-center gap-3">
            <StatusPill status={batch.status} />
            <button
              aria-label={`Duplicate ${batch.title}`}
              className={actionButtonClassName}
              disabled={busyAction !== null}
              onClick={openDuplicateDialog}
              title="Duplicate batch"
              type="button"
            >
              {busyAction === "duplicate" ? <SpinnerIcon /> : <DuplicateIcon />}
            </button>
            <button
              aria-label={`Delete ${batch.title}`}
              className={actionButtonClassName}
              disabled={busyAction !== null}
              onClick={openDeleteDialog}
              title="Delete batch"
              type="button"
            >
              {busyAction === "delete" ? <SpinnerIcon /> : <TrashIcon />}
            </button>
          </div>
        </div>
      </article>

      <BatchActionModal
        batchTitle={batch.title}
        busyAction={busyAction}
        dialogError={dialogError}
        dialogMode={dialogMode}
        duplicateTitle={duplicateTitle}
        onClose={closeDialog}
        onConfirmDelete={handleDelete}
        onConfirmDuplicate={handleDuplicate}
        onDuplicateTitleChange={setDuplicateTitle}
      />
    </>
  );
}