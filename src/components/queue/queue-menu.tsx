"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { StatusPill } from "@/components/batches/status-pill";
import type { QueueRunSummary, QueueSummary } from "@/lib/db/types";

const DISMISSED_HISTORY_RUNS_STORAGE_KEY = "image-dismissed-history-runs";
const QUEUE_POLL_INTERVAL_MS = 3000;
const QUEUE_MAINTENANCE_INTERVAL_MS = 5 * 60 * 1000;

function QueueIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path d="M7 7h10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M7 12h10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M7 17h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <circle cx="17.5" cy="17.5" fill="currentColor" r="1.5" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" />
      <path className="opacity-90" d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />
    </svg>
  );
}

function createSnapshotKey(summary: QueueSummary) {
  return JSON.stringify({
    active: summary.active_runs.map((run) => [run.id, run.status, run.queued, run.processing, run.completed, run.failed]),
    history: summary.recent_history.map((run) => [run.id, run.status, run.error_message]),
    failures: summary.recent_failures.map((run) => [run.id, run.status, run.error_message]),
  });
}

function loadDismissedHistoryRunIds() {
  if (typeof window === "undefined") {
    return [] as string[];
  }

  const storedValue = window.localStorage.getItem(DISMISSED_HISTORY_RUNS_STORAGE_KEY);

  if (!storedValue) {
    return [] as string[];
  }

  try {
    const parsed = JSON.parse(storedValue) as unknown;
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [] as string[];
  }
}

function persistDismissedHistoryRunIds(runIds: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(DISMISSED_HISTORY_RUNS_STORAGE_KEY, JSON.stringify(runIds));
}

function formatRunLabel(run: QueueRunSummary) {
  if (run.run_scope === "single" && run.target_image_name) {
    return run.target_image_name;
  }

  return `${run.total} ${run.total === 1 ? "image" : "images"}`;
}

function formatTimeLabel(timestamp: string | null) {
  if (!timestamp) {
    return "Waiting to start";
  }

  const date = new Date(timestamp);
  const elapsedMs = Date.now() - date.getTime();
  const elapsedMinutes = Math.round(elapsedMs / 60000);

  if (elapsedMinutes <= 0) {
    return "Just now";
  }

  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m ago`;
  }

  const elapsedHours = Math.round(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours}h ago`;
  }

  return date.toLocaleString();
}

async function loadQueueSummary({ maintenance = false, signal }: { maintenance?: boolean; signal?: AbortSignal } = {}) {
  const response = await fetch(maintenance ? "/api/queue?maintenance=1" : "/api/queue", {
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error("Unable to load processing queue.");
  }

  return (await response.json()) as QueueSummary;
}

async function retryRun(runId: string) {
  const response = await fetch(`/api/queue/${runId}/retry`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const payload = (await response.json().catch(() => null)) as { error?: string } | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? "Unable to retry the processing run.");
  }
}

function QueueRunCard({
  onDismiss,
  onRetry,
  retryingRunId,
  run,
}: {
  onDismiss?: (runId: string) => void;
  onRetry?: (runId: string) => Promise<void>;
  retryingRunId: string | null;
  run: QueueRunSummary;
}) {
  return (
    <div className="surface-soft min-w-0 rounded-[22px] border border-[var(--line)] p-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--foreground)]">{run.batch_title}</p>
          <p className="mt-1 truncate text-sm muted">{formatRunLabel(run)}</p>
        </div>
        <StatusPill status={run.status} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm muted">
        <span>
          {run.completed}/{run.total} complete
        </span>
        <span>{run.failed} failed</span>
        <span>{formatTimeLabel(run.completed_at ?? run.started_at ?? run.created_at)}</span>
      </div>
      {run.error_message ? <p className="mt-3 break-words text-sm text-[var(--foreground)]">{run.error_message}</p> : null}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link className="text-sm font-semibold text-[var(--accent)]" href={`/batches/${run.batch_id}`}>
          Open batch
        </Link>
        {onRetry ? (
          <button className="text-sm font-semibold text-[var(--foreground)]" disabled={retryingRunId === run.id} onClick={() => void onRetry(run.id)} type="button">
            {retryingRunId === run.id ? "Retrying..." : "Retry"}
          </button>
        ) : null}
        {onDismiss ? (
          <button className="text-sm font-semibold text-[var(--foreground)]" onClick={() => onDismiss(run.id)} type="button">
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function QueueMenu({ initialSummary }: { initialSummary?: QueueSummary }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState<QueueSummary>(initialSummary ?? { active_runs: [], recent_history: [], recent_failures: [] });
  const [isLoading, setIsLoading] = useState(!initialSummary);
  const [error, setError] = useState<string | null>(null);
  const [retryingRunId, setRetryingRunId] = useState<string | null>(null);
  const [dismissedHistoryRunIds, setDismissedHistoryRunIds] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const snapshotRef = useRef<string | null>(initialSummary ? createSnapshotKey(initialSummary) : null);
  const timerRef = useRef<number | null>(null);
  const lastMaintenanceAtRef = useRef<number>(0);
  const activeCountRef = useRef(initialSummary?.active_runs.length ?? 0);
  const clearTimerRef = useRef<() => void>(() => undefined);
  const pollRef = useRef<((forceMaintenance?: boolean) => Promise<void>) | null>(null);
  const scheduleNextPollRef = useRef<(nextActiveCount: number) => void>(() => undefined);
  const previousActiveCountRef = useRef(initialSummary?.active_runs.length ?? 0);
  const activeCount = summary.active_runs.length;
  const visibleRecentHistory = summary.recent_history.filter((run) => !dismissedHistoryRunIds.includes(run.id));

  useEffect(() => {
    setDismissedHistoryRunIds(loadDismissedHistoryRunIds());
  }, []);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (!containerRef.current.contains(target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  function dismissRunIds(runIds: string[]) {
    const nextDismissedIds = [...new Set([...dismissedHistoryRunIds, ...runIds])];
    setDismissedHistoryRunIds(nextDismissedIds);
    persistDismissedHistoryRunIds(nextDismissedIds);
  }

  function handleDismissRun(runId: string) {
    dismissRunIds([runId]);
  }

  function handleClearHistory() {
    dismissRunIds(visibleRecentHistory.map((run) => run.id));
  }

  function handleToggleOpen() {
    setIsOpen((current) => {
      const nextIsOpen = !current;

      if (nextIsOpen) {
        setIsLoading(true);
        setError(null);
        void pollRef.current?.();
      }

      return nextIsOpen;
    });
  }

  async function handleRetry(runId: string) {
    setRetryingRunId(runId);
    setError(null);

    try {
      await retryRun(runId);
      const nextSummary = await loadQueueSummary();
      setSummary(nextSummary);
      snapshotRef.current = createSnapshotKey(nextSummary);
      activeCountRef.current = nextSummary.active_runs.length;
      previousActiveCountRef.current = nextSummary.active_runs.length;
      scheduleNextPollRef.current(nextSummary.active_runs.length);
      router.refresh();
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : "Unable to retry the processing run.");
    } finally {
      setRetryingRunId(null);
    }
  }

  useEffect(() => {
    let isMounted = true;
    let controller: AbortController | null = null;

    const clearTimer = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const shouldRunMaintenance = (forceMaintenance = false) => {
      if (forceMaintenance) {
        lastMaintenanceAtRef.current = Date.now();
        return true;
      }

      if (Date.now() - lastMaintenanceAtRef.current < QUEUE_MAINTENANCE_INTERVAL_MS) {
        return false;
      }

      lastMaintenanceAtRef.current = Date.now();
      return true;
    };

    const scheduleNextPoll = (nextActiveCount: number) => {
      clearTimer();

      if (nextActiveCount === 0 || document.visibilityState !== "visible") {
        return;
      }

      timerRef.current = window.setTimeout(() => {
        void pollRef.current?.();
      }, QUEUE_POLL_INTERVAL_MS);
    };

    const poll = async (forceMaintenance = false) => {
      clearTimer();

      if (controller) {
        controller.abort();
      }

      controller = new AbortController();

      try {
        const nextSummary = await loadQueueSummary({ maintenance: shouldRunMaintenance(forceMaintenance), signal: controller.signal });

        if (!isMounted) {
          return;
        }

        setSummary(nextSummary);
        setError(null);
        setIsLoading(false);

        const nextSnapshot = createSnapshotKey(nextSummary);
        if (snapshotRef.current && snapshotRef.current !== nextSnapshot) {
          router.refresh();
        }
        snapshotRef.current = nextSnapshot;

        if (previousActiveCountRef.current === 0 && nextSummary.active_runs.length > 0) {
          setIsOpen(true);
        }

        activeCountRef.current = nextSummary.active_runs.length;
        previousActiveCountRef.current = nextSummary.active_runs.length;
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }

        if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
          return;
        }

        setIsLoading(false);
        setError(fetchError instanceof Error ? fetchError.message : "Unable to load processing queue.");
        activeCountRef.current = 0;
      } finally {
        if (!isMounted) {
          return;
        }

        scheduleNextPoll(activeCountRef.current);
      }
    };

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        clearTimer();
        if (controller) {
          controller.abort();
          controller = null;
        }
        return;
      }

      if (activeCountRef.current > 0) {
        void pollRef.current?.();
      }
    }

    clearTimerRef.current = clearTimer;
    scheduleNextPollRef.current = scheduleNextPoll;
    pollRef.current = poll;
    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (initialSummary?.active_runs.length) {
      scheduleNextPoll(initialSummary.active_runs.length);
    } else if (!initialSummary) {
      void poll(true);
    }

    return () => {
      isMounted = false;
      clearTimer();
      if (controller) {
        controller.abort();
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [initialSummary, router]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={isOpen}
        className="theme-toggle min-w-[10.5rem] justify-between gap-3"
        onClick={handleToggleOpen}
        type="button"
      >
        <span className="inline-flex items-center gap-2">
          {activeCount > 0 ? <SpinnerIcon /> : <QueueIcon />}
          <span className="theme-toggle-label">Processing</span>
        </span>
        <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-[var(--accent-soft)] px-2 py-1 text-xs font-semibold text-[var(--foreground)]">
          {activeCount}
        </span>
      </button>

      {isOpen ? (
        <div className="queue-panel panel absolute right-0 top-[calc(100%+0.75rem)] z-[80] flex max-h-[min(80vh,42rem)] w-[min(28rem,calc(100vw-2rem))] min-w-0 flex-col overflow-hidden rounded-[28px] border border-[var(--line)] p-5 shadow-[0_24px_72px_rgba(0,0,0,0.45)]">
          <div className="flex min-w-0 items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="eyebrow">Processing Queue</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Keep working while jobs finish.</h2>
            </div>
            {activeCount > 0 ? <StatusPill status="processing" /> : null}
          </div>

          {isLoading ? <p className="mt-5 text-sm muted">Loading queue status...</p> : null}
          {error ? <p className="mt-5 text-sm text-[var(--foreground)]">{error}</p> : null}

          {!isLoading && !error ? (
            <div className="queue-scroll mt-5 grid min-w-0 gap-5 overflow-y-auto pr-2 overscroll-contain">
              <section className="grid gap-3">
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--foreground)]">Active tasks</p>
                  <p className="text-sm muted">{activeCount === 0 ? "No active jobs" : `${activeCount} running or queued`}</p>
                </div>
                {summary.active_runs.length === 0 ? (
                  <div className="surface-soft rounded-[22px] border border-dashed border-[var(--line)] p-4 text-sm muted">No queued or processing work right now.</div>
                ) : (
                  summary.active_runs.map((run) => <QueueRunCard key={run.id} retryingRunId={retryingRunId} run={run} />)
                )}
              </section>

              <section className="grid gap-3">
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-3">
                  <p className="text-sm font-semibold text-[var(--foreground)]">Recent History</p>
                  <div className="flex min-w-0 flex-wrap items-center gap-3 text-sm muted sm:justify-end">
                    {visibleRecentHistory.length > 0 ? (
                      <button className="font-semibold text-[var(--foreground)]" onClick={handleClearHistory} type="button">
                        Clear all
                      </button>
                    ) : null}
                  </div>
                </div>
                {visibleRecentHistory.length === 0 ? (
                  <div className="surface-soft rounded-[22px] border border-dashed border-[var(--line)] p-4 text-sm muted">No completed or failed runs in queue history.</div>
                ) : (
                  visibleRecentHistory.map((run) => (
                    <QueueRunCard key={run.id} onDismiss={handleDismissRun} onRetry={run.status === "failed" ? handleRetry : undefined} retryingRunId={retryingRunId} run={run} />
                  ))
                )}
              </section>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}