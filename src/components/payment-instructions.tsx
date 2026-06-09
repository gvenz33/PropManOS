import { buildPaymentMemo, formatPaymentLines, hasPaymentMethod, type UnitPaymentInfo } from "@/lib/payments";

type Props = {
  unit: UnitPaymentInfo & { label?: string };
  propertyName?: string;
  amountLabel: string;
  periodLabel?: string;
  compact?: boolean;
};

export function PaymentInstructions({
  unit,
  propertyName,
  amountLabel,
  periodLabel,
  compact = false,
}: Props) {
  if (!hasPaymentMethod(unit)) {
    return (
      <p className="text-sm text-[var(--muted)]">
        Your landlord has not added Zelle or Cash App details yet. Contact them for payment
        instructions.
      </p>
    );
  }

  const memo = buildPaymentMemo({
    propertyName,
    unitLabel: unit.label,
    periodLabel,
  });
  const lines = formatPaymentLines(unit, amountLabel, memo || undefined);

  return (
    <div className={compact ? "space-y-1 text-sm" : "space-y-2 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-dim)]/25 p-4"}>
      {!compact ? <p className="font-semibold text-[var(--foreground)]">How to pay</p> : null}
      <ul className={compact ? "space-y-1 text-[var(--muted)]" : "space-y-2 text-sm text-[var(--foreground)]"}>
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      {!compact ? (
        <p className="text-xs text-[var(--muted)]">
          Send payment in Zelle or Cash App, then your landlord will mark the invoice paid.
        </p>
      ) : null}
    </div>
  );
}
