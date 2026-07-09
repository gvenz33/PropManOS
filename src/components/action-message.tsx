type Props = {
  success?: string | null;
  error?: string | null;
  count?: string | null;
};

const successCopy: Record<string, string> = {
  property: "Property saved.",
  unit: "Unit added.",
  lease: "Tenant added to this unit.",
  "lease-updated": "Tenant information updated.",
  "tenant-removed": "Tenant removed from this unit.",
  "lease-ended": "Lease ended.",
  updated: "Property updated.",
  payments: "Payment methods saved.",
  settings: "Notification preferences saved.",
  "email-settings": "Email settings saved.",
  "test-email": "Test email sent.",
  submitted: "Maintenance request submitted.",
  waived: "Late fee waived.",
  paid: "Invoice marked as paid.",
  payment: "Payment recorded.",
  "invoice-updated": "Invoice updated.",
  emailed: "Invoice emailed to the tenant.",
};

function buildMessage(success: string, count?: string | null) {
  const n = Number(count);
  if (success === "generated") {
    if (Number.isFinite(n)) {
      return n === 0
        ? "No new invoices — every lease already has invoices for those months."
        : `Generated ${n} new invoice${n === 1 ? "" : "s"}.`;
    }
    return "Invoices generated.";
  }
  if (success === "late-applied") {
    if (Number.isFinite(n)) {
      return n === 0
        ? "No overdue invoices needed a late fee."
        : `Applied late rules to ${n} invoice${n === 1 ? "" : "s"}.`;
    }
    return "Late fees applied.";
  }
  return successCopy[success] ?? "Saved.";
}

export function ActionMessage({ success, error, count }: Props) {
  if (!success && !error) return null;

  if (error) {
    return (
      <p
        role="alert"
        className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]"
      >
        {error}
      </p>
    );
  }

  return (
    <p
      role="status"
      className="rounded-lg border border-[var(--accent)]/30 bg-[var(--accent-dim)]/40 px-4 py-3 text-sm text-[var(--foreground)]"
    >
      {buildMessage(success ?? "", count)}
    </p>
  );
}
