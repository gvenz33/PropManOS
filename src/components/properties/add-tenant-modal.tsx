"use client";

import { createLease } from "@/app/dashboard/actions";
import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  propertyId: string;
  unitId: string;
  unitLabel: string;
  defaultRentDollars: string;
  defaultStartDate: string;
};

export function AddTenantModal({
  open,
  onClose,
  propertyId,
  unitId,
  unitLabel,
  defaultRentDollars,
  defaultStartDate,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="property-modal w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--card)] p-0 shadow-xl backdrop:bg-black/50"
      onClose={onClose}
    >
      <form action={createLease} className="p-6">
        <input type="hidden" name="property_id" value={propertyId} />
        <input type="hidden" name="unit_id" value={unitId} />
        <input type="hidden" name="rent_amount_dollars" value={defaultRentDollars} />
        <input type="hidden" name="start_date" value={defaultStartDate} />

        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Assign tenant</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Unit {unitLabel} · rent and lease dates use this unit&apos;s settings.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-[var(--muted)] hover:bg-[var(--muted-bg)]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <div>
            <label className="text-sm font-medium">Tenant name</label>
            <input
              name="tenant_name"
              autoFocus
              placeholder="Jane Smith"
              className="dashboard-input mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Tenant email</label>
            <input
              name="tenant_email"
              type="email"
              required
              placeholder="tenant@email.com"
              className="dashboard-input mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Tenant phone (optional)</label>
            <input
              name="tenant_phone"
              type="tel"
              placeholder="+1 555 123 4567"
              className="dashboard-input mt-1"
            />
          </div>
        </div>

        <p className="mt-4 text-xs text-[var(--muted)]">
          They&apos;ll connect to the portal automatically after signing up with this email at
          GotMyRent.com.
        </p>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--muted-bg)]"
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Assign tenant
          </button>
        </div>
      </form>
    </dialog>
  );
}
