export type InvoiceLike = {
  amount_cents: number;
  late_fee_cents: number | null;
  late_fee_waived: boolean;
  amount_paid_cents?: number | null;
  status?: string;
};

export type InvoiceComputed = {
  rentCents: number;
  lateFeeCents: number;
  totalCents: number;
  paidCents: number;
  balanceCents: number;
  fullyPaid: boolean;
};

/**
 * Derives the money breakdown for an invoice. `totalCents` is the rent plus any
 * non-waived late fee; `balanceCents` is what is still owed after payments.
 */
export function computeInvoice(inv: InvoiceLike): InvoiceComputed {
  const rentCents = inv.amount_cents;
  const lateFeeCents = inv.late_fee_waived ? 0 : inv.late_fee_cents ?? 0;
  const totalCents = rentCents + lateFeeCents;
  const paidCents = Math.max(0, inv.amount_paid_cents ?? 0);
  const balanceCents = Math.max(0, totalCents - paidCents);
  return {
    rentCents,
    lateFeeCents,
    totalCents,
    paidCents,
    balanceCents,
    fullyPaid: paidCents >= totalCents && totalCents > 0,
  };
}

/**
 * Chooses the correct invoice status after a payment or edit. Preserves a
 * `late` marker when nothing has been paid and the invoice was already late.
 */
export function statusAfterPayment(
  inv: InvoiceLike,
  paidCents: number,
): "open" | "partial" | "paid" | "late" {
  const lateFeeCents = inv.late_fee_waived ? 0 : inv.late_fee_cents ?? 0;
  const totalCents = inv.amount_cents + lateFeeCents;
  if (totalCents > 0 && paidCents >= totalCents) return "paid";
  if (paidCents > 0) return "partial";
  return inv.status === "late" ? "late" : "open";
}

export function periodLabel(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function statusLabel(status: string) {
  switch (status) {
    case "paid":
      return "Paid";
    case "partial":
      return "Partially paid";
    case "late":
      return "Late";
    default:
      return "Open";
  }
}
