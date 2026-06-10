import { ActionMessage } from "@/components/action-message";
import { DocumentList } from "@/components/document-list";
import { DocumentUpload } from "@/components/document-upload";
import {
  PropertyUnitCard,
  type PropertyUnitCardData,
} from "@/components/properties/property-unit-card";
import { RentalFormList } from "@/components/rental-form-list";
import type { FormRecipient } from "@/components/send-rental-form";
import { INTERNAL_DOCUMENT_KINDS, RENTAL_FORM_KINDS, kindOptionsFrom } from "@/lib/documents";
import { displayTenantName, displayTenantPhone, type LeaseRow } from "@/lib/leases";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createUnit, updateProperty } from "../../../actions";

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

  const defaultStartDate = new Date().toISOString().slice(0, 10);

  const unitCards: PropertyUnitCardData[] = unitRows.map((u) => ({
    id: u.id,
    label: u.label,
    rent_amount_cents: u.rent_amount_cents,
    due_day_of_month: u.due_day_of_month,
    late_fee_cents: u.late_fee_cents,
    zelle_handle: u.zelle_handle,
    cashapp_handle: u.cashapp_handle,
    payment_instructions: u.payment_instructions,
    activeLeases: (u.leases ?? [])
      .filter((l) => l.status === "active")
      .map((l) => ({
        id: l.id,
        tenant_email: l.tenant_email,
        tenant_name: l.tenant_name,
        displayName: displayTenantName(l),
        displayPhone: displayTenantPhone(l),
        linked: Boolean(l.tenant_id),
      })),
  }));

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

      <div className="space-y-3">
        {unitCards.map((unit, index) => (
          <PropertyUnitCard
            key={unit.id}
            propertyId={id}
            unit={unit}
            defaultStartDate={defaultStartDate}
            defaultOpen={index === 0}
          />
        ))}
        {unitCards.length === 0 ? (
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
