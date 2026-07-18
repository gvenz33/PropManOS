import { PaymentInstructions } from "@/components/payment-instructions";
import { PayInvoiceButton } from "@/components/pay-invoice-button";
import { isStripeConfigured, STRIPE_CARD_FEE_PERCENT } from "@/lib/billing/stripe";
import { getActiveBankConnection } from "@/lib/plaid/bank-connections";
import { isPlaidConfigured } from "@/lib/plaid/client";
import { invoiceTotals } from "@/lib/plaid/fees";
import { computeInvoice, statusLabel } from "@/lib/invoices/compute";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import { formatMoney } from "@/lib/utils";

export default async function TenantInvoicesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const plaidEnabled = isPlaidConfigured();
  const stripeEnabled = isStripeConfigured();
  const tenantBank = plaidEnabled
    ? await getActiveBankConnection(user.id, "payment")
    : null;

  const { data: leases } = await supabase
    .from("leases")
    .select(
      "id, units(label, zelle_handle, cashapp_handle, payment_instructions, properties(name, owner_id))",
    )
    .eq("tenant_id", user.id);
  const leaseIds = (leases ?? []).map((l) => l.id);
  const leaseById = new Map((leases ?? []).map((l) => [l.id, l]));

  const ownerIds = new Set<string>();
  for (const lease of leases ?? []) {
    type U = {
      properties: { owner_id: string } | { owner_id: string }[];
    };
    const raw = lease.units as unknown as U | U[] | null;
    const unit = Array.isArray(raw) ? raw[0] : raw;
    const pRaw = unit?.properties;
    const property = Array.isArray(pRaw) ? pRaw[0] : pRaw;
    if (property?.owner_id) ownerIds.add(property.owner_id);
  }

  const ownerPayoutReady = new Set<string>();
  if (plaidEnabled && ownerIds.size > 0) {
    const service = createServiceClient();
    if (service) {
      const { data: ownerBanks } = await service
        .from("bank_connections")
        .select("profile_id")
        .in("profile_id", [...ownerIds])
        .eq("purpose", "payout")
        .eq("status", "active");
      for (const row of ownerBanks ?? []) {
        ownerPayoutReady.add(row.profile_id);
      }
    }
  }

  const { data: invoices } =
    leaseIds.length > 0
      ? await supabase
          .from("invoices")
          .select("*")
          .in("lease_id", leaseIds)
          .order("due_date", { ascending: false })
      : { data: [] as never[] };

  const feeCents = 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
        <p className="mt-1 text-[var(--muted)]">
          Pay by free bank ACH, card (4% tenant fee), or Zelle / Cash App when your landlord added
          those details.
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
            properties: { name: string; owner_id: string } | { name: string; owner_id: string }[];
          };
          const raw = lease?.units as unknown as U | U[] | null;
          const unit = Array.isArray(raw) ? raw[0] ?? null : raw;
          const pRaw = unit?.properties;
          const property = Array.isArray(pRaw) ? pRaw[0] ?? null : pRaw ?? null;
          const totalsAch = invoiceTotals(inv, "ach");
          const totalsCard = invoiceTotals(inv, "card");
          const money = computeInvoice(inv);
          const periodLabel = `${inv.period_year}-${String(inv.period_month).padStart(2, "0")}`;
          const ownerReady = property?.owner_id
            ? ownerPayoutReady.has(property.owner_id)
            : false;
          const canPayByBank =
            plaidEnabled &&
            inv.status !== "paid" &&
            Boolean(tenantBank) &&
            ownerReady;
          const canPayByCard = stripeEnabled && inv.status !== "paid";
          const payDisabledReason =
            inv.status !== "paid" && plaidEnabled && !tenantBank
              ? "Connect your bank in Settings to pay by ACH (free)."
              : inv.status !== "paid" && plaidEnabled && tenantBank && !ownerReady
                ? "Your landlord has not connected a bank account for ACH yet."
                : null;

          return (
            <li
              key={inv.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{periodLabel}</p>
                <p className="text-sm text-[var(--muted)]">{statusLabel(inv.status)}</p>
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">Due {inv.due_date}</p>
              <p className="mt-1 text-lg font-semibold">
                {formatMoney(money.balanceCents)}
                {money.balanceCents !== money.totalCents ? (
                  <span className="ml-1 text-sm font-normal text-[var(--muted)]">
                    balance of {formatMoney(money.totalCents)}
                  </span>
                ) : null}
              </p>
              {totalsAch.lateFeeCents > 0 ? (
                <p className="text-xs text-[var(--muted)]">
                  Includes late fee {formatMoney(totalsAch.lateFeeCents)}
                </p>
              ) : null}
              {money.paidCents > 0 && money.balanceCents > 0 ? (
                <p className="text-xs text-[var(--muted)]">
                  {formatMoney(money.paidCents)} already paid
                </p>
              ) : null}
              {inv.status === "paid" && inv.paid_at ? (
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Paid {new Date(inv.paid_at).toLocaleDateString()}
                  {inv.platform_fee_cents
                    ? ` · Processing fee ${formatMoney(inv.platform_fee_cents)}`
                    : ""}
                </p>
              ) : null}
              {inv.status !== "paid" ? (
                <PayInvoiceButton
                  invoiceId={inv.id}
                  achTotalCents={totalsAch.totalDebitCents}
                  cardTotalCents={totalsCard.totalDebitCents}
                  achFeeCents={feeCents}
                  cardFeeCents={totalsCard.platformFeeCents}
                  cardFeePercent={STRIPE_CARD_FEE_PERCENT}
                  canPayAch={Boolean(canPayByBank)}
                  canPayCard={Boolean(canPayByCard)}
                  disabledReason={payDisabledReason}
                />
              ) : null}
              {inv.status !== "paid" && unit ? (
                <div className="mt-4">
                  <PaymentInstructions
                    unit={{ ...unit, label: unit.label }}
                    propertyName={property?.name}
                    amountLabel={formatMoney(totalsAch.rentAmountCents + totalsAch.lateFeeCents)}
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
