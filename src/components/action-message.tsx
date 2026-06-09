type Props = {
  success?: string | null;
  error?: string | null;
};

const successCopy: Record<string, string> = {
  property: "Property saved.",
  unit: "Unit added.",
  lease: "Tenant added to this unit.",
  "lease-ended": "Lease ended.",
};

export function ActionMessage({ success, error }: Props) {
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
      {successCopy[success ?? ""] ?? "Saved."}
    </p>
  );
}
