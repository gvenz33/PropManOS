import { FaqList } from "@/components/faq-list";
import { BRAND } from "@/lib/brand";
import { siteFaqs } from "@/lib/faqs";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ",
  description: `Frequently asked questions about ${BRAND.name} — getting started, payments, and support.`,
};

export default function SiteFaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-sm font-semibold text-[var(--accent)]">{BRAND.name}</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Frequently asked questions</h1>
      <p className="mt-4 text-[var(--muted)]">
        General questions about the platform. After you sign in, landlords and tenants each have
        their own FAQ in the dashboard with step-by-step help for their portal.
      </p>
      <FaqList items={siteFaqs} className="mt-10" />
      <p className="mt-10 text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[var(--accent)] hover:underline">
          Sign in
        </Link>{" "}
        and open FAQ from your dashboard menu. Need more help?{" "}
        <Link href="/contact" className="font-medium text-[var(--accent)] hover:underline">
          Contact us
        </Link>
        .
      </p>
    </div>
  );
}
