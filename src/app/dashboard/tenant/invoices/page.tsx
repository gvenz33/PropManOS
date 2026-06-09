import { PaymentInstructions } from "@/components/payment-instructions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatMoney } from "@/lib/utils";

export default async function TenantInvoicesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: leases } = await supabase
    .from("leases")
    .select(
      "id, units(label, zelle_handle, cashapp_handle, payment_instructions, properties(name))",
    )
    .eq("tenant_id", user.id);
  const leaseIds = (leases ?? []).map((l) => l.id);
  const leaseById = new Map((leases ?? []).map((l) => [l.id, l]));

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
          Pay open invoices via Zelle or Cash App using your landlord&apos;s details below.
        </p>
      </div>
      <ul className="space-y-3">
        {(invoices ?? []).map((inv) => {
          const lease = leaseById.get(inv.lease_id);
          type U = {
            label: string;
            zelle_handle: string | null;
            cashapp_handle: string | null;
            payment_instructions: string | null;
            properties: { name: string } | { name: string }[];
          };
          const raw = lease?.units as unknown as U | U[] | null;
          const unit = Array.isArray(raw) ? raw[0] ?? null : raw;
          const pRaw = unit?.properties;
          const property = Array.isArray(pRaw) ? pRaw[0] ?? null : pRaw ?? null;
          const late = inv.late_fee_waived ? 0 : inv.late_fee_cents ?? 0;
          const total = inv.amount_cents + late;
          const periodLabel = `${inv.period_year}-${String(inv.period_month).padStart(2, "0")}`;
          return (
            <li
              key={inv.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{periodLabel}</p>
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
              {inv.status !== "paid" && unit ? (
                <div className="mt-4">
                  <PaymentInstructions
                    unit={{ ...unit, label: unit.label }}
                    propertyName={property?.name}
                    amountLabel={formatMoney(total)}
                    periodLabel={periodLabel}
                    compact
                  />
                </div>
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
