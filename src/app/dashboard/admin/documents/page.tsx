import { ActionMessage } from "@/components/action-message";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { documentKindLabel } from "@/lib/documents";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  deletePlatformDocument,
  sharePlatformDocument,
  sharePlatformDocumentBulk,
  uploadPlatformDocument,
} from "./actions";

export default async function AdminDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string; count?: string }>;
}) {
  const { success, error, count } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: platformDocs } = await supabase
    .from("documents")
    .select("id, filename, kind, created_at, metadata")
    .eq("source", "platform")
    .order("created_at", { ascending: false });

  const { data: owners } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "owner")
    .order("full_name", { ascending: true });

  const { data: shareCounts } = await supabase
    .from("platform_document_shares")
    .select("document_id");

  const shareCountByDoc = new Map<string, number>();
  for (const row of shareCounts ?? []) {
    shareCountByDoc.set(row.document_id, (shareCountByDoc.get(row.document_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Upload platform resources and share them with landlords individually or in bulk.
        </p>
      </div>

      <ActionMessage success={success} error={error} count={count} />

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Upload document</h2>
        <form action={uploadPlatformDocument} className="mt-4 space-y-4">
          <div>
            <label htmlFor="file" className="text-sm font-medium">
              File
            </label>
            <input
              id="file"
              name="file"
              type="file"
              required
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.txt,.xlsx,.csv"
              className="mt-1 block w-full text-sm"
            />
          </div>
          <div>
            <label htmlFor="kind" className="text-sm font-medium">
              Document type
            </label>
            <select
              id="kind"
              name="kind"
              defaultValue="other"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            >
              <option value="other">Resource / guide</option>
              <option value="notice">Notice template</option>
              <option value="lease">Lease template</option>
              <option value="rental_application">Application template</option>
            </select>
          </div>
          <div>
            <label htmlFor="description" className="text-sm font-medium">
              Description <span className="text-[var(--muted)]">(optional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
          >
            Upload
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Platform library</h2>
        {platformDocs?.length ? (
          <div className="space-y-4">
            {platformDocs.map((doc) => {
              const description =
                typeof doc.metadata === "object" &&
                doc.metadata &&
                "description" in doc.metadata &&
                typeof (doc.metadata as { description?: unknown }).description === "string"
                  ? (doc.metadata as { description: string }).description
                  : null;
              const sharedCount = shareCountByDoc.get(doc.id) ?? 0;

              return (
                <div
                  key={doc.id}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{doc.filename}</p>
                      <p className="text-sm text-[var(--muted)]">
                        {documentKindLabel(doc.kind)} · Uploaded{" "}
                        {new Date(doc.created_at).toLocaleString()} · Shared with {sharedCount}{" "}
                        landlord{sharedCount === 1 ? "" : "s"}
                      </p>
                      {description ? (
                        <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/api/documents/${doc.id}/download`}
                        className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--muted-bg)]"
                      >
                        Download
                      </Link>
                      <form>
                        <input type="hidden" name="document_id" value={doc.id} />
                        <ConfirmSubmitButton
                          formAction={deletePlatformDocument}
                          message={`Delete "${doc.filename}" for all landlords?`}
                          className="rounded-lg border border-[var(--danger)]/40 px-3 py-1.5 text-xs font-semibold text-[var(--danger)] hover:bg-[var(--danger)]/10"
                        >
                          Delete
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <form action={sharePlatformDocument} className="space-y-3 rounded-xl border border-[var(--border)] p-4">
                      <input type="hidden" name="document_id" value={doc.id} />
                      <h3 className="text-sm font-semibold">Share with one landlord</h3>
                      <select
                        name="owner_id"
                        required
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                      >
                        <option value="">Select landlord…</option>
                        {owners?.map((owner) => (
                          <option key={owner.id} value={owner.id}>
                            {owner.full_name || owner.email} ({owner.email})
                          </option>
                        ))}
                      </select>
                      <textarea
                        name="message"
                        rows={2}
                        placeholder="Optional message included in the email"
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                      />
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="notify" defaultChecked />
                        Email landlord when shared
                      </label>
                      <button
                        type="submit"
                        className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
                      >
                        Share individually
                      </button>
                    </form>

                    <form action={sharePlatformDocumentBulk} className="space-y-3 rounded-xl border border-[var(--border)] p-4">
                      <input type="hidden" name="document_id" value={doc.id} />
                      <h3 className="text-sm font-semibold">Share with all landlords</h3>
                      <p className="text-sm text-[var(--muted)]">
                        Distributes this document to every landlord account ({owners?.length ?? 0}{" "}
                        total).
                      </p>
                      <textarea
                        name="message"
                        rows={2}
                        placeholder="Optional message for all recipients"
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                      />
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="notify" defaultChecked />
                        Email every landlord
                      </label>
                      <button
                        type="submit"
                        className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold"
                      >
                        Share with all landlords
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[var(--muted)]">No platform documents uploaded yet.</p>
        )}
      </section>
    </div>
  );
}
