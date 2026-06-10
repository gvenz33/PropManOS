import { DocumentList } from "@/components/document-list";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OwnerInternalUpload, OwnerRentalFormUpload } from "./upload";

export default async function OwnerDocumentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: internalDocs } = await supabase
    .from("documents")
    .select("id, filename, kind, created_at, properties(name)")
    .eq("owner_id", user.id)
    .eq("category", "internal")
    .order("created_at", { ascending: false });

  const { data: rentalForms } = await supabase
    .from("documents")
    .select("id, filename, kind, created_at, properties(name)")
    .eq("owner_id", user.id)
    .eq("category", "rental_form")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
        <p className="mt-1 text-[var(--muted)]">
          Internal landlord files and rental forms. Upload forms on a property page to send them to
          prospects and tenants.
        </p>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Internal files</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Portfolio-wide private records. Unit files (leases, agreements) live on each property unit
            card.
          </p>
        </div>
        <OwnerInternalUpload />
        <DocumentList docs={internalDocs ?? []} deletable emptyMessage="No internal files yet." />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Rental forms (portfolio)</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Portfolio-wide form templates. To email or text a form to someone, upload it on the
            property page and use Send.
          </p>
        </div>
        <OwnerRentalFormUpload />
        <DocumentList docs={rentalForms ?? []} deletable emptyMessage="No rental forms at portfolio level." />
      </section>

      <p className="text-sm text-[var(--muted)]">
        Best workflow: open a property → Rental forms → upload → Send to a CRM prospect or active
        tenant.{" "}
        <Link href="/dashboard/owner/properties" className="text-[var(--accent)] hover:underline">
          Manage properties
        </Link>
      </p>
    </div>
  );
}
