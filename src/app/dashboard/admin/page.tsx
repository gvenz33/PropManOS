import { ROLE_LABELS } from "@/lib/brand";
import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { AddSubscriberPanel } from "./subscribers/add-subscriber-panel";

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, subscription_plan, created_at")
    .order("created_at", { ascending: false });

  const counts = {
    owner: profiles?.filter((p) => p.role === "owner").length ?? 0,
    tenant: profiles?.filter((p) => p.role === "tenant").length ?? 0,
    admin: profiles?.filter((p) => p.role === "admin").length ?? 0,
    total: profiles?.length ?? 0,
  };

  const planCounts = (Object.keys(SUBSCRIPTION_PLANS) as SubscriptionPlan[]).map((plan) => ({
    plan,
    label: SUBSCRIPTION_PLANS[plan].label,
    count: profiles?.filter((p) => (p.subscription_plan ?? "free") === plan).length ?? 0,
  }));

  const recent = profiles?.slice(0, 6) ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin overview</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Monitor subscribers, plans, and platform activity.
          </p>
        </div>
        <AddSubscriberPanel />
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

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Subscription plans</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {planCounts.map((item) => (
              <li key={item.plan} className="flex items-center justify-between gap-3">
                <span className="text-[var(--muted)]">{item.label}</span>
                <span className="font-semibold">{item.count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Quick actions</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/dashboard/admin/subscribers"
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
            >
              All subscribers
            </Link>
            <Link
              href="/dashboard/admin/documents"
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold"
            >
              Documents
            </Link>
            <Link
              href="/dashboard/admin/tools"
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold"
            >
              Platform tools
            </Link>
            <Link
              href="/dashboard/admin/settings"
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold"
            >
              Admin account
            </Link>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Recent signups</h2>
          <Link
            href="/dashboard/admin/subscribers"
            className="text-sm font-medium text-[var(--accent)] hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                <th className="pb-2 pr-4 font-medium">Name</th>
                <th className="pb-2 pr-4 font-medium">Email</th>
                <th className="pb-2 pr-4 font-medium">Role</th>
                <th className="pb-2 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {recent.length ? (
                recent.map((profile) => (
                  <tr key={profile.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="py-2 pr-4 font-medium">
                      <Link
                        href={`/dashboard/admin/subscribers/${profile.id}`}
                        className="hover:text-[var(--accent)]"
                      >
                        {profile.full_name || "—"}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 text-[var(--muted)]">{profile.email || "—"}</td>
                    <td className="py-2 pr-4">{ROLE_LABELS[profile.role as keyof typeof ROLE_LABELS]}</td>
                    <td className="py-2 text-[var(--muted)]">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-[var(--muted)]">
                    No subscribers yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
