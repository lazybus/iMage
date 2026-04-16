"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

const SUPPORTED_UPLOAD_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const UPLOAD_ACCEPT = "image/jpeg,image/png,image/webp";
const WEBP_QUALITY = 0.82;

interface DraftImageRow {
  id: string;
  file: File | null;
  inputKey: number;
  isConverting: boolean;
  error: string | null;
  pendingSelectionId: string | null;
  prompt: string;
  previewUrl: string | null;
  sourceFilename: string | null;
}

function toWebpFilename(filename: string) {
  const dotIndex = filename.lastIndexOf(".");
  const basename = dotIndex > 0 ? filename.slice(0, dotIndex) : filename;

  return `${basename}.webp`;
}

function loadImageFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to read the selected image."));
    };

    image.src = objectUrl;
  });
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Unable to build an image preview."));
        return;
      }

      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(new Error("Unable to build an image preview."));
    };

    reader.readAsDataURL(file);
  });
}

function isBlobUrl(value: string) {
  return value.startsWith("blob:");
}

async function convertImageToWebp(file: File) {
  const image = await loadImageFile(file);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not available in this browser.");
  }

  context.drawImage(image, 0, 0);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error("Unable to optimize the selected image."));
          return;
        }

        resolve(result);
      },
      "image/webp",
      WEBP_QUALITY,
    );
  });

  return new File([blob], toWebpFilename(file.name), {
    type: "image/webp",
    lastModified: Date.now(),
  });
}

function UploadIcon() {
  return (
    <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24">
      <path d="M12 15V6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="m8.5 9.5 3.5-3.5 3.5 3.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M5 17.5a2.5 2.5 0 0 0 2.5 2.5h9A2.5 2.5 0 0 0 19 17.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24">
      <path d="M4.5 7h15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M9.5 10.5v6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M14.5 10.5v6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M7.5 7V5.75A1.75 1.75 0 0 1 9.25 4h5.5a1.75 1.75 0 0 1 1.75 1.75V7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M7.5 7l.6 10.1A2 2 0 0 0 10.09 19h3.82a2 2 0 0 0 1.99-1.9L16.5 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function createRowId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createRow(id = createRowId()): DraftImageRow {
  return {
    id,
    file: null,
    inputKey: 0,
    isConverting: false,
    error: null,
    pendingSelectionId: null,
    prompt: "",
    previewUrl: null,
    sourceFilename: null,
  };
}

export function NewBatchForm({ configured }: { configured: boolean }) {
  const formId = useId();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [rows, setRows] = useState<DraftImageRow[]>([createRow("initial-row")]);
  const [isBusy, setIsBusy] = useState(false);
  const [dragDepth, setDragDepth] = useState(0);
  const [message, setMessage] = useState("");
  const rowsRef = useRef(rows);

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    return () => {
      rowsRef.current.forEach((row) => {
        if (row.previewUrl && isBlobUrl(row.previewUrl)) {
          URL.revokeObjectURL(row.previewUrl);
        }
      });
    };
  }, []);

  function updateRow(id: string, updater: (row: DraftImageRow) => DraftImageRow) {
    setRows((current) => current.map((row) => (row.id === id ? updater(row) : row)));
  }

  function isEmptyRow(row: DraftImageRow) {
    return !row.file && !row.isConverting && !row.error && !row.prompt.trim() && !row.previewUrl && !row.sourceFilename;
  }

  async function addFilesAsRows(files: File[]) {
    if (files.length === 0) {
      return;
    }

    const currentRows = rowsRef.current;
    const emptyRowIndex = currentRows.findIndex((row) => isEmptyRow(row));
    const createdRows = files.map(() => createRow());

    const nextRows = [...currentRows];
    const targetRowIds: string[] = [];

    files.forEach((_, index) => {
      if (index === 0 && emptyRowIndex >= 0) {
        const replacementRow = createdRows[index];
        nextRows[emptyRowIndex] = replacementRow;
        targetRowIds.push(replacementRow.id);
        return;
      }

      const newRow = createdRows[index];
      nextRows.push(newRow);
      targetRowIds.push(newRow.id);
    });

    rowsRef.current = nextRows;
    setRows(nextRows);

    await Promise.all(targetRowIds.map((id, index) => handleFileChange(id, files[index] ?? null)));
  }

  function eventHasFiles(event: React.DragEvent<HTMLElement>) {
    return Array.from(event.dataTransfer.types).includes("Files");
  }

  function handlePanelDragEnter(event: React.DragEvent<HTMLFormElement>) {
    if (!eventHasFiles(event)) {
      return;
    }

    event.preventDefault();
    setDragDepth((current) => current + 1);
  }

  function handlePanelDragOver(event: React.DragEvent<HTMLFormElement>) {
    if (!eventHasFiles(event)) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function handlePanelDragLeave(event: React.DragEvent<HTMLFormElement>) {
    if (!eventHasFiles(event)) {
      return;
    }

    event.preventDefault();
    setDragDepth((current) => Math.max(current - 1, 0));
  }

  async function handlePanelDrop(event: React.DragEvent<HTMLFormElement>) {
    if (!eventHasFiles(event)) {
      return;
    }

    event.preventDefault();
    setDragDepth(0);
    setMessage("");

    const files = Array.from(event.dataTransfer.files);
    await addFilesAsRows(files);
  }

  async function handleFileChange(id: string, file: File | null) {
    const previousRow = rowsRef.current.find((row) => row.id === id);

    if (previousRow?.previewUrl && isBlobUrl(previousRow.previewUrl)) {
      URL.revokeObjectURL(previousRow.previewUrl);
    }

    setRows((current) =>
      current.map((row) => {
        if (row.id !== id) {
          return row;
        }

        if (row.previewUrl && isBlobUrl(row.previewUrl)) {
          URL.revokeObjectURL(row.previewUrl);
        }

        if (!file) {
          return {
            ...row,
            file: null,
            isConverting: false,
            error: null,
            inputKey: row.inputKey + 1,
            pendingSelectionId: null,
            previewUrl: null,
            sourceFilename: null,
          };
        }

        return {
          ...row,
          file: null,
          isConverting: true,
          error: null,
          pendingSelectionId: null,
          previewUrl: null,
          sourceFilename: file.name,
        };
      }),
    );

    if (!file) {
      return;
    }

    if (!SUPPORTED_UPLOAD_TYPES.has(file.type)) {
      setRows((current) =>
        current.map((row) => {
          if (row.id !== id) {
            return row;
          }

          return {
            ...row,
            error: "Choose a PNG, JPG, or WebP image.",
            inputKey: row.inputKey + 1,
            isConverting: false,
            sourceFilename: null,
          };
        }),
      );
      setMessage("Unsupported file type. Choose a PNG, JPG, or WebP image.");
      return;
    }

    const pendingSelectionId = createRowId();
    setRows((current) =>
      current.map((row) => {
        if (row.id !== id) {
          return row;
        }

        return {
          ...row,
          pendingSelectionId,
        };
      }),
    );

    try {
      const convertedFile = await convertImageToWebp(file);
      const previewUrl = await readFileAsDataUrl(convertedFile);

      setRows((current) =>
        current.map((row) => {
          if (row.id !== id) {
            return row;
          }

          if (row.pendingSelectionId !== pendingSelectionId) {
            return row;
          }

          return {
            ...row,
            file: convertedFile,
            isConverting: false,
            error: null,
            pendingSelectionId: null,
            previewUrl,
            sourceFilename: file.name,
          };
        }),
      );
    } catch {
      setRows((current) =>
        current.map((row) => {
          if (row.id !== id || row.pendingSelectionId !== pendingSelectionId) {
            return row;
          }

          return {
            ...row,
            file: null,
            error: "Unable to optimize that image. Try a different file.",
            inputKey: row.inputKey + 1,
            isConverting: false,
            pendingSelectionId: null,
            previewUrl: null,
          };
        }),
      );
      setMessage("One of the selected images could not be optimized to WebP.");
    }
  }

  function removeRow(id: string) {
    setRows((current) => {
      const nextRows = current.filter((row) => row.id !== id);
      const removedRow = current.find((row) => row.id === id);

      if (removedRow?.previewUrl && isBlobUrl(removedRow.previewUrl)) {
        URL.revokeObjectURL(removedRow.previewUrl);
      }

      return nextRows.length > 0 ? nextRows : [createRow()];
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!configured) {
      setMessage("Set Supabase environment variables before creating a batch.");
      return;
    }

    if (rows.some((row) => row.isConverting)) {
      setMessage("Wait for image optimization to finish before creating the batch.");
      return;
    }

    if (rows.some((row) => row.error)) {
      setMessage("Fix the image upload errors before creating the batch.");
      return;
    }

    const populatedRows = rows.filter((row) => row.file && row.prompt.trim());
    if (populatedRows.length === 0) {
      setMessage("Add at least one image and prompt.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim() || `Batch ${new Date().toLocaleDateString()}`);
    populatedRows.forEach((row) => {
      formData.append("files", row.file as File);
      formData.append("prompts", row.prompt.trim());
    });

    setIsBusy(true);
    const response = await fetch("/api/batches", {
      method: "POST",
      body: formData,
    });
    setIsBusy(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(payload?.error ?? "Unable to create batch.");
      return;
    }

    const payload = (await response.json()) as { batchId: string };
    router.push(`/batches/${payload.batchId}`);
    router.refresh();
  }

  return (
    <form
      className={`panel relative space-y-6 rounded-[28px] p-8 transition ${dragDepth > 0 ? "border border-[var(--accent)] bg-[color-mix(in_srgb,var(--surface)_88%,var(--accent)_12%)]" : ""}`}
      onDragEnter={handlePanelDragEnter}
      onDragLeave={handlePanelDragLeave}
      onDragOver={handlePanelDragOver}
      onDrop={handlePanelDrop}
      onSubmit={handleSubmit}
    >
      {dragDepth > 0 ? (
        <div className="pointer-events-none absolute inset-4 z-10 flex items-center justify-center rounded-[24px] border-2 border-dashed border-[var(--accent)] bg-[color-mix(in_srgb,var(--background)_32%,transparent)]">
          <div className="space-y-2 px-6 text-center">
            <p className="text-lg font-semibold text-[var(--foreground)]">Drop images here</p>
            <p className="text-sm text-[var(--muted)]">Release to create a card for each PNG, JPG, or WebP file.</p>
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="eyebrow">New Batch</p>
        <h1 className="text-4xl font-semibold tracking-[-0.04em]">Group multiple edits into a single run</h1>
        <p className="muted">Every image keeps its own edit prompt, and you can still run one image at a time later.</p>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-medium">Batch title</span>
        <input className="field" onChange={(event) => setTitle(event.target.value)} placeholder="Campaign portrait refresh" value={title} />
      </label>

      <div className="grid gap-4">
        {rows.map((row, index) => (
          <div className="surface-soft border-theme rounded-[24px] border p-4" key={row.id}>
            <div className="mb-3 flex items-center justify-between">
              <strong>Image {index + 1}</strong>
              <button
                aria-label={`Remove image ${index + 1}`}
                className="surface-strong border-theme inline-flex h-10 w-10 items-center justify-center rounded-full border text-[var(--foreground)] transition hover:-translate-y-0.5 hover-surface"
                onClick={() => removeRow(row.id)}
                type="button"
              >
                <TrashIcon />
              </button>
            </div>
            <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="grid gap-2 text-sm">
                <span>Image file</span>
                <input
                  accept={UPLOAD_ACCEPT}
                  className="sr-only"
                  id={`${formId}-${row.id}`}
                  key={row.inputKey}
                  onChange={(event) => handleFileChange(row.id, event.target.files?.[0] ?? null)}
                  type="file"
                />
                <label
                  className="surface-strong border-theme hover-surface relative flex min-h-[220px] cursor-pointer overflow-hidden rounded-[20px] border border-dashed transition"
                  htmlFor={`${formId}-${row.id}`}
                >
                  {row.previewUrl ? (
                    <>
                      <Image
                        alt={row.file?.name ?? `Selected upload ${index + 1}`}
                        className="object-cover"
                        fill
                        sizes="(max-width: 1024px) 100vw, 33vw"
                        src={row.previewUrl}
                        unoptimized
                      />
                      <div className="overlay-ink absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-4 py-3 text-sm text-white">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{row.sourceFilename ?? row.file?.name}</p>
                          <p className="text-xs uppercase tracking-[0.18em] text-white/72">Optimized to {row.file?.name}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-6 py-8 text-center">
                      <div className="surface-soft flex h-14 w-14 items-center justify-center rounded-full border border-theme text-[var(--accent)]">
                        <UploadIcon />
                      </div>
                      <div className="space-y-2">
                        <p className="text-base font-semibold text-[var(--foreground)]">Choose an image to edit</p>
                        <p className="muted text-sm">PNG, JPG, and WebP images are optimized to WebP before upload.</p>
                      </div>
                    </div>
                  )}
                </label>
                <p className="min-h-5 text-xs text-[var(--muted)]">{row.isConverting ? "Optimizing image for upload..." : row.error ?? ""}</p>
              </div>
              <label className="grid gap-2 text-sm">
                <span>Edit prompt</span>
                <textarea
                  className="textarea"
                  onChange={(event) => updateRow(row.id, (current) => ({ ...current, prompt: event.target.value }))}
                  placeholder="Example: Remove the background, keep the lighting natural, and upscale for a hero banner."
                  value={row.prompt}
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button className="button button-secondary" onClick={() => setRows((current) => [...current, createRow()])} type="button">
          Add another image
        </button>
        <button className="button button-primary" disabled={isBusy || rows.some((row) => row.isConverting)} type="submit">
          {isBusy ? "Creating batch..." : rows.some((row) => row.isConverting) ? "Optimizing images..." : "Create batch"}
        </button>
      </div>

      <p className="text-sm muted">{message || "Uploads are optimized to private WebP files before they are stored in Supabase Storage."}</p>
    </form>
  );
}
