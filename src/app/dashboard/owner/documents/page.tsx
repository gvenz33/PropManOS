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

  function propertyLabel(
    properties: { name: string } | { name: string }[] | null | undefined,
  ) {
    const row = Array.isArray(properties) ? properties[0] : properties;
    return row?.name ? ` · ${row.name}` : "";
  }

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
            Private records — never shared with tenants.
          </p>
        </div>
        <OwnerInternalUpload />
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <ul className="divide-y divide-[var(--border)]">
            {(internalDocs ?? []).map((d) => {
              const props = d.properties as { name: string } | { name: string }[] | null;
              return (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <div>
                    <p className="font-medium">{d.filename}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {d.kind}
                      {propertyLabel(props)} · {new Date(d.created_at).toLocaleString()}
                    </p>
                  </div>
                  <a
                    href={`/api/documents/${d.id}/download`}
                    className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--muted-bg)]"
                  >
                    Download
                  </a>
                </li>
              );
            })}
          </ul>
          {!internalDocs?.length ? (
            <p className="text-sm text-[var(--muted)]">No internal files yet.</p>
          ) : null}
        </div>
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
        <DocumentList docs={rentalForms ?? []} emptyMessage="No rental forms at portfolio level." />
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
