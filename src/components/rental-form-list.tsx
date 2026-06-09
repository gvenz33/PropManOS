import { documentKindLabel } from "@/lib/documents";
import Link from "next/link";
import { SendRentalForm, type FormRecipient } from "./send-rental-form";

type RentalFormRow = {
  id: string;
  filename: string;
  kind: string;
  created_at: string;
};

export function RentalFormList({
  forms,
  propertyId,
  recipients,
  emptyMessage = "No rental forms uploaded yet.",
}: {
  forms: RentalFormRow[];
  propertyId: string;
  recipients: FormRecipient[];
  emptyMessage?: string;
}) {
  if (!forms.length) {
    return <p className="text-sm text-[var(--muted)]">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-4">
      {forms.map((form) => (
        <li
          key={form.id}
          className="rounded-lg border border-[var(--border)] bg-[var(--muted-bg)]/30 p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium">{form.filename}</p>
              <p className="text-xs text-[var(--muted)]">
                {documentKindLabel(form.kind)} · {new Date(form.created_at).toLocaleString()}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/api/documents/${form.id}/download`}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--muted-bg)]"
              >
                Download
              </Link>
              <SendRentalForm
                documentId={form.id}
                documentName={form.filename}
                propertyId={propertyId}
                recipients={recipients}
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
