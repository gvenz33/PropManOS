import { PageHero } from "@/components/marketing/page-hero";
import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Contact",
  description: `Reach the ${BRAND.name} team for demos and support.`,
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Let's talk about your portfolio"
        description={`We're rolling out ${BRAND.name} with early partners. Tell us about your properties and we'll follow up with setup steps, bank integrations, and messaging providers.`}
      />
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-blue)]">
              Email
            </p>
            <a
              href={`mailto:${BRAND.supportEmail}`}
              className="mt-2 inline-block text-lg font-medium text-[var(--foreground)] hover:text-[var(--brand-blue)]"
            >
              {BRAND.supportEmail}
            </a>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Best for setup questions, feature requests, and partnership inquiries.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-blue)]">
              Feature requests
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Review our{" "}
              <Link href="/features" className="font-medium text-[var(--brand-blue)] hover:underline">
                features page
              </Link>{" "}
              to see what&apos;s live and what&apos;s on the roadmap — then tell us what you need
              most.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
