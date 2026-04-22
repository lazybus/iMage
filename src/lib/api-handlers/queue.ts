import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/api";
import { getUserQueueSummary } from "@/lib/db/queries";
import { recoverStaleRunsForUser } from "@/lib/jobs/worker";

type QueueHandlerDependencies = {
  requireApiUser: typeof requireApiUser;
  recoverStaleRunsForUser: typeof recoverStaleRunsForUser;
  getUserQueueSummary: typeof getUserQueueSummary;
};

export function createQueueGetHandler(dependencies: QueueHandlerDependencies = { requireApiUser, recoverStaleRunsForUser, getUserQueueSummary }) {
  return async function GET() {
    const auth = await dependencies.requireApiUser();
    if ("response" in auth) {
      return auth.response;
    }

    const { supabase, user } = auth;

    await dependencies.recoverStaleRunsForUser(supabase, user.id);
    const summary = await dependencies.getUserQueueSummary(supabase, user.id);

    return NextResponse.json(summary, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  };
}