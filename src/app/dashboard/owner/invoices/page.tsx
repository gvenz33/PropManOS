import { ActionMessage } from "@/components/action-message";
import { computeInvoice, statusLabel } from "@/lib/invoices/compute";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatMoney } from "@/lib/utils";
import {
  applyLateFeesForm,
  emailInvoiceForm,
  generateInvoicesForRangeForm,
  generateMonthlyInvoicesForm,
  markInvoicePaidForm,
} from "../../actions";

type LeaseJoin = {
  tenant_email: string;
  tenant_name: string | null;
  units: { label: string } | { label: string }[] | null;
};

const statusStyles: Record<string, string> = {
  paid: "bg-[var(--accent-dim)]/60 text-[var(--foreground)]",
  partial: "bg-amber-100 text-amber-800",
  late: "bg-red-100 text-red-700",
  open: "bg-[var(--muted-bg)] text-[var(--muted)]",
};

export default async function OwnerInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string; count?: string }>;
}) {
  const { success, error, count } = await searchParams;
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
          .select(
            "id, period_year, period_month, amount_cents, due_date, status, late_fee_cents, late_fee_waived, amount_paid_cents, paid_at, leases(tenant_email, tenant_name, units(label))",
          )
          .in("lease_id", leaseIds)
          .order("due_date", { ascending: false })
      : { data: [] as never[] };

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rent &amp; late fees</h1>
        <p className="mt-1 text-[var(--muted)]">
          Generate invoices for any month, record partial or full payments, email invoices to
          tenants, and edit each month independently.
        </p>
      </div>

      <ActionMessage success={success} error={error} count={count} />

      <section className="grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold">Generate invoices</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Create rent charges for a single month or a range of past, current, and future months.
            Existing invoices and their payments are never overwritten.
          </p>
          <form
            action={generateInvoicesForRangeForm}
            className="mt-4 flex flex-wrap items-end gap-3"
          >
            <div>
              <label className="text-xs font-medium text-[var(--muted)]">From month</label>
              <input
                type="month"
                name="from_month"
                defaultValue={currentMonth}
                required
                className="mt-1 block rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--muted)]">To month</label>
              <input
                type="month"
                name="to_month"
                defaultValue={currentMonth}
                required
                className="mt-1 block rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
            >
              Generate range
            </button>
          </form>
          <form action={generateMonthlyInvoicesForm} className="mt-3">
            <button
              type="submit"
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--muted-bg)]"
            >
              Generate this month
            </button>
          </form>
        </div>
        <div className="lg:border-l lg:border-[var(--border)] lg:pl-6">
          <h2 className="text-lg font-semibold">Late fees</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Apply each unit&apos;s late fee to overdue invoices that are past their grace period.
          </p>
          <form action={applyLateFeesForm} className="mt-4">
            <button
              type="submit"
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--muted-bg)]"
            >
              Apply late fees
            </button>
          </form>
        </div>
      </section>

      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--muted-bg)] text-xs uppercase text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3">Tenant</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Paid</th>
              <th className="px-4 py-3">Balance</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(invoices ?? []).map((inv) => {
              const raw = inv.leases as unknown as LeaseJoin | LeaseJoin[] | null;
              const leaseRow = Array.isArray(raw) ? raw[0] ?? null : raw;
              const unitRaw = leaseRow?.units;
              const unit = Array.isArray(unitRaw) ? unitRaw[0] ?? null : unitRaw ?? null;
              const tenant = leaseRow?.tenant_name?.trim() || leaseRow?.tenant_email || "—";
              const money = computeInvoice(inv);
              return (
                <tr key={inv.id} className="border-b border-[var(--border)] align-top last:border-0">
                  <td className="px-4 py-3">{tenant}</td>
                  <td className="px-4 py-3">{unit?.label ?? "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {inv.period_year}-{String(inv.period_month).padStart(2, "0")}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{inv.due_date}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatMoney(money.totalCents)}
                    {money.lateFeeCents > 0 ? (
                      <span className="block text-xs text-[var(--muted)]">
                        incl. late {formatMoney(money.lateFeeCents)}
                      </span>
                    ) : null}
                    {inv.late_fee_waived ? (
                      <span className="block text-xs text-[var(--muted)]">late fee waived</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatMoney(money.paidCents)}</td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium">
                    {formatMoney(money.balanceCents)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        statusStyles[inv.status] ?? statusStyles.open
                      }`}
                    >
                      {statusLabel(inv.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/dashboard/owner/invoices/${inv.id}`}
                        className="rounded border border-[var(--border)] px-2 py-1 text-xs font-medium hover:bg-[var(--muted-bg)]"
                      >
                        Edit
                      </Link>
                      <form action={emailInvoiceForm}>
                        <input type="hidden" name="invoice_id" value={inv.id} />
                        <input type="hidden" name="from" value="list" />
                        <button
                          type="submit"
                          className="rounded border border-[var(--border)] px-2 py-1 text-xs font-medium hover:bg-[var(--muted-bg)]"
                        >
                          Email invoice
                        </button>
                      </form>
                      {money.balanceCents > 0 ? (
                        <form action={markInvoicePaidForm}>
                          <input type="hidden" name="invoice_id" value={inv.id} />
                          <input type="hidden" name="from" value="list" />
                          <button
                            type="submit"
                            className="rounded bg-[var(--foreground)] px-2 py-1 text-xs font-medium text-[var(--background)]"
                          >
                            Mark paid
                          </button>
                        </form>
                      ) : (
                        <span className="text-xs text-[var(--muted)]">
                          Paid {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString() : ""}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {invoices?.length === 0 ? (
          <p className="p-8 text-center text-[var(--muted)]">
            No invoices yet. Add leases, then generate invoices above.
          </p>
        ) : null}
      </div>
    </div>
  );
}
