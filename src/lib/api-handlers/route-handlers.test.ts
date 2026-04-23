import assert from "node:assert/strict";
import test from "node:test";

import { after, NextResponse } from "next/server";

import { createImagePatchHandler } from "./image-patch";
import { createImageRunHandler } from "./image-run";
import { createQueueGetHandler } from "./queue";

test("queue handler returns auth failure responses unchanged", async () => {
  const GET = createQueueGetHandler({
    requireApiUser: async () => ({ response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }),
    recoverStaleRunsForUser: async () => 0,
    getUserQueueSummary: async () => ({ active_runs: [], recent_history: [], recent_failures: [] }),
  });

  const response = await GET();

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Unauthorized" });
});

test("queue handler returns queue summary for authenticated users", async () => {
  const supabase = { label: "supabase" };
  const user = { id: "user-1" };
  const calls: Array<{ kind: string; args: unknown[] }> = [];
  const summary = { queued: 2, processing: 1, failed: 0 };

  const GET = createQueueGetHandler({
    requireApiUser: async () => ({ supabase, user } as never),
    recoverStaleRunsForUser: async (...args) => {
      calls.push({ kind: "recover", args });
      return 0;
    },
    getUserQueueSummary: async (...args) => {
      calls.push({ kind: "summary", args });
      return summary as never;
    },
  });

  const response = await GET();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await response.json(), summary);
  assert.deepEqual(calls, [
    { kind: "recover", args: [supabase, user.id] },
    { kind: "summary", args: [supabase, user.id] },
  ]);
});

test("image patch handler returns auth failure responses unchanged", async () => {
  const PATCH = createImagePatchHandler({
    requireApiUser: async () => ({ response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }),
  });

  const request = new Request("https://example.com/api/images/image-1", {
    method: "PATCH",
    body: JSON.stringify({ editPrompt: "Sharpen details" }),
    headers: { "Content-Type": "application/json" },
  });

  const response = await PATCH(request, { params: Promise.resolve({ imageId: "image-1" }) });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Unauthorized" });
});

test("image patch handler updates the prompt for authenticated users", async () => {
  const user = { id: "user-1" };
  const updatedImage = { id: "image-1", edit_prompt: "Sharpen details" };
  const operations: Array<[string, unknown, unknown?]> = [];

  const supabase = {
    from(table: string) {
      operations.push(["from", table]);
      return {
        update(values: unknown) {
          operations.push(["update", values]);
          return {
            eq(column: string, value: unknown) {
              operations.push(["eq", column, value]);
              return {
                eq(nextColumn: string, nextValue: unknown) {
                  operations.push(["eq", nextColumn, nextValue]);
                  return {
                    select(fields: string) {
                      operations.push(["select", fields]);
                      return {
                        async single() {
                          return { data: updatedImage, error: null };
                        },
                      };
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  };

  const PATCH = createImagePatchHandler({
    requireApiUser: async () => ({ supabase, user } as never),
  });

  const request = new Request("https://example.com/api/images/image-1", {
    method: "PATCH",
    body: JSON.stringify({ editPrompt: "  Sharpen details  " }),
    headers: { "Content-Type": "application/json" },
  });

  const response = await PATCH(request, { params: Promise.resolve({ imageId: "image-1" }) });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), updatedImage);
  assert.deepEqual(operations, [
    ["from", "batch_images"],
    ["update", { edit_prompt: "Sharpen details" }],
    ["eq", "id", "image-1"],
    ["eq", "user_id", user.id],
    ["select", "id, edit_prompt"],
  ]);
});

test("image run handler returns auth failure responses unchanged", async () => {
  const POST = createImageRunHandler({
    requireApiUser: async () => ({ response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }),
    enqueueSingleImageRun: async () => {
      throw new Error("should not enqueue when auth fails");
    },
    processRunNow: async () => undefined as never,
    scheduleAfter: () => undefined,
  });

  const request = new Request("https://example.com/api/images/image-1/run", {
    method: "POST",
    body: JSON.stringify({ upscaleRequested: true }),
    headers: { "Content-Type": "application/json" },
  });

  const response = await POST(request, { params: Promise.resolve({ imageId: "image-1" }) });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Unauthorized" });
});

test("image run handler enqueues and schedules processing for authenticated users", async () => {
  const user = { id: "user-1" };
  const image = { id: "image-1", batch_id: "batch-1" };
  const batch = { id: "batch-1" };
  const run = { id: "run-1", status: "queued", run_scope: "single" };
  const fromCalls: string[] = [];
  let scheduledTask: Parameters<typeof after>[0] | undefined;
  const processCalls: unknown[][] = [];

  const supabase = {
    from(table: string) {
      fromCalls.push(table);
      return {
        select() {
          return {
            eq(_column: string, value: unknown) {
              return {
                eq() {
                  return {
                    async single() {
                      if (table === "batch_images") {
                        assert.equal(value, image.id);
                        return { data: image, error: null };
                      }

                      if (table === "batches") {
                        assert.equal(value, batch.id);
                        return { data: batch, error: null };
                      }

                      throw new Error(`Unexpected table ${table}`);
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  };

  const POST = createImageRunHandler({
    requireApiUser: async () => ({ supabase, user } as never),
    enqueueSingleImageRun: async (...args) => {
      assert.deepEqual(args, [supabase, batch, image, user, true]);
      return run as never;
    },
    processRunNow: async (...args) => {
      processCalls.push(args);
      return undefined as never;
    },
    scheduleAfter: (task) => {
      scheduledTask = task;
    },
  });

  const request = new Request("https://example.com/api/images/image-1/run", {
    method: "POST",
    body: JSON.stringify({ upscaleRequested: true }),
    headers: { "Content-Type": "application/json" },
  });

  const response = await POST(request, { params: Promise.resolve({ imageId: image.id }) });

  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), {
    runId: run.id,
    status: run.status,
    runScope: run.run_scope,
  });
  assert.deepEqual(fromCalls, ["batch_images", "batches"]);
  assert.ok(scheduledTask);

  if (typeof scheduledTask === "function") {
    await scheduledTask();
  } else {
    await scheduledTask;
  }

  assert.deepEqual(processCalls, [[supabase, run.id, user.id]]);
});