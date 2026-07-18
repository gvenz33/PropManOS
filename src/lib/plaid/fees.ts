import { STRIPE_CARD_FEE_PERCENT, stripeCardFeeCents } from "@/lib/billing/stripe";

/** ACH via Plaid is free for landlords and tenants. */
export function platformFeeCents() {
  const raw = process.env.PLAID_ACH_FEE_CENTS ?? "0";
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function cardProcessingFeeCents(subtotalCents: number) {
  return stripeCardFeeCents(subtotalCents);
}

export function invoiceTotals(
  invoice: {
    amount_cents: number;
    late_fee_cents: number;
    late_fee_waived: boolean;
  },
  method: "ach" | "card" = "ach",
) {
  const lateFeeCents = invoice.late_fee_waived ? 0 : invoice.late_fee_cents ?? 0;
  const rentAmountCents = invoice.amount_cents;
  const subtotalCents = rentAmountCents + lateFeeCents;
  const feeCents =
    method === "card" ? cardProcessingFeeCents(subtotalCents) : platformFeeCents();
  const totalDebitCents = subtotalCents + feeCents;
  const ownerCreditCents = subtotalCents;

  return {
    rentAmountCents,
    lateFeeCents,
    subtotalCents,
    platformFeeCents: feeCents,
    cardFeePercent: method === "card" ? STRIPE_CARD_FEE_PERCENT : 0,
    totalDebitCents,
    ownerCreditCents,
  };
}

export function centsToPlaidAmount(cents: number) {
  return (cents / 100).toFixed(2);
}
