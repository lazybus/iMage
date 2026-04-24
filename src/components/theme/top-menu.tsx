import Link from "next/link";

import { QueueMenu } from "@/components/queue/queue-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { QueueSummary } from "@/lib/db/types";

export function TopMenu({ initialQueueSummary, showQueueMenu = false }: { initialQueueSummary?: QueueSummary; showQueueMenu?: boolean }) {
  return (
    <div className="topbar relative z-40 rounded-[26px] px-4 py-3 sm:px-6">
      <div className="flex items-center gap-4">
        <Link className="rounded-full px-4 py-2 text-sm font-semibold tracking-[0.18em] text-[var(--muted)] uppercase transition hover-surface" href="/">
          <span className="text-[var(--brand-mark)]">I</span>
          <span className="text-[var(--brand-word)]">Mage</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <Link className="rounded-full px-4 py-2 transition hover-surface" href="/batches">
            Dashboard
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        {showQueueMenu ? <QueueMenu initialSummary={initialQueueSummary} /> : null}
        <ThemeToggle />
      </div>
    </div>
  );
}