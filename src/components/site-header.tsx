import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

const nav = [
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Sign in" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <BrandLogo priority />
        <nav className="flex flex-wrap items-center justify-end gap-2 sm:gap-4">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-2 py-1.5 text-sm font-medium text-[var(--muted)] transition hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)] sm:px-3"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/sign-up"
            className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
