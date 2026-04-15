import type { BatchStatus } from "@/lib/db/types";

export function StatusPill({ status }: { status: BatchStatus }) {
  return (
    <span className="pill" data-tone={status}>
      {status}
    </span>
  );
}
