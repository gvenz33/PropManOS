"use client";

import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { documentKindLabel } from "@/lib/documents";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  bulkSharePlatformDocuments,
  bulkUpdatePlatformDocumentKinds,
  deletePlatformDocument,
  sharePlatformDocument,
  sharePlatformDocumentBulk,
  updatePlatformDocumentKind,
} from "./actions";
import { PLATFORM_KIND_LABELS, PLATFORM_KIND_OPTIONS } from "./kinds";

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

function sectionLabel(kind: string) {
  return PLATFORM_KIND_LABELS[kind] ?? documentKindLabel(kind);
}

export function PlatformDocumentLibrary({
  docs,
  owners,
}: {
  docs: PlatformDoc[];
  owners: OwnerOption[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const grouped = useMemo(() => {
    const map = new Map<string, PlatformDoc[]>();
    for (const doc of docs) {
      const key = doc.kind || "other";
      const list = map.get(key) ?? [];
      list.push(doc);
      map.set(key, list);
    }
    return map;
  }, [docs]);

  const orderedKinds = [
    ...SECTION_ORDER.filter((kind) => grouped.has(kind)),
    ...Array.from(grouped.keys()).filter(
      (kind) => !SECTION_ORDER.includes(kind as (typeof SECTION_ORDER)[number]),
    ),
  ];

  const allIds = docs.map((doc) => doc.id);
  const selectedCount = selected.size;
  const allSelected = allIds.length > 0 && selectedCount === allIds.length;
  const selectedCsv = Array.from(selected).join(",");

  function toggleOne(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((current) => {
      if (current.size === allIds.length) return new Set();
      return new Set(allIds);
    });
  }

  function toggleSection(ids: string[]) {
    setSelected((current) => {
      const next = new Set(current);
      const allInSection = ids.every((id) => next.has(id));
      if (allInSection) {
        for (const id of ids) next.delete(id);
      } else {
        for (const id of ids) next.add(id);
      }
      return next;
    });
  }

  if (!docs.length) {
    return <p className="text-sm text-[var(--muted)]">No platform documents uploaded yet.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} />
            {selectedCount
              ? `${selectedCount} selected`
              : `Select documents (${docs.length})`}
          </label>
          {selectedCount ? (
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Clear selection
            </button>
          ) : null}
        </div>

        {selectedCount ? (
          <div className="grid gap-4 border-t border-[var(--border)] pt-4 lg:grid-cols-2">
            <form action={bulkUpdatePlatformDocumentKinds} className="space-y-3">
              <input type="hidden" name="document_ids_csv" value={selectedCsv} />
              <h3 className="text-sm font-semibold">Change document type</h3>
              <select
                name="kind"
                required
                defaultValue=""
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
              >
                <option value="" disabled>
                  Choose new type…
                </option>
                {PLATFORM_KIND_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
              >
                Update type for {selectedCount} file{selectedCount === 1 ? "" : "s"}
              </button>
            </form>

            <div className="space-y-4">
              <form action={bulkSharePlatformDocuments} className="space-y-3">
                <input type="hidden" name="document_ids_csv" value={selectedCsv} />
                <input type="hidden" name="share_mode" value="one" />
                <h3 className="text-sm font-semibold">Share selected with one landlord</h3>
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
                  placeholder="Optional message"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="notify" defaultChecked />
                  Email landlord
                </label>
                <button
                  type="submit"
                  className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
                >
                  Share {selectedCount} file{selectedCount === 1 ? "" : "s"}
                </button>
              </form>

              <form action={bulkSharePlatformDocuments} className="space-y-3">
                <input type="hidden" name="document_ids_csv" value={selectedCsv} />
                <input type="hidden" name="share_mode" value="all" />
                <h3 className="text-sm font-semibold">Share selected with all landlords</h3>
                <p className="text-xs text-[var(--muted)]">
                  Sends {selectedCount} file{selectedCount === 1 ? "" : "s"} to {owners.length}{" "}
                  landlord{owners.length === 1 ? "" : "s"}.
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
        ) : (
          <p className="text-sm text-[var(--muted)]">
            Check files below to change their type or share them in bulk.
          </p>
        )}
      </div>

      {orderedKinds.map((kind) => {
        const sectionDocs = grouped.get(kind) ?? [];
        const sectionIds = sectionDocs.map((doc) => doc.id);
        const sectionSelected =
          sectionIds.length > 0 && sectionIds.every((id) => selected.has(id));
        const sectionPartial =
          sectionIds.some((id) => selected.has(id)) && !sectionSelected;

        return (
          <details
            key={kind}
            className="group/section rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm open:shadow-md"
          >
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
              <div className="flex min-w-0 items-center gap-3">
                <input
                  type="checkbox"
                  checked={sectionSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = sectionPartial;
                  }}
                  onChange={() => toggleSection(sectionIds)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Select all ${sectionLabel(kind)} files`}
                />
                <div>
                  <p className="text-base font-semibold">{sectionLabel(kind)}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {sectionDocs.length} file{sectionDocs.length === 1 ? "" : "s"}
                    {sectionPartial || sectionSelected
                      ? ` · ${sectionIds.filter((id) => selected.has(id)).length} selected`
                      : ""}
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium text-[var(--accent)] group-open/section:hidden">
                Open section ▾
              </span>
              <span className="hidden text-xs font-medium text-[var(--muted)] group-open/section:inline">
                Close section ▴
              </span>
            </summary>

            <div className="space-y-2 border-t border-[var(--border)] px-3 py-3">
              {sectionDocs.map((doc) => (
                <details
                  key={doc.id}
                  className="group rounded-xl border border-[var(--border)] bg-[var(--background)] open:shadow-sm"
                >
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selected.has(doc.id)}
                        onChange={() => toggleOne(doc.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1"
                        aria-label={`Select ${doc.filename}`}
                      />
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
                        Edit / share ▾
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

                    <form
                      action={updatePlatformDocumentKind}
                      className="flex flex-wrap items-end gap-3 rounded-xl border border-[var(--border)] p-4"
                    >
                      <input type="hidden" name="document_id" value={doc.id} />
                      <div className="min-w-[200px] flex-1">
                        <label className="text-sm font-medium">Document type</label>
                        <select
                          name="kind"
                          defaultValue={doc.kind}
                          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                        >
                          {PLATFORM_KIND_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="submit"
                        className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold"
                      >
                        Save type
                      </button>
                    </form>

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
          </details>
        );
      })}
    </div>
  );
}
