import { FaqList } from "@/components/faq-list";
import { PageHero } from "@/components/marketing/page-hero";
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
    <>
      <PageHero
        eyebrow="Support"
        title="Frequently asked questions"
        description="General questions about the platform. After you sign in, landlords and tenants each have their own FAQ in the dashboard with step-by-step help for their portal."
      />
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <FaqList items={siteFaqs} />
        <p className="mt-10 text-sm text-[var(--muted)]">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[var(--brand-blue)] hover:underline">
            Sign in
          </Link>{" "}
          and open FAQ from your dashboard menu. Need more help?{" "}
          <Link href="/contact" className="font-medium text-[var(--brand-blue)] hover:underline">
            Contact us
          </Link>
          .
        </p>
      </div>
    </>
  );
}
