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
  "password-changed": "Password updated.",
  "profile-updated": "Profile updated.",
  "plan-updated": "Subscription plan updated.",
  "features-updated": "Feature access updated.",
  "reset-sent": "Password reset email sent.",
  "temp-password-set": "Temporary password set.",
  "account-deleted": "Account deleted.",
  "account-created": "Account created.",
  "account-created-invited": "Account created and invite email sent.",
  "notice-generated": "Notice PDF generated and saved.",
  "doc-uploaded": "Document uploaded.",
  "docs-uploaded": "Documents uploaded.",
  "doc-deleted": "Document deleted.",
  "doc-shared": "Document shared with landlord.",
  "docs-shared": "Selected documents shared with landlord.",
  "doc-type-updated": "Document type updated.",
  "docs-type-updated": "Document types updated.",
  sent: "If an account exists for that email, we sent a password reset link.",
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
  if (success === "doc-shared-bulk") {
    if (Number.isFinite(n)) {
      return `Document shared with ${n} landlord${n === 1 ? "" : "s"}.`;
    }
    return "Document shared with all landlords.";
  }
  if (success === "docs-uploaded") {
    if (Number.isFinite(n)) {
      return `Uploaded ${n} document${n === 1 ? "" : "s"}.`;
    }
    return "Documents uploaded.";
  }
  if (success === "docs-type-updated") {
    if (Number.isFinite(n)) {
      return `Updated document type for ${n} file${n === 1 ? "" : "s"}.`;
    }
    return "Document types updated.";
  }
  if (success === "docs-shared") {
    if (Number.isFinite(n)) {
      return `Shared ${n} document${n === 1 ? "" : "s"} with landlord.`;
    }
    return "Selected documents shared with landlord.";
  }
  if (success === "docs-shared-bulk") {
    if (Number.isFinite(n)) {
      return `Shared ${n} document${n === 1 ? "" : "s"} with all landlords.`;
    }
    return "Selected documents shared with all landlords.";
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
