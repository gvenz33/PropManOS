import { ActionMessage } from "@/components/action-message";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { DocumentList } from "@/components/document-list";
import { DocumentUpload, kindOptionsFrom } from "@/components/document-upload";
import { RentalFormList } from "@/components/rental-form-list";
import type { FormRecipient } from "@/components/send-rental-form";
import { INTERNAL_DOCUMENT_KINDS, RENTAL_FORM_KINDS } from "@/lib/documents";
import { formatCentsAsDollars } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  createLease,
  createUnit,
  endLease,
  removeTenantFromUnit,
  updateLease,
  updateProperty,
  updateUnitPayments,
} from "../../../actions";

import { displayTenantName, displayTenantPhone, type LeaseRow } from "@/lib/leases";

type UnitRow = {
  id: string;
  label: string;
  rent_amount_cents: number;
  due_day_of_month: number;
  late_fee_cents: number;
  zelle_handle: string | null;
  cashapp_handle: string | null;
  payment_instructions: string | null;
  leases: LeaseRow[] | null;
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function OwnerPropertyDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { success, error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!property) notFound();

  const { data: units } = await supabase
    .from("units")
    .select(
      "id, label, rent_amount_cents, due_day_of_month, late_fee_cents, zelle_handle, cashapp_handle, payment_instructions, leases(id, tenant_email, tenant_name, tenant_phone, tenant_id, status, rent_amount_cents, start_date, end_date, profiles(full_name, phone))",
    )
    .eq("property_id", id)
    .order("label");

  const unitRows = (units ?? []) as UnitRow[];

  type PropertyDoc = {
    id: string;
    filename: string;
    kind: string;
    created_at: string;
  };

  const { data: internalDocs } = await supabase
    .from("documents")
    .select("id, filename, kind, created_at")
    .eq("property_id", id)
    .eq("category", "internal")
    .order("created_at", { ascending: false });

  const { data: rentalForms } = await supabase
    .from("documents")
    .select("id, filename, kind, created_at")
    .eq("property_id", id)
    .eq("category", "rental_form")
    .order("created_at", { ascending: false });

  const { data: crmContacts } = await supabase
    .from("crm_contacts")
    .select("id, name, email, phone")
    .eq("owner_id", user.id)
    .order("name");

  const formRecipients: FormRecipient[] = [
    ...(crmContacts ?? []).map((c) => ({
      key: `crm-${c.id}`,
      label: `${c.name} (prospect)`,
      email: c.email ?? "",
      phone: c.phone ?? "",
    })),
    ...unitRows.flatMap((u) =>
      (u.leases ?? [])
        .filter((l) => l.status === "active")
        .map((l) => ({
          key: `lease-${l.id}`,
          label: `${displayTenantName(l) ?? l.tenant_email} (tenant)`,
          email: l.tenant_email,
          phone: displayTenantPhone(l),
        })),
    ),
  ];

  return (
    <div className="space-y-10">
      <div>
        <Link href="/dashboard/owner/properties" className="text-sm text-[var(--accent)] hover:underline">
          ← All properties
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{property.name}</h1>
      </div>

      <ActionMessage success={success} error={error} />

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Property details</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Update the name and address for this building.
        </p>
        <form action={updateProperty} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="property_id" value={id} />
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Property name</label>
            <input
              name="name"
              required
              defaultValue={property.name}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Street address</label>
            <input
              name="address_line1"
              defaultValue={property.address_line1 ?? ""}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">City</label>
            <input
              name="city"
              defaultValue={property.city ?? ""}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">State</label>
            <input
              name="state"
              defaultValue={property.state ?? ""}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Postal code</label>
            <input
              name="postal_code"
              defaultValue={property.postal_code ?? ""}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-end sm:col-span-2">
            <button
              type="submit"
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--muted-bg)]"
            >
              Save address
            </button>
          </div>
        </form>
      </section>

      <section id="units-tenants" className="scroll-mt-8 space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Units & tenants</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Add rental units, assign tenants, and manage leases for this property.
          </p>
        </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Add unit</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Each apartment, suite, or rental space gets its own unit. Set rent and due date here.
        </p>
        <form action={createUnit} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="property_id" value={id} />
          <div>
            <label className="text-sm font-medium">Unit label</label>
            <input
              name="label"
              required
              placeholder="Unit 101"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Monthly rent ($)</label>
            <input
              name="rent_amount_dollars"
              type="text"
              inputMode="decimal"
              required
              placeholder="1250"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Due day of month (1–28)</label>
            <input
              name="due_day_of_month"
              type="number"
              min={1}
              max={28}
              defaultValue={1}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Late fee ($)</label>
            <input
              name="late_fee_dollars"
              type="text"
              inputMode="decimal"
              defaultValue="0"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Grace days</label>
            <input
              name="grace_days"
              type="number"
              min={0}
              defaultValue={0}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Zelle (email or phone)</label>
            <input
              name="zelle_handle"
              placeholder="you@email.com"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Cash App ($Cashtag)</label>
            <input
              name="cashapp_handle"
              placeholder="$YourCashtag"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Payment notes (optional)</label>
            <input
              name="payment_instructions"
              placeholder="Include unit number in the memo, etc."
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
            >
              Save unit
            </button>
          </div>
        </form>
      </section>

      <div className="space-y-6">
        {unitRows.map((u) => {
          const activeLeases = (u.leases ?? []).filter((l) => l.status === "active");
          const defaultRent = (u.rent_amount_cents / 100).toFixed(2);

          return (
            <div
              key={u.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Unit {u.label}</h3>
                  <p className="text-sm text-[var(--muted)]">
                    Rent {formatCentsAsDollars(u.rent_amount_cents)} · Due day {u.due_day_of_month}
                    {u.late_fee_cents ? ` · Late fee ${formatCentsAsDollars(u.late_fee_cents)}` : ""}
                  </p>
                </div>
                <Link
                  href={`/dashboard/owner/properties/${id}/units/${u.id}`}
                  className="text-sm font-semibold text-[var(--accent)] hover:underline"
                >
                  Unit profile →
                </Link>
              </div>

              <form
                action={updateUnitPayments}
                className="mt-4 grid gap-3 border-t border-[var(--border)] pt-4 sm:grid-cols-2"
              >
                <input type="hidden" name="unit_id" value={u.id} />
                <input type="hidden" name="property_id" value={id} />
                <div className="sm:col-span-2">
                  <h4 className="text-sm font-semibold">Receive rent via Zelle or Cash App</h4>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Tenants see these handles when paying open invoices.
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Zelle</label>
                  <input
                    name="zelle_handle"
                    defaultValue={u.zelle_handle ?? ""}
                    placeholder="you@email.com"
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Cash App</label>
                  <input
                    name="cashapp_handle"
                    defaultValue={u.cashapp_handle ?? ""}
                    placeholder="$YourCashtag"
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium">Payment notes</label>
                  <input
                    name="payment_instructions"
                    defaultValue={u.payment_instructions ?? ""}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
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

              <div className="mt-4 border-t border-[var(--border)] pt-4">
                <h4 className="text-sm font-semibold">Tenants on this unit</h4>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Remove tenant clears a mistaken assignment. End lease keeps history when a tenancy
                  actually finished.
                </p>
                <ul className="mt-2 space-y-4 text-sm">
                  {activeLeases.map((l) => {
                    const name = displayTenantName(l);
                    const linked = Boolean(l.tenant_id);
                    const rentDefault = (l.rent_amount_cents / 100).toFixed(2);
                    return (
                      <li
                        key={l.id}
                        className="rounded-lg border border-[var(--border)] bg-[var(--muted-bg)]/40 p-4"
                      >
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-medium text-[var(--foreground)]">
                              {name ?? l.tenant_email}
                            </p>
                            <Link
                              href={`/dashboard/owner/properties/${id}/tenants/${l.id}`}
                              className="text-xs text-[var(--accent)] hover:underline"
                            >
                              Tenant profile →
                            </Link>
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              linked
                                ? "bg-[var(--accent-dim)] text-[var(--foreground)]"
                                : "bg-[var(--muted-bg)] text-[var(--muted)]"
                            }`}
                          >
                            {linked ? "Portal connected" : "Awaiting signup"}
                          </span>
                        </div>
                        <form action={updateLease} className="grid gap-3 sm:grid-cols-2">
                          <input type="hidden" name="lease_id" value={l.id} />
                          <input type="hidden" name="property_id" value={id} />
                          <div>
                            <label className="text-sm font-medium">Tenant name</label>
                            <input
                              name="tenant_name"
                              defaultValue={name ?? l.tenant_name ?? ""}
                              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Tenant email</label>
                            <input
                              name="tenant_email"
                              type="email"
                              required
                              defaultValue={l.tenant_email}
                              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-sm font-medium">Tenant phone</label>
                            <input
                              name="tenant_phone"
                              type="tel"
                              defaultValue={displayTenantPhone(l)}
                              placeholder="+1 555 123 4567"
                              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Monthly rent ($)</label>
                            <input
                              name="rent_amount_dollars"
                              type="text"
                              inputMode="decimal"
                              required
                              defaultValue={rentDefault}
                              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Lease start date</label>
                            <input
                              name="start_date"
                              type="date"
                              required
                              defaultValue={l.start_date}
                              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Lease end date (optional)</label>
                            <input
                              name="end_date"
                              type="date"
                              defaultValue={l.end_date ?? ""}
                              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                            />
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                            <button
                              type="submit"
                              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
                            >
                              Save tenant
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
                    );
                  })}
                  {!activeLeases.length ? (
                    <li className="text-[var(--muted)]">No tenant assigned yet.</li>
                  ) : null}
                </ul>
              </div>

              <form
                action={createLease}
                className="mt-6 grid gap-3 border-t border-[var(--border)] pt-4 sm:grid-cols-2"
              >
                <input type="hidden" name="unit_id" value={u.id} />
                <input type="hidden" name="property_id" value={id} />
                <div className="sm:col-span-2">
                  <h4 className="text-sm font-semibold">Add tenant to this unit</h4>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Use the email your tenant will sign up with at GotMyRent.com. Their portal
                    connects automatically after they create an account.
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Tenant name</label>
                  <input
                    name="tenant_name"
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Tenant email</label>
                  <input
                    name="tenant_email"
                    type="email"
                    required
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                    placeholder="tenant@email.com"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium">Tenant phone (optional)</label>
                  <input
                    name="tenant_phone"
                    type="tel"
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                    placeholder="+1 555 123 4567"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Monthly rent ($)</label>
                  <input
                    name="rent_amount_dollars"
                    type="text"
                    inputMode="decimal"
                    required
                    defaultValue={defaultRent}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Lease start date</label>
                  <input
                    name="start_date"
                    type="date"
                    required
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Lease end date (optional)</label>
                  <input
                    name="end_date"
                    type="date"
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex items-end sm:col-span-2">
                  <button
                    type="submit"
                    className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Add tenant
                  </button>
                </div>
              </form>
            </div>
          );
        })}
        {unitRows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-[var(--muted)]">
            No units yet. Add your first unit above, then assign a tenant to each one.
          </p>
        ) : null}
      </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Internal files</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Private landlord records for this property — insurance, permits, notes, and other files
          tenants never see.
        </p>
        <div className="mt-4">
          <DocumentList
            docs={(internalDocs ?? []) as PropertyDoc[]}
            emptyMessage="No internal files yet."
          />
        </div>
        <DocumentUpload
          propertyId={id}
          category="internal"
          title="Upload internal file"
          kindOptions={kindOptionsFrom(INTERNAL_DOCUMENT_KINDS)}
          compact
        />
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Rental forms</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Keep applications, agreements, and other forms on file, then send them to prospects or
          active tenants by email or text. Recipients get a download link — nothing is posted to
          the tenant portal.
        </p>
        <div className="mt-4">
          <RentalFormList
            forms={(rentalForms ?? []) as PropertyDoc[]}
            propertyId={id}
            recipients={formRecipients}
          />
        </div>
        <DocumentUpload
          propertyId={id}
          category="rental_form"
          defaultKind="rental_application"
          title="Upload rental form"
          kindOptions={kindOptionsFrom(RENTAL_FORM_KINDS)}
          compact
        />
      </section>
    </div>
  );
}
