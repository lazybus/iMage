import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";

export function DashboardSidebar({ email }: { email: string }) {
  return (
    <aside className="panel flex h-fit flex-col gap-6 rounded-[30px] p-6">
      <div className="space-y-2">
        <p className="eyebrow">iMage</p>
        <h2 className="text-3xl font-semibold tracking-[-0.04em]">Edit queues with batch control</h2>
        <p className="muted text-sm">Signed in as {email}</p>
      </div>
      <nav className="grid gap-2 text-sm">
        <Link className="rounded-full px-4 py-3 hover:bg-black/5" href="/batches">
          All batches
        </Link>
        <Link className="rounded-full px-4 py-3 hover:bg-black/5" href="/batches/new">
          New batch
        </Link>
      </nav>
      <SignOutButton />
    </aside>
  );
}
