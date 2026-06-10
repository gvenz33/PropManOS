"use client";

import { formatMoney } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  invoiceId: string;
  totalCents: number;
  platformFeeCents: number;
  canPay: boolean;
  disabledReason?: string | null;
};

export function PayInvoiceButton({
  invoiceId,
  totalCents,
  platformFeeCents,
  canPay,
  disabledReason,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/plaid/pay-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: invoiceId }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Payment failed");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  if (!canPay) {
    return disabledReason ? (
      <p className="mt-3 text-xs text-[var(--muted)]">{disabledReason}</p>
    ) : null;
  }

  return (
    <div className="mt-4 space-y-2 rounded-xl border border-[var(--border)] bg-[var(--muted-bg)] p-4">
      <p className="text-sm font-medium text-[var(--foreground)]">Pay from bank (ACH)</p>
      <p className="text-xs text-[var(--muted)]">
        Total debit {formatMoney(totalCents)} includes a {formatMoney(platformFeeCents)} processing
        fee paid by you. Your landlord receives the rent amount only.
      </p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="button"
        onClick={() => {
          void pay();
        }}
        disabled={loading}
        className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Processing…" : `Pay ${formatMoney(totalCents)} from bank`}
      </button>
    </div>
  );
}
