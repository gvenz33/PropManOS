import { DocumentAccordionSections } from "@/components/document-accordion-sections";
import { DOCUMENT_KIND_LABELS } from "@/lib/documents";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type TenantDoc = {
  id: string;
  filename: string;
  kind: string;
  created_at: string;
};

export default async function TenantDocumentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: leases } = await supabase
    .from("leases")
    .select("id")
    .eq("tenant_id", user.id)
    .eq("status", "active");

  const leaseIds = (leases ?? []).map((l) => l.id);
  let docs: TenantDoc[] = [];

  if (leaseIds.length) {
    const { data: rows } = await supabase
      .from("documents")
      .select("id, filename, kind, created_at")
      .in("lease_id", leaseIds)
      .order("created_at", { ascending: false });
    docs = (rows ?? []) as TenantDoc[];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
        <p className="mt-1 text-[var(--muted)]">
          Files your landlord uploaded to your tenancy — leases, notices, receipts, and other
          records.
        </p>
      </div>
      <section className="space-y-4">
        <DocumentAccordionSections
          docs={docs}
          kindLabels={DOCUMENT_KIND_LABELS}
          emptyMessage="No documents uploaded yet. Your landlord can add files to your tenant profile."
        />
      </section>
      <p className="text-sm text-[var(--muted)]">
        Rental applications and forms sent by email or text are separate from these stored files.
      </p>
    </div>
  );
}
