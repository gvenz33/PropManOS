export const DOCUMENT_KINDS = [
  "rental_application",
  "rental_agreement",
  "lease",
  "notice",
  "receipt",
  "other",
] as const;

export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export const DOCUMENT_KIND_LABELS: Record<DocumentKind, string> = {
  rental_application: "Rental application",
  rental_agreement: "Rental agreement",
  lease: "Lease",
  notice: "Notice",
  receipt: "Receipt",
  other: "Other",
};

export const TENANT_DOCUMENT_KINDS: DocumentKind[] = [
  "rental_application",
  "rental_agreement",
  "lease",
  "notice",
  "receipt",
  "other",
];

export const PROPERTY_DOCUMENT_KINDS: DocumentKind[] = [
  "notice",
  "receipt",
  "lease",
  "other",
];

export function documentKindLabel(kind: string): string {
  return DOCUMENT_KIND_LABELS[kind as DocumentKind] ?? kind;
}
