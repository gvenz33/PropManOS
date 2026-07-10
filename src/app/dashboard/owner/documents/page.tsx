import { ActionMessage } from "@/components/action-message";
import { DocumentList } from "@/components/document-list";
import { noticeTypeLabel } from "@/lib/documents";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DocumentsTabNav, type DocumentsTab } from "./documents-tab-nav";
import { GenerateNoticeForm } from "./generate-notice-form";
import { OwnerInternalUpload, OwnerRentalFormUpload } from "./upload";

const validTabs = ["files", "forms", "rental-documents", "shared"] as const;

function isTab(value: string | undefined): value is DocumentsTab {
  return validTabs.includes(value as DocumentsTab);
}

export default async function OwnerDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; success?: string; error?: string }>;
}) {
  const { tab: tabParam, success, error } = await searchParams;
  const tab = isTab(tabParam) ? tabParam : "files";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: internalDocs } = await supabase
    .from("documents")
    .select("id, filename, kind, created_at, properties(name)")
    .eq("owner_id", user.id)
    .eq("source", "owner")
    .eq("category", "internal")
    .is("notice_type", null)
    .order("created_at", { ascending: false });

  const { data: rentalForms } = await supabase
    .from("documents")
    .select("id, filename, kind, created_at, properties(name)")
    .eq("owner_id", user.id)
    .eq("source", "owner")
    .eq("category", "rental_form")
    .order("created_at", { ascending: false });

  const { data: noticeDocs } = await supabase
    .from("documents")
    .select("id, filename, kind, notice_type, created_at, leases(tenant_name, tenant_email)")
    .eq("owner_id", user.id)
    .eq("source", "owner")
    .eq("kind", "notice")
    .not("notice_type", "is", null)
    .order("created_at", { ascending: false });

  const { data: leaseRows } = await supabase
    .from("leases")
    .select("id, tenant_name, tenant_email, units!inner(label, properties!inner(name, owner_id))")
    .eq("status", "active")
    .eq("units.properties.owner_id", user.id)
    .order("tenant_name", { ascending: true });

  const { data: sharedRows } = await supabase
    .from("platform_document_shares")
    .select("shared_at, message, documents(id, filename, kind, created_at)")
    .eq("owner_id", user.id)
    .order("shared_at", { ascending: false });

  const leaseOptions =
    leaseRows?.map((lease) => {
      const unit = Array.isArray(lease.units) ? lease.units[0] : lease.units;
      const property = unit?.properties
        ? Array.isArray(unit.properties)
          ? unit.properties[0]
          : unit.properties
        : null;
      const tenant = lease.tenant_name?.trim() || lease.tenant_email;
      const location = [property?.name, unit?.label].filter(Boolean).join(" · ");
      return {
        id: lease.id,
        label: location ? `${tenant} — ${location}` : tenant,
      };
    }) ?? [];

  const noticeList =
    noticeDocs?.map((doc) => {
      const lease = Array.isArray(doc.leases) ? doc.leases[0] : doc.leases;
      const tenant = lease?.tenant_name?.trim() || lease?.tenant_email || "Tenant";
      return {
        id: doc.id,
        filename: doc.filename,
        kind: doc.notice_type ? noticeTypeLabel(doc.notice_type) : doc.kind,
        created_at: doc.created_at,
        subtitle: tenant,
      };
    }) ?? [];

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
        <p className="mt-1 text-[var(--muted)]">
          Internal files, rental forms, generated notices, and resources shared by the site admin.
        </p>
      </div>

      <DocumentsTabNav active={tab} />
      <ActionMessage success={success} error={error} />

      {tab === "files" ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Internal files</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Portfolio-wide private records. Unit files also live on each property unit card.
            </p>
          </div>
          <OwnerInternalUpload />
          <DocumentList docs={internalDocs ?? []} deletable emptyMessage="No internal files yet." />
        </section>
      ) : null}

      {tab === "forms" ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Rental forms</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Portfolio-wide form templates. To email or text a form, upload it on the property page
              and use Send.
            </p>
          </div>
          <OwnerRentalFormUpload />
          <DocumentList
            docs={rentalForms ?? []}
            deletable
            emptyMessage="No rental forms at portfolio level."
          />
          <p className="text-sm text-[var(--muted)]">
            Best workflow: open a property → Rental forms → upload → Send.{" "}
            <Link href="/dashboard/owner/properties" className="text-[var(--accent)] hover:underline">
              Manage properties
            </Link>
          </p>
        </section>
      ) : null}

      {tab === "rental-documents" ? (
        <div className="space-y-8">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Generate notice</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Create a PDF 3-day, 30-day, or 60-day notice for an active tenant. Review with your
              attorney before serving — requirements vary by location.
            </p>
            <div className="mt-4">
              {leaseOptions.length ? (
                <GenerateNoticeForm leases={leaseOptions} defaultNoticeDate={today} />
              ) : (
                <p className="text-sm text-[var(--muted)]">
                  Add an active tenant to a property first.{" "}
                  <Link href="/dashboard/owner/properties" className="text-[var(--accent)] hover:underline">
                    Manage properties
                  </Link>
                </p>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Generated notices</h2>
            {noticeList.length ? (
              <ul className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)]">
                {noticeList.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{doc.filename}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {doc.kind} · {doc.subtitle} · {new Date(doc.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Link
                      href={`/api/documents/${doc.id}/download`}
                      className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--muted-bg)]"
                    >
                      Download
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--muted)]">No generated notices yet.</p>
            )}
          </section>
        </div>
      ) : null}

      {tab === "shared" ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Site resources</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Documents uploaded and shared with you by the {` `}
              site admin team.
            </p>
          </div>
          {sharedRows?.length ? (
            <ul className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)]">
              {sharedRows.map((row) => {
                const doc = Array.isArray(row.documents) ? row.documents[0] : row.documents;
                if (!doc) return null;
                return (
                  <li
                    key={`${doc.id}-${row.shared_at}`}
                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{doc.filename}</p>
                      <p className="text-xs text-[var(--muted)]">
                        Shared {new Date(row.shared_at).toLocaleString()}
                      </p>
                      {row.message ? (
                        <p className="mt-1 text-xs text-[var(--muted)]">{row.message}</p>
                      ) : null}
                    </div>
                    <Link
                      href={`/api/documents/${doc.id}/download`}
                      className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--muted-bg)]"
                    >
                      Download
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-[var(--muted)]">No shared resources yet.</p>
          )}
        </section>
      ) : null}
    </div>
  );
}
