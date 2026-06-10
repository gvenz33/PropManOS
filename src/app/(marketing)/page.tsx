import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FaqList } from "@/components/faq-list";
import { BRAND } from "@/lib/brand";
import { siteFaqs } from "@/lib/faqs";

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
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
            {BRAND.domain}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Rent collection, notices, and records — without the spreadsheet chaos.
          </h1>
          <p className="mt-6 text-lg text-[var(--muted)]">
            {BRAND.name} is built for independent landlords, property managers, and
            tenants: multiple properties and units, tenant portals, document history,
            late-fee control, and reminders by email or text when rent is almost due,
            due today, or late.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              Start as a landlord
            </Link>
            <Link
              href="/sign-up?role=tenant"
              className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--muted-bg)]"
            >
              I&apos;m a tenant
            </Link>
          </div>
        </div>
        <div className="flex justify-center lg:justify-end">
          <Image
            src={BRAND.logo}
            alt={`${BRAND.name} logo`}
            width={520}
            height={180}
            priority
            className="h-auto w-full max-w-md"
          />
        </div>
      </div>

      <section className="mt-24 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            title: "Portfolio-ready",
            body: "One account, many properties and units. Link leases to the right tenants.",
          },
          {
            title: "Smarter notices",
            body: "Payment due in 3 days, due today, and late alerts over email and SMS.",
          },
          {
            title: "Late fees you control",
            body: "Automatic late fees with one-click waive from your dashboard.",
          },
          {
            title: "Bank-ready",
            body: "Space to connect payouts and bank notes per unit as you add integrations.",
          },
          {
            title: "Paper trail",
            body: "Upload leases and notices; full history of what went out and what was filed.",
          },
          {
            title: "Lightweight CRM",
            body: "Track prospects and owners alongside active tenants and follow-ups.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm"
          >
            <h2 className="font-semibold text-[var(--foreground)]">{f.title}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{f.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Frequently asked questions</h2>
            <p className="mt-2 max-w-2xl text-[var(--muted)]">
              Quick answers about {BRAND.name}. Landlords and tenants get role-specific help inside
              their dashboard after signing in.
            </p>
          </div>
          <Link
            href="/faq"
            className="text-sm font-semibold text-[var(--accent)] hover:underline"
          >
            View all FAQ →
          </Link>
        </div>
        <FaqList items={siteFaqs.slice(0, 4)} className="mt-8" />
      </section>
    </div>
  );
}
