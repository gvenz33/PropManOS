import { DocumentList } from "@/components/document-list";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OwnerDocumentUpload } from "./upload";

export default async function OwnerDocumentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: docs } = await supabase
    .from("documents")
    .select("id, filename, kind, created_at, lease_id, leases(tenant_email)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const { data: properties } = await supabase.from("properties").select("id").eq("owner_id", user.id);
  const propIds = (properties ?? []).map((p) => p.id);
  let leaseOptions: { id: string; label: string }[] = [];
  if (propIds.length) {
    const { data: units } = await supabase.from("units").select("id").in("property_id", propIds);
    const unitIds = (units ?? []).map((u) => u.id);
    if (unitIds.length) {
      const { data: leases } = await supabase
        .from("leases")
        .select("id, tenant_email")
        .in("unit_id", unitIds)
        .eq("status", "active");
      leaseOptions =
        (leases ?? []).map((l) => ({
          id: l.id,
          label: l.tenant_email,
        })) ?? [];
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
        <p className="mt-1 text-[var(--muted)]">
          Upload leases, applications, agreements, and other files. Tenants see documents linked to
          their lease.
        </p>
      </div>

      <OwnerDocumentUpload leaseOptions={leaseOptions} />

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold">All uploads</h2>
        <div className="mt-4">
          <DocumentList docs={docs ?? []} emptyMessage="No documents uploaded yet." />
        </div>
      </div>

      <p className="text-sm text-[var(--muted)]">
        You can also upload from each property page under property files and tenant profiles.{" "}
        <Link href="/dashboard/owner/properties" className="text-[var(--accent)] hover:underline">
          Manage properties
        </Link>
      </p>
    </div>
  );
}
