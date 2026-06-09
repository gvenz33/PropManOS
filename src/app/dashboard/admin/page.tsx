import { ROLE_LABELS } from "@/lib/brand";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("role")
    .order("created_at", { ascending: false });

  const counts = {
    owner: profiles?.filter((p) => p.role === "owner").length ?? 0,
    tenant: profiles?.filter((p) => p.role === "tenant").length ?? 0,
    admin: profiles?.filter((p) => p.role === "admin").length ?? 0,
    total: profiles?.length ?? 0,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin overview</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Monitor subscribers and manage landlord, tenant, and admin accounts.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total subscribers", value: counts.total },
          { label: ROLE_LABELS.owner, value: counts.owner },
          { label: ROLE_LABELS.tenant, value: counts.tenant },
          { label: ROLE_LABELS.admin, value: counts.admin },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm"
          >
            <p className="text-sm text-[var(--muted)]">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Quick actions</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Review every account, change roles, and keep landlords and tenants organized.
        </p>
        <Link
          href="/dashboard/admin/subscribers"
          className="mt-4 inline-flex rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Manage subscribers
        </Link>
      </div>
    </div>
  );
}
