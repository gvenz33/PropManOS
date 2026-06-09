export type UnitPaymentInfo = {
  zelle_handle?: string | null;
  cashapp_handle?: string | null;
  payment_instructions?: string | null;
};

export function hasPaymentMethod(unit: UnitPaymentInfo) {
  return Boolean(
    unit.zelle_handle?.trim() ||
      unit.cashapp_handle?.trim() ||
      unit.payment_instructions?.trim(),
  );
}

export function buildPaymentMemo(parts: {
  unitLabel?: string;
  propertyName?: string;
  periodLabel?: string;
}) {
  return [parts.propertyName, parts.unitLabel ? `Unit ${parts.unitLabel}` : null, parts.periodLabel]
    .filter(Boolean)
    .join(" · ");
}

export function formatPaymentLines(unit: UnitPaymentInfo, amountLabel?: string, memo?: string) {
  const lines: string[] = [];
  if (amountLabel) lines.push(`Amount: ${amountLabel}`);
  if (unit.zelle_handle?.trim()) lines.push(`Zelle: ${unit.zelle_handle.trim()}`);
  if (unit.cashapp_handle?.trim()) lines.push(`Cash App: ${unit.cashapp_handle.trim()}`);
  if (memo) lines.push(`Memo: ${memo}`);
  if (unit.payment_instructions?.trim()) lines.push(unit.payment_instructions.trim());
  return lines;
}
