"use client";

import {
  addPlatformDocumentToLibrary,
  bulkAddPlatformDocumentsToLibrary,
  removePlatformDocumentFromLibrary,
} from "@/app/dashboard/owner/documents/resource-actions";
import { PLATFORM_KIND_LABELS, PLATFORM_KIND_OPTIONS, platformKindLabel } from "@/lib/documents";
import Link from "next/link";
import { useMemo, useState } from "react";

type CatalogDoc = {
  id: string;
  filename: string;
  kind: string;
  created_at: string;
  description: string | null;
  inLibrary: boolean;
};

const KIND_ORDER = PLATFORM_KIND_OPTIONS.map((option) => option.value);

export function ResourceCenter({ docs }: { docs: CatalogDoc[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const available = useMemo(() => docs.filter((doc) => !doc.inLibrary), [docs]);
  const grouped = useMemo(() => {
    const map = new Map<string, CatalogDoc[]>();
    for (const doc of docs) {
      const key = doc.kind || "other";
      const list = map.get(key) ?? [];
      list.push(doc);
      map.set(key, list);
    }
    return map;
  }, [docs]);

  const orderedKinds = [
    ...KIND_ORDER.filter((kind) => grouped.has(kind)),
    ...Array.from(grouped.keys()).filter((kind) => !KIND_ORDER.includes(kind as (typeof KIND_ORDER)[number])),
  ];

  const selectedAvailable = Array.from(selected).filter((id) =>
    available.some((doc) => doc.id === id),
  );

  function toggleOne(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSection(ids: string[]) {
    const addable = ids.filter((id) => available.some((doc) => doc.id === id));
    setSelected((current) => {
      const next = new Set(current);
      const allSelected = addable.every((id) => next.has(id));
      if (allSelected) {
        for (const id of addable) next.delete(id);
      } else {
        for (const id of addable) next.add(id);
      }
      return next;
    });
  }

  if (!docs.length) {
    return (
      <p className="text-sm text-[var(--muted)]">
        No platform resources are available yet. Check back after the site admin uploads documents.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {selectedAvailable.length ? (
        <form
          action={bulkAddPlatformDocumentsToLibrary}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm"
        >
          <input type="hidden" name="document_ids_csv" value={selectedAvailable.join(",")} />
          <p className="text-sm font-medium">
            {selectedAvailable.length} document{selectedAvailable.length === 1 ? "" : "s"} selected
          </p>
          <button
            type="submit"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
          >
            Add selected to my documents
          </button>
        </form>
      ) : null}

      <div className="space-y-3">
        {orderedKinds.map((kind) => {
          const sectionDocs = grouped.get(kind) ?? [];
          const addableIds = sectionDocs.filter((doc) => !doc.inLibrary).map((doc) => doc.id);
          const sectionSelected =
            addableIds.length > 0 && addableIds.every((id) => selected.has(id));

          return (
            <details
              key={kind}
              className="group/section rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm open:shadow-md"
            >
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                <div className="flex items-center gap-3">
                  {addableIds.length ? (
                    <input
                      type="checkbox"
                      checked={sectionSelected}
                      onChange={() => toggleSection(addableIds)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select all ${platformKindLabel(kind)}`}
                    />
                  ) : null}
                  <div>
                    <p className="font-semibold">
                      {PLATFORM_KIND_LABELS[kind] ?? platformKindLabel(kind)}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {sectionDocs.length} file{sectionDocs.length === 1 ? "" : "s"}
                      {addableIds.length
                        ? ` · ${addableIds.length} available to add`
                        : " · all in your library"}
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

              <ul className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
                {sectionDocs.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      {!doc.inLibrary ? (
                        <input
                          type="checkbox"
                          checked={selected.has(doc.id)}
                          onChange={() => toggleOne(doc.id)}
                          className="mt-1"
                          aria-label={`Select ${doc.filename}`}
                        />
                      ) : (
                        <span className="mt-1 w-4" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium">{doc.filename}</p>
                        <p className="text-xs text-[var(--muted)]">
                          Uploaded {new Date(doc.created_at).toLocaleString()}
                          {doc.inLibrary ? " · In your library" : ""}
                        </p>
                        {doc.description ? (
                          <p className="mt-1 text-xs text-[var(--muted)]">{doc.description}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/api/documents/${doc.id}/download`}
                        className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--muted-bg)]"
                      >
                        Download
                      </Link>
                      {doc.inLibrary ? (
                        <form action={removePlatformDocumentFromLibrary}>
                          <input type="hidden" name="document_id" value={doc.id} />
                          <button
                            type="submit"
                            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold"
                          >
                            Remove
                          </button>
                        </form>
                      ) : (
                        <form action={addPlatformDocumentToLibrary}>
                          <input type="hidden" name="document_id" value={doc.id} />
                          <button
                            type="submit"
                            className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white"
                          >
                            Add to my documents
                          </button>
                        </form>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </details>
          );
        })}
      </div>
    </div>
  );
}
