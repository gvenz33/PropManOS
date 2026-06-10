import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { BrandLogo } from "@/components/brand-logo";

const footerLinks = {
  Product: [
    { href: "/features", label: "Features" },
    { href: "/faq", label: "FAQ" },
    { href: "/sign-up", label: "Get started" },
  ],
  Account: [
    { href: "/login", label: "Sign in" },
    { href: "/sign-up?role=tenant", label: "Tenant sign up" },
    { href: "/contact", label: "Contact" },
  ],
};

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--brand-navy)] text-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <BrandLogo href={undefined} variant="icon" className="mb-4" />
            <p className="text-lg font-semibold">{BRAND.name}</p>
            <p className="mt-2 max-w-sm text-sm text-white/70">
              {BRAND.tagline} — {BRAND.description}
            </p>
          </div>
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <p className="text-sm font-semibold uppercase tracking-wider text-white/50">
                {heading}
              </p>
              <ul className="mt-4 space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/80 transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
      </div>
    </footer>
  );
}
