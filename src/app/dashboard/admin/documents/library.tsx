"use client";

import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { documentKindLabel } from "@/lib/documents";
import Link from "next/link";
import {
  deletePlatformDocument,
  sharePlatformDocument,
  sharePlatformDocumentBulk,
} from "./actions";

type OwnerOption = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type PlatformDoc = {
  id: string;
  filename: string;
  kind: string;
  created_at: string;
  description: string | null;
  sharedCount: number;
};

const SECTION_ORDER = ["other", "notice", "lease", "rental_application"] as const;

const SECTION_LABELS: Record<string, string> = {
  other: "Resource / guide",
  notice: "Notice template",
  lease: "Lease template",
  rental_application: "Application template",
};

function sectionLabel(kind: string) {
  return SECTION_LABELS[kind] ?? documentKindLabel(kind);
}

export function PlatformDocumentLibrary({
  docs,
  owners,
}: {
  docs: PlatformDoc[];
  owners: OwnerOption[];
}) {
  const grouped = new Map<string, PlatformDoc[]>();
  for (const doc of docs) {
    const key = doc.kind || "other";
    const list = grouped.get(key) ?? [];
    list.push(doc);
    grouped.set(key, list);
  }

  const orderedKinds = [
    ...SECTION_ORDER.filter((kind) => grouped.has(kind)),
    ...Array.from(grouped.keys()).filter(
      (kind) => !SECTION_ORDER.includes(kind as (typeof SECTION_ORDER)[number]),
    ),
  ];

  if (!docs.length) {
    return <p className="text-sm text-[var(--muted)]">No platform documents uploaded yet.</p>;
  }

  return (
    <div className="space-y-8">
      {orderedKinds.map((kind) => {
        const sectionDocs = grouped.get(kind) ?? [];
        return (
          <section key={kind} className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-base font-semibold">{sectionLabel(kind)}</h3>
              <p className="text-xs text-[var(--muted)]">
                {sectionDocs.length} file{sectionDocs.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="space-y-2">
              {sectionDocs.map((doc) => (
                <details
                  key={doc.id}
                  className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm open:shadow-md"
                >
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{doc.filename}</p>
                      <p className="text-xs text-[var(--muted)]">
                        Uploaded {new Date(doc.created_at).toLocaleString()} · Shared with{" "}
                        {doc.sharedCount} landlord{doc.sharedCount === 1 ? "" : "s"}
                      </p>
                      {doc.description ? (
                        <p className="mt-1 line-clamp-1 text-xs text-[var(--muted)]">
                          {doc.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/api/documents/${doc.id}/download`}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--muted-bg)]"
                      >
                        Download
                      </Link>
                      <span className="text-xs font-medium text-[var(--accent)] group-open:hidden">
                        Share ▾
                      </span>
                      <span className="hidden text-xs font-medium text-[var(--muted)] group-open:inline">
                        Hide ▴
                      </span>
                    </div>
                  </summary>

                  <div className="space-y-4 border-t border-[var(--border)] px-4 py-4">
                    {doc.description ? (
                      <p className="text-sm text-[var(--muted)]">{doc.description}</p>
                    ) : null}

                    <div className="grid gap-4 lg:grid-cols-2">
                      <form
                        action={sharePlatformDocument}
                        className="space-y-3 rounded-xl border border-[var(--border)] p-4"
                      >
                        <input type="hidden" name="document_id" value={doc.id} />
                        <h4 className="text-sm font-semibold">Share with one landlord</h4>
                        <select
                          name="owner_id"
                          required
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                        >
                          <option value="">Select landlord…</option>
                          {owners.map((owner) => (
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

                      <form
                        action={sharePlatformDocumentBulk}
                        className="space-y-3 rounded-xl border border-[var(--border)] p-4"
                      >
                        <input type="hidden" name="document_id" value={doc.id} />
                        <h4 className="text-sm font-semibold">Share with all landlords</h4>
                        <p className="text-sm text-[var(--muted)]">
                          Distributes this document to every landlord account ({owners.length}{" "}
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

                    <form className="flex justify-end">
                      <input type="hidden" name="document_id" value={doc.id} />
                      <ConfirmSubmitButton
                        formAction={deletePlatformDocument}
                        message={`Delete "${doc.filename}" for all landlords?`}
                        className="rounded-lg border border-[var(--danger)]/40 px-3 py-1.5 text-xs font-semibold text-[var(--danger)] hover:bg-[var(--danger)]/10"
                      >
                        Delete document
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </details>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
