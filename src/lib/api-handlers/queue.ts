import { NextResponse } from "next/server";

import { requireApiSession, requireApiUser } from "@/lib/auth/api";
import { getUserQueueSummary } from "@/lib/db/queries";
import { recoverStaleRunsForUser } from "@/lib/jobs/worker";

type QueueHandlerDependencies = {
  requireApiSession: typeof requireApiSession;
  requireApiUser: typeof requireApiUser;
  recoverStaleRunsForUser: typeof recoverStaleRunsForUser;
  getUserQueueSummary: typeof getUserQueueSummary;
};

export function createQueueGetHandler(
  dependencies: QueueHandlerDependencies = { requireApiSession, requireApiUser, recoverStaleRunsForUser, getUserQueueSummary },
) {
  return async function GET(request: Request) {
    const shouldRunMaintenance = new URL(request.url).searchParams.get("maintenance") === "1";

    if (shouldRunMaintenance) {
      const auth = await dependencies.requireApiUser();
      if ("response" in auth) {
        return auth.response;
      }

      const { supabase, user } = auth;

      await dependencies.recoverStaleRunsForUser(supabase, user.id);
      const summary = await dependencies.getUserQueueSummary(supabase);

      return NextResponse.json(summary, {
        headers: {
          "Cache-Control": "no-store",
        },
      });
    }

    const auth = await dependencies.requireApiSession();
    if ("response" in auth) {
      return auth.response;
    }

    const { supabase } = auth;
    const summary = await dependencies.getUserQueueSummary(supabase);

    return NextResponse.json(summary, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  };
}