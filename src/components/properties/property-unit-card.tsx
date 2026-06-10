"use client";

import {
  endLease,
  removeTenantFromUnit,
  updateLeaseContact,
  updateUnitPayments,
} from "@/app/dashboard/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { DocumentList } from "@/components/document-list";
import { DocumentUpload } from "@/components/document-upload";
import { PROFILE_DOCUMENT_KINDS, kindOptionsFrom } from "@/lib/documents";
import { formatCentsAsDollars } from "@/lib/money";
import { useState } from "react";
import { AddTenantModal } from "./add-tenant-modal";

export type PropertyUnitLease = {
  id: string;
  tenant_email: string;
  tenant_name: string | null;
  displayName: string | null;
  displayPhone: string;
  linked: boolean;
};

export type PropertyUnitDocument = {
  id: string;
  filename: string;
  kind: string;
  created_at: string;
};

export type PropertyUnitCardData = {
  id: string;
  label: string;
  rent_amount_cents: number;
  due_day_of_month: number;
  late_fee_cents: number;
  zelle_handle: string | null;
  cashapp_handle: string | null;
  payment_instructions: string | null;
  activeLeases: PropertyUnitLease[];
  documents: PropertyUnitDocument[];
};

type Props = {
  propertyId: string;
  unit: PropertyUnitCardData;
  defaultStartDate: string;
  defaultOpen?: boolean;
};

export function PropertyUnitCard({
  propertyId,
  unit,
  defaultStartDate,
  defaultOpen = false,
}: Props) {
  const [addTenantOpen, setAddTenantOpen] = useState(false);
  const defaultRent = (unit.rent_amount_cents / 100).toFixed(2);
  const tenantCount = unit.activeLeases.length;
  const primaryLeaseId = unit.activeLeases.length === 1 ? unit.activeLeases[0].id : undefined;

  return (
    <>
      <details className="property-unit-accordion group" open={defaultOpen}>
        <summary className="property-unit-summary">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[var(--foreground)]">Unit {unit.label}</p>
            <p className="mt-0.5 text-sm text-[var(--muted)]">
              {formatCentsAsDollars(unit.rent_amount_cents)} / mo · Due day {unit.due_day_of_month}
              {unit.late_fee_cents
                ? ` · Late fee ${formatCentsAsDollars(unit.late_fee_cents)}`
                : ""}
              {tenantCount
                ? ` · ${unit.activeLeases.map((l) => l.displayName ?? l.tenant_email).join(", ")}`
                : " · Vacant"}
              {unit.documents.length ? ` · ${unit.documents.length} file${unit.documents.length === 1 ? "" : "s"}` : ""}
            </p>
          </div>
          <span className="property-unit-chevron" aria-hidden>
            ▾
          </span>
        </summary>

        <div className="border-t border-[var(--border)] px-5 pb-5 pt-4">
          <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setAddTenantOpen(true)}
              className="btn-primary text-sm"
            >
              Assign tenant
            </button>
          </div>

          <form action={updateUnitPayments} className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="unit_id" value={unit.id} />
            <input type="hidden" name="property_id" value={propertyId} />
            <input type="hidden" name="return_to" value="property" />
            <div className="sm:col-span-2">
              <h4 className="text-sm font-semibold">Payment methods</h4>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Tenants see these when paying open invoices.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Zelle</label>
              <input
                name="zelle_handle"
                defaultValue={unit.zelle_handle ?? ""}
                placeholder="you@email.com"
                className="dashboard-input mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Cash App</label>
              <input
                name="cashapp_handle"
                defaultValue={unit.cashapp_handle ?? ""}
                placeholder="$YourCashtag"
                className="dashboard-input mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Payment notes</label>
              <input
                name="payment_instructions"
                defaultValue={unit.payment_instructions ?? ""}
                className="dashboard-input mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--muted-bg)]"
              >
                Save payment methods
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-[var(--border)] pt-4">
            <h4 className="text-sm font-semibold">Tenant</h4>
            <ul className="mt-3 space-y-3">
              {unit.activeLeases.map((lease) => (
                <li
                  key={lease.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{lease.displayName ?? lease.tenant_email}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        lease.linked
                          ? "bg-[var(--accent-dim)] text-[var(--foreground)]"
                          : "bg-[var(--muted-bg)] text-[var(--muted)]"
                      }`}
                    >
                      {lease.linked ? "Portal connected" : "Awaiting signup"}
                    </span>
                  </div>

                  <form action={updateLeaseContact} className="grid gap-3 sm:grid-cols-2">
                    <input type="hidden" name="lease_id" value={lease.id} />
                    <input type="hidden" name="property_id" value={propertyId} />
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <input
                        name="tenant_name"
                        defaultValue={lease.displayName ?? lease.tenant_name ?? ""}
                        className="dashboard-input mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <input
                        name="tenant_email"
                        type="email"
                        required
                        defaultValue={lease.tenant_email}
                        className="dashboard-input mt-1"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-sm font-medium">Phone</label>
                      <input
                        name="tenant_phone"
                        type="tel"
                        defaultValue={lease.displayPhone}
                        placeholder="+1 555 123 4567"
                        className="dashboard-input mt-1"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                      <button type="submit" className="btn-primary text-sm">
                        Save contact
                      </button>
                      <button
                        formAction={endLease}
                        type="submit"
                        className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--muted-bg)]"
                      >
                        End lease
                      </button>
                      <ConfirmSubmitButton
                        formAction={removeTenantFromUnit}
                        message="Remove this tenant from the unit? Any unpaid invoices for this assignment will be deleted."
                        className="rounded-lg border border-[var(--danger)]/40 px-4 py-2 text-sm font-semibold text-[var(--danger)] hover:bg-[var(--danger)]/10"
                      >
                        Remove tenant
                      </ConfirmSubmitButton>
                    </div>
                  </form>
                </li>
              ))}
              {!unit.activeLeases.length ? (
                <li className="rounded-xl border border-dashed border-[var(--border)] px-4 py-6 text-center text-sm text-[var(--muted)]">
                  No tenant assigned. Click <strong>Assign tenant</strong> to add one.
                </li>
              ) : null}
            </ul>
          </div>

          <div className="mt-6 border-t border-[var(--border)] pt-4">
            <h4 className="text-sm font-semibold">Unit documents</h4>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Leases, agreements, and private files for this unit only — stored under Unit {unit.label}.
            </p>
            <div className="mt-3">
              <DocumentList
                docs={unit.documents}
                deletable
                propertyId={propertyId}
                emptyMessage="No documents for this unit yet."
              />
            </div>
            <DocumentUpload
              propertyId={propertyId}
              unitId={unit.id}
              leaseId={primaryLeaseId}
              category="internal"
              title="Upload document"
              kindOptions={kindOptionsFrom(PROFILE_DOCUMENT_KINDS)}
              compact
            />
          </div>
        </div>
      </details>

      <AddTenantModal
        open={addTenantOpen}
        onClose={() => setAddTenantOpen(false)}
        propertyId={propertyId}
        unitId={unit.id}
        unitLabel={unit.label}
        defaultRentDollars={defaultRent}
        defaultStartDate={defaultStartDate}
      />
    </>
  );
}
