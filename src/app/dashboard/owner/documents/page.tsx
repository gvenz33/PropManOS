import { ActionMessage } from "@/components/action-message";
import { DocumentAccordionSections } from "@/components/document-accordion-sections";
import {
  DOCUMENT_KIND_LABELS,
  noticeTypeLabel,
  PLATFORM_KIND_LABELS,
} from "@/lib/documents";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DocumentsTabNav, type DocumentsTab } from "./documents-tab-nav";
import { GenerateNoticeForm } from "./generate-notice-form";
import { ResourceCenter } from "./resource-center";
import { OwnerInternalUpload, OwnerRentalFormUpload } from "./upload";

const validTabs = ["files", "forms", "rental-documents", "shared"] as const;

function isTab(value: string | undefined): value is DocumentsTab {
  return validTabs.includes(value as DocumentsTab);
}

function metadataDescription(metadata: unknown) {
  if (
    typeof metadata === "object" &&
    metadata &&
    "description" in metadata &&
    typeof (metadata as { description?: unknown }).description === "string"
  ) {
    return (metadata as { description: string }).description;
  }
  return null;
}

function propertyName(properties: unknown): string | null {
  if (!properties) return null;
  if (Array.isArray(properties)) {
    const first = properties[0] as { name?: string } | undefined;
    return first?.name ?? null;
  }
  return (properties as { name?: string }).name ?? null;
}

export default async function OwnerDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; success?: string; error?: string; count?: string }>;
}) {
  const { tab: tabParam, success, error, count } = await searchParams;
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
    .select("shared_at, message, documents(id, filename, kind, created_at, metadata)")
    .eq("owner_id", user.id)
    .order("shared_at", { ascending: false });

  const { data: catalogDocs } = await supabase
    .from("documents")
    .select("id, filename, kind, created_at, metadata")
    .eq("source", "platform")
    .order("created_at", { ascending: false });

  const libraryIds = new Set(
    (sharedRows ?? [])
      .map((row) => {
        const doc = Array.isArray(row.documents) ? row.documents[0] : row.documents;
        return doc?.id;
      })
      .filter(Boolean) as string[],
  );

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
        kind: doc.notice_type ?? "notice",
        created_at: doc.created_at,
        subtitle: tenant,
      };
    }) ?? [];

  const noticeKindLabels: Record<string, string> = {
    "3_day": noticeTypeLabel("3_day"),
    "30_day": noticeTypeLabel("30_day"),
    "60_day": noticeTypeLabel("60_day"),
    notice: "Notice",
  };

  const libraryDocs = (sharedRows ?? []).flatMap((row) => {
    const doc = Array.isArray(row.documents) ? row.documents[0] : row.documents;
    if (!doc) return [];
    return [
      {
        id: doc.id as string,
        filename: doc.filename as string,
        kind: doc.kind as string,
        created_at: row.shared_at as string,
        description: (row.message as string | null) || metadataDescription(doc.metadata),
      },
    ];
  });

  const catalog =
    catalogDocs?.map((doc) => ({
      id: doc.id,
      filename: doc.filename,
      kind: doc.kind,
      created_at: doc.created_at,
      description: metadataDescription(doc.metadata),
      inLibrary: libraryIds.has(doc.id),
    })) ?? [];

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
        <p className="mt-1 text-[var(--muted)]">
          Internal files, rental forms, generated notices, and the site resource center.
        </p>
      </div>

      <DocumentsTabNav active={tab} />
      <ActionMessage success={success} error={error} count={count} />

      {tab === "files" ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Internal files</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Portfolio-wide private records, grouped by document type. Unit files also live on each
              property unit card.
            </p>
          </div>
          <OwnerInternalUpload />
          <DocumentAccordionSections
            docs={(internalDocs ?? []).map((doc) => ({
              id: doc.id,
              filename: doc.filename,
              kind: doc.kind,
              created_at: doc.created_at,
              subtitle: propertyName(doc.properties),
            }))}
            deletable
            kindLabels={DOCUMENT_KIND_LABELS}
            emptyMessage="No internal files yet."
          />
        </section>
      ) : null}

      {tab === "forms" ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Rental forms</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Portfolio-wide form templates, grouped by type. To email or text a form, upload it on
              the property page and use Send.
            </p>
          </div>
          <OwnerRentalFormUpload />
          <DocumentAccordionSections
            docs={(rentalForms ?? []).map((doc) => ({
              id: doc.id,
              filename: doc.filename,
              kind: doc.kind,
              created_at: doc.created_at,
              subtitle: propertyName(doc.properties),
            }))}
            deletable
            kindLabels={DOCUMENT_KIND_LABELS}
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
            <DocumentAccordionSections
              docs={noticeList}
              kindLabels={noticeKindLabels}
              kindOrder={["3_day", "30_day", "60_day", "notice"]}
              emptyMessage="No generated notices yet."
            />
          </section>
        </div>
      ) : null}

      {tab === "shared" ? (
        <div className="space-y-10">
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Resource center</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Browse documents published by the site admin and add them to your library — no need
                to wait for a manual share.
              </p>
            </div>
            <ResourceCenter docs={catalog} />
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">My library</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Resources you added from the center, plus anything shared with you directly.
              </p>
            </div>
            <DocumentAccordionSections
              docs={libraryDocs}
              removableFromLibrary
              kindLabels={PLATFORM_KIND_LABELS}
              kindOrder={Object.keys(PLATFORM_KIND_LABELS)}
              emptyMessage="Nothing in your library yet. Add documents from the Resource center above."
            />
          </section>
        </div>
      ) : null}
    </div>
  );
}
