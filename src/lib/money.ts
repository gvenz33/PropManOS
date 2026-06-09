export function parseDollarsToCents(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").replace(/[$,\s]/g, "").trim();
  if (!raw) return null;
  const num = Number(raw);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 100);
}

export function formatCentsAsDollars(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
