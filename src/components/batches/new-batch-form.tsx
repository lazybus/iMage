"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface DraftImageRow {
  id: string;
  file: File | null;
  prompt: string;
}

function createRow(): DraftImageRow {
  return {
    id: crypto.randomUUID(),
    file: null,
    prompt: "",
  };
}

export function NewBatchForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [rows, setRows] = useState<DraftImageRow[]>([createRow()]);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState("");

  function updateRow(id: string, updater: (row: DraftImageRow) => DraftImageRow) {
    setRows((current) => current.map((row) => (row.id === id ? updater(row) : row)));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!configured) {
      setMessage("Set Supabase environment variables before creating a batch.");
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
    <form className="panel space-y-6 rounded-[28px] p-8" onSubmit={handleSubmit}>
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
          <div className="rounded-[24px] border border-black/10 bg-white/60 p-4" key={row.id}>
            <div className="mb-3 flex items-center justify-between">
              <strong>Image {index + 1}</strong>
              {rows.length > 1 ? (
                <button
                  className="button button-secondary"
                  onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}
                  type="button"
                >
                  Remove
                </button>
              ) : null}
            </div>
            <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
              <label className="grid gap-2 text-sm">
                <span>Image file</span>
                <input
                  accept="image/*"
                  className="field"
                  onChange={(event) => updateRow(row.id, (current) => ({ ...current, file: event.target.files?.[0] ?? null }))}
                  type="file"
                />
              </label>
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
        <button className="button button-primary" disabled={isBusy} type="submit">
          {isBusy ? "Creating batch..." : "Create batch"}
        </button>
      </div>

      <p className="text-sm muted">{message || "Uploads are stored privately in Supabase Storage."}</p>
    </form>
  );
}
