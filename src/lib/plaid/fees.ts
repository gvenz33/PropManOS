export function platformFeeCents() {
  const raw = process.env.PLAID_ACH_FEE_CENTS ?? "250";
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 250;
}

export function invoiceTotals(invoice: {
  amount_cents: number;
  late_fee_cents: number;
  late_fee_waived: boolean;
}) {
  const lateFeeCents = invoice.late_fee_waived ? 0 : invoice.late_fee_cents ?? 0;
  const rentAmountCents = invoice.amount_cents;
  const feeCents = platformFeeCents();
  const totalDebitCents = rentAmountCents + lateFeeCents + feeCents;
  const ownerCreditCents = rentAmountCents + lateFeeCents;

  return {
    rentAmountCents,
    lateFeeCents,
    platformFeeCents: feeCents,
    totalDebitCents,
    ownerCreditCents,
  };
}

export function centsToPlaidAmount(cents: number) {
  return (cents / 100).toFixed(2);
}
