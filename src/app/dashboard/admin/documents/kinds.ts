export const PLATFORM_KIND_OPTIONS = [
  { value: "other", label: "Resource / guide" },
  { value: "notice", label: "Notice template" },
  { value: "lease", label: "Lease template" },
  { value: "rental_application", label: "Application template" },
] as const;

export const PLATFORM_KIND_LABELS: Record<string, string> = Object.fromEntries(
  PLATFORM_KIND_OPTIONS.map((option) => [option.value, option.label]),
);
