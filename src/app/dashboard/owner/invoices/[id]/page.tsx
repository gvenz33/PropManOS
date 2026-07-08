import { ActionMessage } from "@/components/action-message";
import { computeInvoice, periodLabel, statusLabel } from "@/lib/invoices/compute";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatMoney } from "@/lib/utils";
import {
  emailInvoiceForm,
  markInvoicePaidForm,
  recordInvoicePaymentForm,
  updateInvoiceForm,
  waiveLateFeeForm,
} from "../../../actions";

type LeaseJoin = {
  tenant_email: string;
  tenant_name: string | null;
  units:
    | { label: string; properties: { name: string } | { name: string }[] | null }
    | { label: string; properties: { name: string } | { name: string }[] | null }[]
    | null;
};

function first<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function dollars(cents: number) {
  return (cents / 100).toFixed(2);
}

export default async function OwnerInvoiceEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string; count?: string }>;
}) {
  const { id } = await params;
  const { success, error, count } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: inv } = await supabase
    .from("invoices")
    .select(
      "id, period_year, period_month, amount_cents, due_date, status, late_fee_cents, late_fee_waived, amount_paid_cents, paid_at, leases(tenant_email, tenant_name, units(label, properties(name)))",
    )
    .eq("id", id)
    .maybeSingle();

  if (!inv) {
    redirect(`/dashboard/owner/invoices?error=${encodeURIComponent("Invoice not found.")}`);
  }

  const lease = first(inv!.leases as unknown as LeaseJoin | LeaseJoin[] | null);
  const unit = first(lease?.units);
  const property = first(unit?.properties);
  const money = computeInvoice(inv!);
  const tenant = lease?.tenant_name?.trim() || lease?.tenant_email || "Tenant";
  const period = periodLabel(inv!.period_year, inv!.period_month);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/owner/invoices"
          className="text-sm text-[var(--accent)] hover:underline"
        >
          ← Back to Rent &amp; late fees
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{period}</h1>
        <p className="mt-1 text-[var(--muted)]">
          {tenant}
          {unit?.label ? ` · Unit ${unit.label}` : ""}
          {property?.name ? ` · ${property.name}` : ""}
        </p>
      </div>

      <ActionMessage success={success} error={error} count={count} />

      <section className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm sm:grid-cols-4">
        <div>
          <p className="text-xs uppercase text-[var(--muted)]">Total due</p>
          <p className="mt-1 text-lg font-semibold">{formatMoney(money.totalCents)}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-[var(--muted)]">Paid</p>
          <p className="mt-1 text-lg font-semibold">{formatMoney(money.paidCents)}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-[var(--muted)]">Balance</p>
          <p className="mt-1 text-lg font-semibold">{formatMoney(money.balanceCents)}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-[var(--muted)]">Status</p>
          <p className="mt-1 text-lg font-semibold">{statusLabel(inv!.status)}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Edit invoice</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Adjust the rent amount, due date, or late fee for this month only.
        </p>
        <form action={updateInvoiceForm} className="mt-4 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="invoice_id" value={inv!.id} />
          <div>
            <label className="text-sm font-medium">Rent amount</label>
            <div className="mt-1 flex items-center rounded-lg border border-[var(--border)] bg-[var(--background)] px-3">
              <span className="text-sm text-[var(--muted)]">$</span>
              <input
                name="amount_dollars"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={dollars(inv!.amount_cents)}
                className="w-full bg-transparent px-2 py-2 text-sm outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Due date</label>
            <input
              name="due_date"
              type="date"
              required
              defaultValue={inv!.due_date}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Late fee</label>
            <div className="mt-1 flex items-center rounded-lg border border-[var(--border)] bg-[var(--background)] px-3">
              <span className="text-sm text-[var(--muted)]">$</span>
              <input
                name="late_fee_dollars"
                type="number"
                step="0.01"
                min="0"
                defaultValue={dollars(inv!.late_fee_cents ?? 0)}
                className="w-full bg-transparent px-2 py-2 text-sm outline-none"
              />
            </div>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                name="late_fee_waived"
                defaultChecked={inv!.late_fee_waived}
                className="h-4 w-4"
              />
              Waive late fee
            </label>
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
            >
              Save changes
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Record a payment</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Apply a partial amount, or record the full remaining balance of{" "}
          {formatMoney(money.balanceCents)}.
        </p>
        <form action={recordInvoicePaymentForm} className="mt-4 flex flex-wrap items-end gap-3">
          <input type="hidden" name="invoice_id" value={inv!.id} />
          <input type="hidden" name="from" value="detail" />
          <div>
            <label className="text-sm font-medium">Amount</label>
            <div className="mt-1 flex items-center rounded-lg border border-[var(--border)] bg-[var(--background)] px-3">
              <span className="text-sm text-[var(--muted)]">$</span>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-32 bg-transparent px-2 py-2 text-sm outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            name="mode"
            value="partial"
            disabled={money.balanceCents <= 0}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Record payment
          </button>
          <button
            type="submit"
            name="mode"
            value="full"
            disabled={money.balanceCents <= 0}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--muted-bg)] disabled:opacity-50"
          >
            Pay full balance
          </button>
        </form>
      </section>

      <section className="flex flex-wrap gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
        <form action={emailInvoiceForm}>
          <input type="hidden" name="invoice_id" value={inv!.id} />
          <input type="hidden" name="from" value="detail" />
          <button
            type="submit"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
          >
            Email invoice to tenant
          </button>
        </form>
        {money.balanceCents > 0 ? (
          <form action={markInvoicePaidForm}>
            <input type="hidden" name="invoice_id" value={inv!.id} />
            <input type="hidden" name="from" value="detail" />
            <button
              type="submit"
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--muted-bg)]"
            >
              Mark fully paid
            </button>
          </form>
        ) : null}
        {(inv!.late_fee_cents ?? 0) > 0 && !inv!.late_fee_waived ? (
          <form action={waiveLateFeeForm}>
            <input type="hidden" name="invoice_id" value={inv!.id} />
            <input type="hidden" name="from" value="detail" />
            <button
              type="submit"
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--muted-bg)]"
            >
              Waive late fee
            </button>
          </form>
        ) : null}
      </section>
    </div>
  );
}
