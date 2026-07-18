"use client";

import { formatMoney } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  invoiceId: string;
  achTotalCents: number;
  cardTotalCents: number;
  achFeeCents: number;
  cardFeeCents: number;
  cardFeePercent: number;
  canPayAch: boolean;
  canPayCard: boolean;
  disabledReason?: string | null;
};

export function PayInvoiceButton({
  invoiceId,
  achTotalCents,
  cardTotalCents,
  achFeeCents,
  cardFeeCents,
  cardFeePercent,
  canPayAch,
  canPayCard,
  disabledReason,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"ach" | "card" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function payAch() {
    setLoading("ach");
    setError(null);
    try {
      const res = await fetch("/api/plaid/pay-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: invoiceId }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Payment failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(null);
    }
  }

  async function payCard() {
    setLoading("card");
    setError(null);
    try {
      const res = await fetch("/api/stripe/pay-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });
      const data = (await res.json()) as { error?: string; url?: string };
      if (!res.ok) throw new Error(data.error ?? "Card checkout failed");
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("No checkout URL returned");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Card checkout failed");
      setLoading(null);
    }
  }

  if (!canPayAch && !canPayCard) {
    return disabledReason ? (
      <p className="mt-3 text-xs text-[var(--muted)]">{disabledReason}</p>
    ) : null;
  }

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-[var(--border)] bg-[var(--muted-bg)] p-4">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {canPayAch ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--foreground)]">Pay by bank (ACH)</p>
          <p className="text-xs text-[var(--muted)]">
            {achFeeCents > 0
              ? `Total ${formatMoney(achTotalCents)} includes a ${formatMoney(achFeeCents)} fee.`
              : `Total ${formatMoney(achTotalCents)} — ACH is free for tenants and landlords.`}
          </p>
          <button
            type="button"
            onClick={() => {
              void payAch();
            }}
            disabled={loading !== null}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading === "ach" ? "Processing…" : `Pay ${formatMoney(achTotalCents)} from bank`}
          </button>
        </div>
      ) : null}

      {canPayCard ? (
        <div className="space-y-2 border-t border-[var(--border)] pt-3">
          <p className="text-sm font-medium text-[var(--foreground)]">Pay by card</p>
          <p className="text-xs text-[var(--muted)]">
            Total {formatMoney(cardTotalCents)} includes a {cardFeePercent}% card fee (
            {formatMoney(cardFeeCents)}) paid by you.
          </p>
          <button
            type="button"
            onClick={() => {
              void payCard();
            }}
            disabled={loading !== null}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {loading === "card" ? "Redirecting…" : `Pay ${formatMoney(cardTotalCents)} by card`}
          </button>
        </div>
      ) : null}

      {!canPayAch && disabledReason ? (
        <p className="text-xs text-[var(--muted)]">{disabledReason}</p>
      ) : null}
    </div>
  );
}
