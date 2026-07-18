import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

const nav = [
  { href: "/features", label: "Features" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Sign in" },
];

export function SiteHeader() {
  return (
    <header className="app-top-chrome sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <BrandLogo priority />
        <nav className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-[var(--muted)] transition hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)] sm:px-3"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/sign-up" className="btn-primary ml-1 px-3 py-1.5 sm:ml-2">
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
