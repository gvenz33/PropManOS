"use client";

import { DocumentUpload } from "@/components/document-upload";
import { INTERNAL_DOCUMENT_KINDS, RENTAL_FORM_KINDS, kindOptionsFrom } from "@/lib/documents";

export function OwnerInternalUpload() {
  return (
    <DocumentUpload
      title="Upload internal file"
      category="internal"
      kindOptions={kindOptionsFrom(INTERNAL_DOCUMENT_KINDS)}
    />
  );
}

export function OwnerRentalFormUpload() {
  return (
    <DocumentUpload
      title="Upload rental form"
      category="rental_form"
      defaultKind="rental_application"
      kindOptions={kindOptionsFrom(RENTAL_FORM_KINDS)}
    />
  );
}
