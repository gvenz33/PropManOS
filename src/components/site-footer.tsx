import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--muted-bg)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-semibold text-[var(--foreground)]">
            Prop Man<span className="text-[var(--accent)]">OS</span>
          </p>
          <p className="mt-1 max-w-md text-sm text-[var(--muted)]">
            Property Management Operating System — rent collection, notices, and
            records in one calm dashboard.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/contact" className="text-[var(--muted)] hover:text-[var(--foreground)]">
            Contact
          </Link>
          <Link href="/faq/tenants" className="text-[var(--muted)] hover:text-[var(--foreground)]">
            Tenant FAQ
          </Link>
          <Link href="/login" className="text-[var(--muted)] hover:text-[var(--foreground)]">
            Sign in
          </Link>
        </div>
      </div>
      <div className="border-t border-[var(--border)] py-4 text-center text-xs text-[var(--muted)]">
        © {new Date().getFullYear()} Prop Man OS. All rights reserved.
      </div>
    </footer>
  );
}
