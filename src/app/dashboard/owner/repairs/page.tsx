import { createClient } from "@/lib/supabase/server";
import {
  REPAIR_STATUSES,
  repairPriorityLabel,
  repairStatusLabel,
} from "@/lib/repair-requests";
import { redirect } from "next/navigation";
import { updateRepairRequestStatus } from "../../actions";

export default async function OwnerRepairsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: requests } = await supabase
    .from("repair_requests")
    .select(
      "id, title, description, location, priority, status, created_at, updated_at, leases(tenant_email, tenant_name, units(label, properties(name)))",
    )
    .order("created_at", { ascending: false });

  const openCount = (requests ?? []).filter(
    (r) => r.status !== "completed" && r.status !== "cancelled",
  ).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Maintenance requests</h1>
        <p className="mt-1 text-[var(--muted)]">
          Repair requests submitted by your tenants. Update status as you acknowledge and resolve
          each issue.
        </p>
        {openCount > 0 ? (
          <p className="mt-2 text-sm font-medium text-[var(--accent)]">
            {openCount} open request{openCount === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>

      <ul className="space-y-4">
        {(requests ?? []).map((req) => {
          type U = {
            label: string;
            properties: { name: string } | { name: string }[];
          };
          type L = {
            tenant_email: string;
            tenant_name: string | null;
            units: U | U[] | null;
          };
          const leaseRaw = req.leases as L | L[] | null;
          const lease = Array.isArray(leaseRaw) ? leaseRaw[0] ?? null : leaseRaw;
          const unitRaw = lease?.units;
          const unit = Array.isArray(unitRaw) ? unitRaw[0] ?? null : unitRaw ?? null;
          const pRaw = unit?.properties;
          const property = Array.isArray(pRaw) ? pRaw[0] ?? null : pRaw ?? null;
          const tenantLabel =
            lease?.tenant_name?.trim() || lease?.tenant_email || "Tenant";

          return (
            <li
              key={req.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">{req.title}</h2>
                    <span className="rounded-full bg-[var(--muted-bg)] px-2 py-0.5 text-xs font-medium capitalize">
                      {repairPriorityLabel(req.priority)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {tenantLabel} · {property?.name ?? "Property"} · Unit {unit?.label ?? "—"}
                    {req.location ? ` · ${req.location}` : ""}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed">{req.description}</p>
                  <p className="mt-3 text-xs text-[var(--muted)]">
                    Submitted {new Date(req.created_at).toLocaleString()}
                    {req.updated_at !== req.created_at
                      ? ` · Updated ${new Date(req.updated_at).toLocaleString()}`
                      : ""}
                  </p>
                </div>
                <form action={updateRepairRequestStatus} className="flex shrink-0 flex-wrap items-end gap-2">
                  <input type="hidden" name="repair_request_id" value={req.id} />
                  <div>
                    <label className="text-xs font-medium text-[var(--muted)]">Status</label>
                    <select
                      name="status"
                      defaultValue={req.status}
                      className="mt-1 block rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                    >
                      {REPAIR_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {repairStatusLabel(s)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--muted-bg)]"
                  >
                    Update
                  </button>
                </form>
              </div>
            </li>
          );
        })}
        {requests?.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-[var(--muted)]">
            No maintenance requests yet. Tenants can submit requests from their portal.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
