import { DocumentList } from "@/components/document-list";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function TenantDocumentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: leases } = await supabase.from("leases").select("id").eq("tenant_id", user.id);
  const leaseIds = (leases ?? []).map((l) => l.id);

  const { data: docs } =
    leaseIds.length > 0
      ? await supabase
          .from("documents")
          .select("id, filename, kind, created_at")
          .in("lease_id", leaseIds)
          .order("created_at", { ascending: false })
      : { data: [] as never[] };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
        <p className="mt-1 text-[var(--muted)]">
          Files your landlord shared for your lease — applications, agreements, notices, and more.
        </p>
      </div>
      <DocumentList docs={docs ?? []} emptyMessage="No documents linked to your leases yet." />
    </div>
  );
}
