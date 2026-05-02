import Link from "next/link";

export default function TenantDashboardFaqPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Tenant FAQ</h1>
      <p className="text-[var(--muted)]">
        This mirrors the public FAQ with quick links while you&apos;re signed in.
      </p>
      <ul className="list-disc space-y-2 pl-5 text-sm text-[var(--muted)]">
        <li>Pay rent from Invoices when your landlord enables card/ACH.</li>
        <li>Bank linking uses a secure modal from our payments partner — never your password here.</li>
        <li>Reminders can arrive by email or SMS — keep contact info current in your profile (coming soon).</li>
      </ul>
      <p>
        <Link href="/faq/tenants" className="text-[var(--accent)] hover:underline">
          Full tenant FAQ →
        </Link>
      </p>
    </div>
  );
}
