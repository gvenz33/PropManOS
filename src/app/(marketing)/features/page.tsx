import { CtaBand } from "@/components/marketing/cta-band";
import { FeatureIcon } from "@/components/marketing/feature-icon";
import { PageHero } from "@/components/marketing/page-hero";
import { BRAND } from "@/lib/brand";
import { marketingFeatures, roadmapFeatures } from "@/lib/marketing";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Features",
  description: `Explore ${BRAND.name} features — rent collection, maintenance, owner reports, and more.`,
};

const platformComparison = [
  { feature: "Easy setup", included: true },
  { feature: "Online payments (ACH, Zelle, Cash App)", included: true },
  { feature: "Online maintenance requests", included: true },
  { feature: "Email & text communications", included: true },
  { feature: "Tenant portal", included: true },
  { feature: "Monthly owner Excel reports", included: true },
  { feature: "Document management", included: true },
  { feature: "Prospect / CRM tracking", included: true },
  { feature: "Vacancy tracking", included: "partial" as const },
  { feature: "Full general ledger accounting", included: false },
  { feature: "Online rental applications", included: false },
  { feature: "Resident screening", included: false },
  { feature: "Listing syndication", included: false },
  { feature: "Online lease signing", included: false },
  { feature: "Vendor payments", included: false },
];

function CellValue({ value }: { value: boolean | "partial" }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center gap-1 font-medium text-[var(--accent)]">
        <FeatureIcon name="check" className="h-4 w-4" /> Included
      </span>
    );
  }
  if (value === "partial") {
    return <span className="text-amber-700 dark:text-amber-400">Partial</span>;
  }
  return <span className="text-[var(--muted)]">Planned</span>;
}

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        eyebrow="Features"
        title="Everything you need to manage rentals — without enterprise complexity"
        description={`${BRAND.name} covers rent collection, maintenance, documents, owner reporting, and tenant communication for independent landlords and property managers.`}
      />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {marketingFeatures.map((f) => (
            <div key={f.title} className="marketing-feature-card rounded-2xl p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-blue-dim)] text-[var(--brand-blue)]">
                <FeatureIcon name={f.icon} />
              </div>
              <h2 className="mt-4 font-semibold">{f.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="marketing-section-alt border-y border-[var(--border)] py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight">What&apos;s included today</h2>
          <p className="mt-2 max-w-3xl text-[var(--muted)]">
            A focused toolkit for small portfolios — rent, maintenance, documents, and owner
            reporting without bloated accounting suites.
          </p>
          <div className="mt-8 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--muted-bg)]">
                <tr>
                  <th className="px-6 py-4 font-semibold">Feature</th>
                  <th className="px-6 py-4 font-semibold text-[var(--brand-blue)]">
                    {BRAND.name}
                  </th>
                </tr>
              </thead>
              <tbody>
                {platformComparison.map((row) => (
                  <tr key={row.feature} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-6 py-4">{row.feature}</td>
                    <td className="px-6 py-4">
                      <CellValue value={row.included} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight">On our roadmap</h2>
        <p className="mt-2 max-w-3xl text-[var(--muted)]">
          Tell us what matters most on the{" "}
          <Link href="/contact" className="text-[var(--brand-blue)] hover:underline">
            contact page
          </Link>
          .
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roadmapFeatures.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-6"
            >
              <span className="rounded-full bg-[var(--brand-blue-dim)] px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-[var(--brand-blue)]">
                Coming soon
              </span>
              <h3 className="mt-3 font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <CtaBand />
    </>
  );
}
