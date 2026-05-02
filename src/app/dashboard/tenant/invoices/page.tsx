import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatMoney } from "@/lib/utils";

export default async function TenantInvoicesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: leases } = await supabase.from("leases").select("id").eq("tenant_id", user.id);
  const leaseIds = (leases ?? []).map((l) => l.id);

  const { data: invoices } =
    leaseIds.length > 0
      ? await supabase
          .from("invoices")
          .select("*")
          .in("lease_id", leaseIds)
          .order("due_date", { ascending: false })
      : { data: [] as never[] };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
        <p className="mt-1 text-[var(--muted)]">
          Amounts include late fees unless your landlord waived them.
        </p>
      </div>
      <ul className="space-y-3">
        {(invoices ?? []).map((inv) => {
          const late = inv.late_fee_waived ? 0 : inv.late_fee_cents ?? 0;
          const total = inv.amount_cents + late;
          return (
            <li
              key={inv.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                  {inv.period_year}-{String(inv.period_month).padStart(2, "0")}
                </p>
                <p className="text-sm capitalize text-[var(--muted)]">{inv.status}</p>
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">Due {inv.due_date}</p>
              <p className="mt-1 text-lg font-semibold">{formatMoney(total)}</p>
              {late > 0 ? (
                <p className="text-xs text-[var(--muted)]">Includes late fee {formatMoney(late)}</p>
              ) : null}
              {inv.status === "paid" && inv.paid_at ? (
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Paid {new Date(inv.paid_at).toLocaleDateString()}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
      {invoices?.length === 0 ? (
        <p className="text-[var(--muted)]">No invoices yet.</p>
      ) : null}
    </div>
  );
}
