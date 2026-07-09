import { ActionMessage } from "@/components/action-message";
import { ROLE_LABELS, type UserRole } from "@/lib/brand";
import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { AddSubscriberPanel } from "./add-subscriber-panel";
import { SubscriberRoleSelect } from "./role-select";
import { SubscriberDeleteButton } from "./subscriber-delete-button";
import { SubscriberSearchBar } from "./subscriber-search-bar";

const filters = [
  { key: "all", label: "All" },
  { key: "owner", label: ROLE_LABELS.owner },
  { key: "tenant", label: ROLE_LABELS.tenant },
  { key: "admin", label: ROLE_LABELS.admin },
] as const;

type FilterKey = (typeof filters)[number]["key"];

function filterHref(filter: FilterKey, query?: string) {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("role", filter);
  if (query) params.set("q", query);
  const qs = params.toString();
  return `/dashboard/admin/subscribers${qs ? `?${qs}` : ""}`;
}

export default async function AdminSubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string; success?: string; error?: string }>;
}) {
  const { role: roleFilter, q, success, error } = await searchParams;
  const filter = (filters.some((f) => f.key === roleFilter) ? roleFilter : "all") as FilterKey;
  const search = q?.trim() ?? "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("profiles")
    .select("id, full_name, role, email, phone, created_at, subscription_plan")
    .order("created_at", { ascending: false });

  if (filter !== "all") {
    query = query.eq("role", filter);
  }
  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data: subscribers } = await query;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subscribers</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Add, search, edit, and remove landlord, tenant, and admin accounts.
          </p>
        </div>
        <AddSubscriberPanel />
      </div>

      <SubscriberSearchBar />

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f.key}
            href={filterHref(f.key, search || undefined)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              filter === f.key
                ? "bg-[var(--accent)] text-white"
                : "border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--muted-bg)]"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <ActionMessage success={success} error={error} />

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--muted-bg)]">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Plan</th>
              <th className="px-4 py-3 font-semibold">Joined</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscribers?.length ? (
              subscribers.map((subscriber) => (
                <tr key={subscriber.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-3 font-medium">
                    {subscriber.full_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {subscriber.email || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <SubscriberRoleSelect
                      profileId={subscriber.id}
                      currentRole={subscriber.role as UserRole}
                      disabled={subscriber.id === user?.id}
                    />
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {SUBSCRIPTION_PLANS[(subscriber.subscription_plan ?? "free") as SubscriptionPlan]
                      ?.label ?? "Free"}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {new Date(subscriber.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/dashboard/admin/subscribers/${subscriber.id}`}
                        className="text-sm font-medium text-[var(--accent)] hover:underline"
                      >
                        Manage
                      </Link>
                      <SubscriberDeleteButton
                        profileId={subscriber.id}
                        email={subscriber.email ?? ""}
                        name={subscriber.full_name ?? ""}
                        disabled={subscriber.id === user?.id || !subscriber.email}
                      />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[var(--muted)]">
                  {search
                    ? "No subscribers match your search."
                    : "No subscribers found for this filter."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
