import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { getOptionalUser } from "@/lib/auth/guards";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { user } = await getOptionalUser();
  const resolvedSearchParams = await searchParams;

  if (user) {
    redirect("/batches");
  }

  return (
    <main className="shell flex min-h-screen items-center py-8">
      <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-[32px] p-6 sm:p-8">
          <p className="eyebrow">Registration</p>
          <h1 className="section-title mt-4">Create an account before submitting private image editing jobs.</h1>
          <p className="mt-5 text-lg muted">
            New users can register with email and password or use Google OAuth, then access the same protected dashboard flow.
          </p>
          {!isSupabaseConfigured() ? (
            <div className="mt-6 rounded-[24px] bg-[rgba(255,255,255,0.65)] p-5 text-sm muted">
              Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` to activate registration.
            </div>
          ) : null}
        </section>
        <LoginForm configured={isSupabaseConfigured()} initialMessage={resolvedSearchParams.message} mode="sign-up" />
      </div>
    </main>
  );
}