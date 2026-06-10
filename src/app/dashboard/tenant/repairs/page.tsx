import { ActionMessage } from "@/components/action-message";
import { createRepairRequest } from "@/app/dashboard/actions";
import {
  REPAIR_PRIORITIES,
  repairPriorityLabel,
  repairStatusLabel,
} from "@/lib/repair-requests";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function TenantRepairsPage({ searchParams }: Props) {
  const { success, error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: leases } = await supabase
    .from("leases")
    .select("id, units(label, properties(name))")
    .eq("tenant_id", user.id)
    .eq("status", "active");

  const { data: requests } = await supabase
    .from("repair_requests")
    .select(
      "id, title, description, location, priority, status, created_at, leases(units(label, properties(name)))",
    )
    .eq("tenant_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Maintenance requests</h1>
        <p className="mt-1 text-[var(--muted)]">
          Report a repair issue for your unit. Your landlord will see it in their dashboard.
        </p>
      </div>

      <ActionMessage success={success} error={error} />

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Submit a request</h2>
        {(leases ?? []).length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted)]">
            You need an active lease before you can submit a repair request. Ask your landlord to
            link your email to the lease.
          </p>
        ) : (
          <form action={createRepairRequest} className="mt-4 space-y-3">
            {(leases ?? []).length > 1 ? (
              <div>
                <label className="text-sm font-medium">Unit</label>
                <select
                  name="lease_id"
                  required
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                >
                  {(leases ?? []).map((lease) => {
                    type U = {
                      label: string;
                      properties: { name: string } | { name: string }[];
                    };
                    const raw = lease.units as U | U[] | null;
                    const unit = Array.isArray(raw) ? raw[0] ?? null : raw;
                    const pRaw = unit?.properties;
                    const property = Array.isArray(pRaw) ? pRaw[0] ?? null : pRaw ?? null;
                    const label = `${property?.name ?? "Property"} · Unit ${unit?.label ?? "—"}`;
                    return (
                      <option key={lease.id} value={lease.id}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
            ) : (
              <input type="hidden" name="lease_id" value={leases?.[0]?.id ?? ""} />
            )}
            <div>
              <label className="text-sm font-medium">Issue title</label>
              <input
                name="title"
                required
                placeholder="e.g. Kitchen sink leaking"
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Location in unit (optional)</label>
              <input
                name="location"
                placeholder="e.g. Bathroom, living room"
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Priority</label>
              <select
                name="priority"
                defaultValue="normal"
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
              >
                {REPAIR_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {repairPriorityLabel(p)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                name="description"
                required
                rows={4}
                placeholder="Describe the problem and when you noticed it."
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
            >
              Submit request
            </button>
          </form>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Your requests</h2>
        <ul className="mt-4 space-y-3">
          {(requests ?? []).map((req) => {
            type U = {
              label: string;
              properties: { name: string } | { name: string }[];
            };
            const leaseRaw = req.leases as { units: U | U[] | null } | { units: U | U[] | null }[] | null;
            const lease = Array.isArray(leaseRaw) ? leaseRaw[0] ?? null : leaseRaw;
            const unitRaw = lease?.units;
            const unit = Array.isArray(unitRaw) ? unitRaw[0] ?? null : unitRaw ?? null;
            const pRaw = unit?.properties;
            const property = Array.isArray(pRaw) ? pRaw[0] ?? null : pRaw ?? null;

            return (
              <li
                key={req.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-medium">{req.title}</p>
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
                    {repairStatusLabel(req.status)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {property?.name ?? "Property"} · Unit {unit?.label ?? "—"}
                  {req.location ? ` · ${req.location}` : ""}
                </p>
                <p className="mt-2 text-sm leading-relaxed">{req.description}</p>
                <p className="mt-3 text-xs text-[var(--muted)]">
                  {repairPriorityLabel(req.priority)} priority · Submitted{" "}
                  {new Date(req.created_at).toLocaleString()}
                </p>
              </li>
            );
          })}
          {requests?.length === 0 ? (
            <li className="text-[var(--muted)]">No maintenance requests yet.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
