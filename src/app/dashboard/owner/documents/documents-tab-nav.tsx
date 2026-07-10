import Link from "next/link";

const tabs = [
  { key: "files", label: "Files" },
  { key: "forms", label: "Rental forms" },
  { key: "rental-documents", label: "Rental documents" },
  { key: "shared", label: "Resource center" },
] as const;

export type DocumentsTab = (typeof tabs)[number]["key"];

export function DocumentsTabNav({
  active,
  query,
}: {
  active: DocumentsTab;
  query?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-3">
      {tabs.map((tab) => {
        const params = new URLSearchParams();
        params.set("tab", tab.key);
        if (query) params.set("q", query);
        const href = `/dashboard/owner/documents?${params.toString()}`;
        return (
          <Link
            key={tab.key}
            href={href}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              active === tab.key
                ? "bg-[var(--accent)] text-white"
                : "border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--muted-bg)]"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
