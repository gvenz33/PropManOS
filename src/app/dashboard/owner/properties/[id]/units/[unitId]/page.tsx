import { ActionMessage } from "@/components/action-message";
import { DocumentList } from "@/components/document-list";
import { DocumentUpload } from "@/components/document-upload";
import { PROFILE_DOCUMENT_KINDS, kindOptionsFrom } from "@/lib/documents";
import { displayTenantName, type LeaseRow } from "@/lib/leases";
import { formatCentsAsDollars } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { updateUnitPayments } from "../../../../../actions";

type Props = {
  params: Promise<{ id: string; unitId: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
};

type PropertyDoc = {
  id: string;
  filename: string;
  kind: string;
  created_at: string;
};

export default async function OwnerUnitProfilePage({ params, searchParams }: Props) {
  const { id: propertyId, unitId } = await params;
  const { success, error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: property } = await supabase
    .from("properties")
    .select("id, name")
    .eq("id", propertyId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!property) notFound();

  const { data: unit } = await supabase
    .from("units")
    .select(
      "id, label, rent_amount_cents, due_day_of_month, late_fee_cents, zelle_handle, cashapp_handle, payment_instructions, leases(id, tenant_email, tenant_name, tenant_phone, tenant_id, status, rent_amount_cents, start_date, end_date, profiles(full_name, phone))",
    )
    .eq("id", unitId)
    .eq("property_id", propertyId)
    .maybeSingle();
  if (!unit) notFound();

  const { data: unitDocs } = await supabase
    .from("documents")
    .select("id, filename, kind, created_at")
    .eq("unit_id", unitId)
    .is("lease_id", null)
    .order("created_at", { ascending: false });

  const activeLeases = ((unit.leases ?? []) as LeaseRow[]).filter((l) => l.status === "active");

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/dashboard/owner/properties/${propertyId}#units-tenants`}
          className="text-sm text-[var(--accent)] hover:underline"
        >
          ← {property.name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Unit {unit.label}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Rent {formatCentsAsDollars(unit.rent_amount_cents)} · Due day {unit.due_day_of_month}
          {unit.late_fee_cents ? ` · Late fee ${formatCentsAsDollars(unit.late_fee_cents)}` : ""}
        </p>
      </div>

      <ActionMessage success={success} error={error} />

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Payment methods</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Tenants see these handles when paying open invoices for this unit.
        </p>
        <form action={updateUnitPayments} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="unit_id" value={unitId} />
          <input type="hidden" name="property_id" value={propertyId} />
          <div>
            <label className="text-sm font-medium">Zelle</label>
            <input
              name="zelle_handle"
              defaultValue={unit.zelle_handle ?? ""}
              placeholder="you@email.com"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Cash App</label>
            <input
              name="cashapp_handle"
              defaultValue={unit.cashapp_handle ?? ""}
              placeholder="$YourCashtag"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Payment notes</label>
            <input
              name="payment_instructions"
              defaultValue={unit.payment_instructions ?? ""}
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
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Unit documents</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Store inspection reports, move-in checklists, and other files for this unit. These stay in
          your landlord workspace only.
        </p>
        <div className="mt-4">
          <DocumentList
            docs={(unitDocs ?? []) as PropertyDoc[]}
            emptyMessage="No unit documents yet."
          />
        </div>
        <DocumentUpload
          propertyId={propertyId}
          unitId={unitId}
          category="internal"
          title="Upload unit document"
          kindOptions={kindOptionsFrom(PROFILE_DOCUMENT_KINDS)}
          compact
        />
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Tenants on this unit</h2>
        <ul className="mt-4 space-y-3">
          {activeLeases.map((lease) => {
            const name = displayTenantName(lease);
            return (
              <li key={lease.id}>
                <Link
                  href={`/dashboard/owner/properties/${propertyId}/tenants/${lease.id}`}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] px-4 py-3 transition hover:border-[var(--accent)]"
                >
                  <div>
                    <p className="font-medium">{name ?? lease.tenant_email}</p>
                    <p className="text-sm text-[var(--muted)]">{lease.tenant_email}</p>
                  </div>
                  <span className="text-sm text-[var(--accent)]">Tenant profile →</span>
                </Link>
              </li>
            );
          })}
          {!activeLeases.length ? (
            <li className="text-sm text-[var(--muted)]">
              No tenant assigned. Add one from the{" "}
              <Link href={`/dashboard/owner/properties/${propertyId}#units-tenants`} className="text-[var(--accent)] hover:underline">
                property page
              </Link>
              .
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
