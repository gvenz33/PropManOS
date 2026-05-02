import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DocumentUpload } from "./upload";

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
          Upload leases, notices, and receipts. Tenants see files linked to their lease.
        </p>
      </div>

      <DocumentUpload leaseOptions={leaseOptions} />

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
        <ul className="divide-y divide-[var(--border)]">
          {(docs ?? []).map((d) => {
            const raw = d.leases as { tenant_email: string } | { tenant_email: string }[] | null;
            const lease = Array.isArray(raw) ? raw[0] ?? null : raw;
            return (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-4">
                <div>
                  <p className="font-medium">{d.filename}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {d.kind} · {new Date(d.created_at).toLocaleString()}
                    {lease ? ` · ${lease.tenant_email}` : ""}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
        {docs?.length === 0 ? (
          <p className="p-8 text-center text-[var(--muted)]">No documents uploaded yet.</p>
        ) : null}
      </div>

      <p className="text-sm text-[var(--muted)]">
        Downloads use Supabase Storage signed URLs — add a small API route when you want
        one-click download from this list.{" "}
        <Link href="/dashboard/owner/properties" className="text-[var(--accent)] hover:underline">
          Manage properties
        </Link>
      </p>
    </div>
  );
}
