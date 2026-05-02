import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatMoney } from "@/lib/utils";
import {
  applyLateFeesForm,
  generateMonthlyInvoicesForm,
  markInvoicePaidForm,
  waiveLateFeeForm,
} from "../../actions";

export default async function OwnerInvoicesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: properties } = await supabase.from("properties").select("id").eq("owner_id", user.id);
  const propIds = (properties ?? []).map((p) => p.id);
  let leaseIds: string[] = [];
  if (propIds.length) {
    const { data: units } = await supabase.from("units").select("id").in("property_id", propIds);
    const unitIds = (units ?? []).map((u) => u.id);
    if (unitIds.length) {
      const { data: leases } = await supabase.from("leases").select("id").in("unit_id", unitIds);
      leaseIds = (leases ?? []).map((l) => l.id);
    }
  }

  const { data: invoices } =
    leaseIds.length > 0
      ? await supabase
          .from("invoices")
          .select("id, period_year, period_month, amount_cents, due_date, status, late_fee_cents, late_fee_waived, paid_at, leases(tenant_email, units(label))")
          .in("lease_id", leaseIds)
          .order("due_date", { ascending: false })
      : { data: [] as never[] };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rent & late fees</h1>
          <p className="mt-1 text-[var(--muted)]">
            Generate this month&apos;s charges, apply late rules, waive fees, and mark paid.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={generateMonthlyInvoicesForm}>
            <button
              type="submit"
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
            >
              Generate this month
            </button>
          </form>
          <form action={applyLateFeesForm}>
            <button
              type="submit"
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--muted-bg)]"
            >
              Apply late fees
            </button>
          </form>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--muted-bg)] text-xs uppercase text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3">Tenant</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Late fee</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(invoices ?? []).map((inv) => {
              const raw = inv.leases as
                | {
                    tenant_email: string;
                    units: { label: string } | { label: string }[] | null;
                  }
                | {
                    tenant_email: string;
                    units: { label: string } | { label: string }[] | null;
                  }[]
                | null;
              const leaseRow = Array.isArray(raw) ? raw[0] ?? null : raw;
              const unitRaw = leaseRow?.units;
              const unit = Array.isArray(unitRaw) ? unitRaw[0] ?? null : unitRaw ?? null;
              const lease = leaseRow
                ? { tenant_email: leaseRow.tenant_email, units: unit }
                : null;
              const total =
                inv.amount_cents + (inv.late_fee_waived ? 0 : inv.late_fee_cents ?? 0);
              return (
                <tr key={inv.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-3">{lease?.tenant_email ?? "—"}</td>
                  <td className="px-4 py-3">{lease?.units?.label ?? "—"}</td>
                  <td className="px-4 py-3">
                    {inv.period_year}-{String(inv.period_month).padStart(2, "0")}
                  </td>
                  <td className="px-4 py-3">{inv.due_date}</td>
                  <td className="px-4 py-3">{formatMoney(inv.amount_cents)}</td>
                  <td className="px-4 py-3">
                    {inv.late_fee_waived ? (
                      <span className="text-[var(--muted)]">Waived</span>
                    ) : (
                      formatMoney(inv.late_fee_cents ?? 0)
                    )}
                  </td>
                  <td className="px-4 py-3 capitalize">{inv.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {inv.status !== "paid" ? (
                        <>
                          {inv.late_fee_cents > 0 && !inv.late_fee_waived ? (
                            <form action={waiveLateFeeForm}>
                              <input type="hidden" name="invoice_id" value={inv.id} />
                              <button
                                type="submit"
                                className="rounded border border-[var(--border)] px-2 py-1 text-xs font-medium hover:bg-[var(--muted-bg)]"
                              >
                                Waive late fee
                              </button>
                            </form>
                          ) : null}
                          <form action={markInvoicePaidForm}>
                            <input type="hidden" name="invoice_id" value={inv.id} />
                            <button
                              type="submit"
                              className="rounded bg-[var(--foreground)] px-2 py-1 text-xs font-medium text-[var(--background)]"
                            >
                              Mark paid
                            </button>
                          </form>
                        </>
                      ) : (
                        <span className="text-xs text-[var(--muted)]">
                          Paid {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString() : ""}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Total due: {formatMoney(total)}
                    </p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {invoices?.length === 0 ? (
          <p className="p-8 text-center text-[var(--muted)]">
            No invoices yet. Add leases, then generate this month.
          </p>
        ) : null}
      </div>
    </div>
  );
}
