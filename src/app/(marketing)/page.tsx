import { CtaBand } from "@/components/marketing/cta-band";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { FeatureIcon } from "@/components/marketing/feature-icon";
import { FaqList } from "@/components/faq-list";
import { BRAND } from "@/lib/brand";
import { siteFaqs } from "@/lib/faqs";
import {
  comparisonRows,
  heroFeatures,
  landlordHighlights,
  marketingFeatures,
  pricingTiers,
  tenantHighlights,
  testimonial,
} from "@/lib/marketing";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; next?: string }>;
}) {
  const params = await searchParams;
  if (params.code) {
    const qs = new URLSearchParams({
      code: params.code,
      next: params.next ?? "/dashboard",
    });
    redirect(`/auth/callback?${qs.toString()}`);
  }

  return (
    <>
      <section className="marketing-hero border-b border-[var(--border)]">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--brand-blue)]">
              Refreshingly simple software
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-[3.25rem]">
              Property management that&apos;s easy to set up and easy to use
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[var(--muted)]">
              {BRAND.name} helps independent landlords and tenants manage rent, maintenance,
              documents, and reminders — without the complexity or per-unit minimums of enterprise
              tools.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {heroFeatures.map((f) => (
                <li
                  key={f}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs font-medium text-[var(--foreground)]"
                >
                  <FeatureIcon name="check" className="h-3.5 w-3.5 text-[var(--accent)]" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/sign-up" className="btn-primary">
                Start as a landlord
              </Link>
              <Link href="/sign-up?role=tenant" className="btn-secondary">
                I&apos;m a tenant
              </Link>
            </div>
          </div>
          <DashboardPreview />
        </div>
      </section>

      <section className="border-b border-[var(--border)] py-8">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 sm:grid-cols-3 sm:px-6">
          {[
            { value: "Minutes", label: "to set up your first property" },
            { value: "One portal", label: "for landlords and tenants" },
            { value: "From $49/mo", label: "Essential plan · up to 8 units" },
          ].map((stat) => (
            <div key={stat.label} className="marketing-stat-pill rounded-2xl p-5 text-center">
              <p className="text-2xl font-bold text-[var(--brand-blue)]">{stat.value}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-[var(--brand-blue)]">
            Discover what you can do
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Intuitive tools for rent, maintenance, and records
          </h2>
          <p className="mt-4 text-[var(--muted)]">
            Everything you need to run a small portfolio — rent collection, maintenance, owner
            reports, and records in one place.
          </p>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {marketingFeatures.map((f) => (
            <div key={f.title} className="marketing-feature-card rounded-2xl p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-blue-dim)] text-[var(--brand-blue)]">
                <FeatureIcon name={f.icon} />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{f.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-center">
          <Link href="/features" className="btn-outline-blue">
            View all features →
          </Link>
        </p>
      </section>

      <section className="marketing-section-alt border-y border-[var(--border)] py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-widest text-[var(--brand-blue)]">
                For landlords
              </p>
              <h3 className="mt-2 text-2xl font-bold">Run your portfolio from one dashboard</h3>
              <ul className="mt-6 space-y-3">
                {landlordHighlights.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-[var(--muted)]">
                    <FeatureIcon
                      name="check"
                      className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-widest text-[var(--brand-blue)]">
                For tenants
              </p>
              <h3 className="mt-2 text-2xl font-bold">A portal that makes rent day easier</h3>
              <ul className="mt-6 space-y-3">
                {tenantHighlights.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-[var(--muted)]">
                    <FeatureIcon
                      name="check"
                      className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Make work easier</h2>
          <p className="mt-4 text-[var(--muted)]">
            See how {BRAND.name} compares to managing rentals in spreadsheets.
          </p>
        </div>
        <div className="mt-10 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--muted-bg)]">
              <tr>
                <th className="px-6 py-4 font-semibold">Capability</th>
                <th className="px-6 py-4 font-semibold text-[var(--brand-blue)]">{BRAND.name}</th>
                <th className="px-6 py-4 font-semibold text-[var(--muted)]">Spreadsheets</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.feature} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-6 py-4">{row.feature}</td>
                  <td className="px-6 py-4">
                    {row.gotMyRent ? (
                      <span className="inline-flex items-center gap-1.5 font-medium text-[var(--accent)]">
                        <FeatureIcon name="check" className="h-4 w-4" /> Included
                      </span>
                    ) : (
                      <span className="text-[var(--muted)]">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-[var(--muted)]">
                    {row.spreadsheets ? "Sometimes" : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="marketing-section-alt border-y border-[var(--border)] py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <svg
            className="mx-auto h-10 w-10 text-[var(--brand-blue)]/40"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.996 3.638-3.996 7.404h4v7h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.432.917-3.996 3.638-3.996 7.404h3.983v7h-9.983z" />
          </svg>
          <blockquote className="mt-6 text-xl font-medium leading-relaxed">
            &ldquo;{testimonial.quote}&rdquo;
          </blockquote>
          <p className="mt-4 text-sm text-[var(--muted)]">
            — {testimonial.name}, {testimonial.role}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-[var(--brand-blue)]">
            Pricing
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">Simple, transparent pricing</h2>
          <p className="mt-4 text-[var(--muted)]">
            Two paid plans — Essential and Pro. ACH bank payments are free; card payments add a 4%
            fee paid by the tenant. Need more than 50 units? Contact us for custom pricing.
          </p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl border p-8 ${
                tier.featured
                  ? "marketing-pricing-featured bg-[var(--card)]"
                  : "border-[var(--border)] bg-[var(--card)]"
              }`}
            >
              <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-blue)]">
                {tier.name}
              </p>
              <p className="mt-3 text-4xl font-bold">{tier.price}</p>
              <p className="text-sm text-[var(--muted)]">{tier.period}</p>
              <p className="mt-4 text-sm text-[var(--muted)]">{tier.description}</p>
              <ul className="mt-6 space-y-2">
                {tier.highlights.map((h) => (
                  <li key={h} className="flex gap-2 text-sm">
                    <FeatureIcon
                      name="check"
                      className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]"
                    />
                    {h}
                  </li>
                ))}
              </ul>
              <Link
                href={tier.href}
                className={`mt-8 inline-flex ${tier.featured ? "btn-primary" : "btn-outline-blue"}`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Frequently asked questions</h2>
            <p className="mt-2 max-w-2xl text-[var(--muted)]">
              Quick answers about {BRAND.name}. Role-specific help lives in each dashboard after
              sign-in.
            </p>
          </div>
          <Link
            href="/faq"
            className="text-sm font-semibold text-[var(--brand-blue)] hover:underline"
          >
            View all FAQ →
          </Link>
        </div>
        <FaqList items={siteFaqs.slice(0, 4)} className="mt-8" />
      </section>

      <CtaBand />
    </>
  );
}
