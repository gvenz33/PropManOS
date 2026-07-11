import { BRAND } from "@/lib/brand";
import Link from "next/link";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-blue)]">
        Legal
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">Last updated: {updated}</p>
      <div className="prose-legal mt-10 space-y-8 text-[15px] leading-relaxed text-[var(--foreground)]">
        {children}
      </div>
      <p className="mt-12 text-sm text-[var(--muted)]">
        Questions?{" "}
        <a
          href={`mailto:${BRAND.supportEmail}`}
          className="font-medium text-[var(--brand-blue)] hover:underline"
        >
          {BRAND.supportEmail}
        </a>{" "}
        or{" "}
        <Link href="/contact" className="font-medium text-[var(--brand-blue)] hover:underline">
          contact us
        </Link>
        .
      </p>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="space-y-3 text-[var(--muted)] [&_a]:font-medium [&_a]:text-[var(--brand-blue)] [&_a]:hover:underline [&_strong]:font-semibold [&_strong]:text-[var(--foreground)] [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
