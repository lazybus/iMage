import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { TopMenu } from "@/components/theme/top-menu";
import { requireUser } from "@/lib/auth/guards";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (!isSupabaseConfigured()) {
    return (
      <main className="shell shell-dashboard py-8">
        <div className="panel rounded-[32px] p-8">
          <p className="eyebrow">Configuration Required</p>
          <h1 className="section-title mt-4">Add Supabase credentials before using the dashboard.</h1>
          <p className="mt-4 muted">The dashboard routes are implemented, but they need `.env.local` values and a live Supabase project.</p>
        </div>
      </main>
    );
  }

  const { user } = await requireUser();

  return (
    <main className="shell shell-dashboard py-6 sm:py-8">
      <div className="grid gap-6">
        <TopMenu />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
        <DashboardSidebar email={user.email ?? "unknown"} />
        <div className="grid gap-6">{children}</div>
      </div>
    </main>
  );
}
