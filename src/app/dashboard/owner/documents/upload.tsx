"use client";

import { DocumentUpload, kindOptionsFrom } from "@/components/document-upload";
import { DOCUMENT_KINDS } from "@/lib/documents";

export function OwnerDocumentUpload({
  leaseOptions,
}: {
  leaseOptions: { id: string; label: string }[];
}) {
  return (
    <DocumentUpload
      title="Upload"
      kindOptions={kindOptionsFrom([...DOCUMENT_KINDS])}
      leaseOptions={leaseOptions}
    />
  );
}
