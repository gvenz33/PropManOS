import { ActionMessage } from "@/components/action-message";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { DocumentList } from "@/components/document-list";
import { DocumentUpload, kindOptionsFrom } from "@/components/document-upload";
import { PROFILE_DOCUMENT_KINDS } from "@/lib/documents";
import { displayTenantName, displayTenantPhone, type LeaseRow } from "@/lib/leases";
import { formatCentsAsDollars } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { endLease, removeTenantFromUnit, updateLease } from "../../../../../actions";

type Props = {
  params: Promise<{ id: string; leaseId: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
};

type PropertyDoc = {
  id: string;
  filename: string;
  kind: string;
  created_at: string;
};

export default async function OwnerTenantProfilePage({ params, searchParams }: Props) {
  const { id: propertyId, leaseId } = await params;
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

  const { data: leaseRaw } = await supabase
    .from("leases")
    .select(
      "id, tenant_email, tenant_name, tenant_phone, tenant_id, status, rent_amount_cents, start_date, end_date, unit_id, profiles(full_name, phone), units!inner(id, label, property_id)",
    )
    .eq("id", leaseId)
    .maybeSingle();

  if (!leaseRaw) notFound();

  const unit = Array.isArray(leaseRaw.units) ? leaseRaw.units[0] : leaseRaw.units;
  if (!unit || unit.property_id !== propertyId) notFound();

  const lease = leaseRaw as LeaseRow & { unit_id: string };
  const name = displayTenantName(lease);
  const linked = Boolean(lease.tenant_id);
  const rentDefault = (lease.rent_amount_cents / 100).toFixed(2);

  const { data: tenantDocs } = await supabase
    .from("documents")
    .select("id, filename, kind, created_at")
    .eq("lease_id", leaseId)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/dashboard/owner/properties/${propertyId}/units/${unit.id}`}
          className="text-sm text-[var(--accent)] hover:underline"
        >
          ← Unit {unit.label}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{name ?? lease.tenant_email}</h1>
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
        <p className="mt-1 text-sm text-[var(--muted)]">
          {property.name} · Unit {unit.label} · {lease.tenant_email}
        </p>
      </div>

      <ActionMessage success={success} error={error} />

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Tenant details</h2>
        <form action={updateLease} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="lease_id" value={leaseId} />
          <input type="hidden" name="property_id" value={propertyId} />
          <div>
            <label className="text-sm font-medium">Tenant name</label>
            <input
              name="tenant_name"
              defaultValue={name ?? lease.tenant_name ?? ""}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Tenant email</label>
            <input
              name="tenant_email"
              type="email"
              required
              defaultValue={lease.tenant_email}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Tenant phone</label>
            <input
              name="tenant_phone"
              type="tel"
              defaultValue={displayTenantPhone(lease)}
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
              defaultValue={lease.start_date}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Lease end date (optional)</label>
            <input
              name="end_date"
              type="date"
              defaultValue={lease.end_date ?? ""}
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
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Tenant documents</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Applications, signed leases, notices, and receipts for this tenant. Connected tenants can
          also view these files in their portal.
        </p>
        <div className="mt-4">
          <DocumentList
            docs={(tenantDocs ?? []) as PropertyDoc[]}
            emptyMessage="No tenant documents yet."
          />
        </div>
        <DocumentUpload
          propertyId={propertyId}
          leaseId={leaseId}
          category="internal"
          title="Upload tenant document"
          kindOptions={kindOptionsFrom(PROFILE_DOCUMENT_KINDS)}
          compact
        />
      </section>
    </div>
  );
}
