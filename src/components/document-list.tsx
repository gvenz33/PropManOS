import { deleteDocument } from "@/app/dashboard/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { documentKindLabel } from "@/lib/documents";
import Link from "next/link";

type DocumentRow = {
  id: string;
  filename: string;
  kind: string;
  created_at: string;
};

export function DocumentList({
  docs,
  emptyMessage = "No documents yet.",
  deletable = false,
  propertyId,
}: {
  docs: DocumentRow[];
  emptyMessage?: string;
  deletable?: boolean;
  propertyId?: string;
}) {
  if (!docs.length) {
    return <p className="text-sm text-[var(--muted)]">{emptyMessage}</p>;
  }

  return (
    <ul className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)]">
      {docs.map((d) => (
        <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-3 text-sm">
          <div>
            <p className="font-medium">{d.filename}</p>
            <p className="text-xs text-[var(--muted)]">
              {documentKindLabel(d.kind)} · {new Date(d.created_at).toLocaleString()}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/api/documents/${d.id}/download`}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--muted-bg)]"
            >
              Download
            </Link>
            {deletable ? (
              <form>
                <input type="hidden" name="document_id" value={d.id} />
                {propertyId ? <input type="hidden" name="property_id" value={propertyId} /> : null}
                <ConfirmSubmitButton
                  formAction={deleteDocument}
                  message={`Delete "${d.filename}"? This cannot be undone.`}
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
  );
}
