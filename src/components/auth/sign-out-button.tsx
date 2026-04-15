"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

export function SignOutButton() {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);

  async function handleSignOut() {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      return;
    }

    setIsBusy(true);
    await supabase.auth.signOut();
    setIsBusy(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <button className="button button-secondary" disabled={isBusy} onClick={handleSignOut} type="button">
      Sign out
    </button>
  );
}
