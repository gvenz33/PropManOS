"use client";

import { deleteDocument } from "@/app/dashboard/actions";
import { removePlatformDocumentFromLibrary } from "@/app/dashboard/owner/documents/resource-actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { documentKindLabel } from "@/lib/documents";
import Link from "next/link";

export type AccordionDoc = {
  id: string;
  filename: string;
  kind: string;
  created_at: string;
  subtitle?: string | null;
  description?: string | null;
};

function groupByKind(docs: AccordionDoc[]) {
  const map = new Map<string, AccordionDoc[]>();
  for (const doc of docs) {
    const key = doc.kind || "other";
    const list = map.get(key) ?? [];
    list.push(doc);
    map.set(key, list);
  }
  return map;
}

function kindLabel(kind: string, labels?: Record<string, string>) {
  return labels?.[kind] ?? documentKindLabel(kind);
}

export function DocumentAccordionSections({
  docs,
  emptyMessage = "No documents yet.",
  deletable = false,
  removableFromLibrary = false,
  propertyId,
  kindLabels,
  kindOrder,
}: {
  docs: AccordionDoc[];
  emptyMessage?: string;
  deletable?: boolean;
  removableFromLibrary?: boolean;
  propertyId?: string;
  kindLabels?: Record<string, string>;
  kindOrder?: string[];
}) {
  if (!docs.length) {
    return <p className="text-sm text-[var(--muted)]">{emptyMessage}</p>;
  }

  const grouped = groupByKind(docs);
  const orderedKinds = [
    ...(kindOrder ?? []).filter((kind) => grouped.has(kind)),
    ...Array.from(grouped.keys()).filter((kind) => !(kindOrder ?? []).includes(kind)),
  ];

  return (
    <div className="space-y-3">
      {orderedKinds.map((kind) => {
        const sectionDocs = grouped.get(kind) ?? [];
        return (
          <details
            key={kind}
            className="group/section rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm open:shadow-md"
          >
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
              <div>
                <p className="font-semibold">{kindLabel(kind, kindLabels)}</p>
                <p className="text-xs text-[var(--muted)]">
                  {sectionDocs.length} file{sectionDocs.length === 1 ? "" : "s"}
                </p>
              </div>
              <span className="text-xs font-medium text-[var(--accent)] group-open/section:hidden">
                Open section ▾
              </span>
              <span className="hidden text-xs font-medium text-[var(--muted)] group-open/section:inline">
                Close section ▴
              </span>
            </summary>

            <ul className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
              {sectionDocs.map((doc) => (
                <li
                  key={doc.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{doc.filename}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {new Date(doc.created_at).toLocaleString()}
                      {doc.subtitle ? ` · ${doc.subtitle}` : ""}
                    </p>
                    {doc.description ? (
                      <p className="mt-1 text-xs text-[var(--muted)]">{doc.description}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/api/documents/${doc.id}/download`}
                      className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--muted-bg)]"
                    >
                      Download
                    </Link>
                    {removableFromLibrary ? (
                      <form action={removePlatformDocumentFromLibrary}>
                        <input type="hidden" name="document_id" value={doc.id} />
                        <button
                          type="submit"
                          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold"
                        >
                          Remove
                        </button>
                      </form>
                    ) : null}
                    {deletable ? (
                      <form>
                        <input type="hidden" name="document_id" value={doc.id} />
                        {propertyId ? (
                          <input type="hidden" name="property_id" value={propertyId} />
                        ) : null}
                        <ConfirmSubmitButton
                          formAction={deleteDocument}
                          message={`Delete "${doc.filename}"? This cannot be undone.`}
                          className="rounded-lg border border-[var(--danger)]/40 px-3 py-1.5 text-xs font-semibold text-[var(--danger)] hover:bg-[var(--danger)]/10"
                        >
                          Delete
                        </ConfirmSubmitButton>
                      </form>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </details>
        );
      })}
    </div>
  );
}
