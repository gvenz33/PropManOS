export const DOCUMENT_CATEGORIES = ["internal", "rental_form"] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

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

export const INTERNAL_DOCUMENT_KINDS: DocumentKind[] = [
  "other",
  "notice",
  "receipt",
  "lease",
];

export const PROFILE_DOCUMENT_KINDS: DocumentKind[] = [
  "lease",
  "rental_application",
  "rental_agreement",
  "notice",
  "receipt",
  "other",
];

export const RENTAL_FORM_KINDS: DocumentKind[] = [
  "rental_application",
  "rental_agreement",
  "lease",
  "notice",
  "other",
];

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  internal: "Internal file",
  rental_form: "Rental form",
};

export const NOTICE_TYPES = ["3_day", "30_day", "60_day"] as const;
export type NoticeType = (typeof NOTICE_TYPES)[number];

export const NOTICE_TYPE_LABELS: Record<NoticeType, string> = {
  "3_day": "3-day notice (pay rent or quit)",
  "30_day": "30-day notice (terminate tenancy)",
  "60_day": "60-day notice (terminate tenancy)",
};

export function noticeTypeLabel(value: string) {
  return NOTICE_TYPE_LABELS[value as NoticeType] ?? value;
}

export function documentKindLabel(kind: string): string {
  return DOCUMENT_KIND_LABELS[kind as DocumentKind] ?? kind;
}

export function kindOptionsFrom(values: DocumentKind[]) {
  return values.map((value) => ({ value, label: documentKindLabel(value) }));
}
