import { BRAND } from "@/lib/brand";
import Link from "next/link";

const items = [
  {
    q: "How do I connect bank accounts and payouts?",
    a: "Use the bank / payout note on each unit for manual tracking today. Plaid Link (for ACH) and Stripe Connect (for cards and payouts) integrate cleanly with Supabase Edge Functions — add keys from your Vercel project and we can automate transfers next.",
  },
  {
    q: "How do rent reminders work?",
    a: "Schedule Vercel Cron to POST /api/cron/reminders daily. Implement Resend for email and Twilio for SMS using the env vars in .env.example. Templates cover due in 3 days, due today, and late.",
  },
  {
    q: "How are tenants invited?",
    a: `Create a lease with the tenant’s email. When they sign up with the same email, ${BRAND.name} links the lease automatically so they only see their unit, invoices, and documents.`,
  },
  {
    q: "How do I waive a late fee?",
    a: "Open Rent & late fees, find the invoice, and tap Waive late fee. The ledger stays auditable while the tenant’s balance drops to rent-only.",
  },
  {
    q: "Where is my document history?",
    a: "Documents lists every upload with type and timestamp. Pair this with notification_log (service role) when you start sending automated notices.",
  },
];

export default function OwnerFaqPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Landlord & PM FAQ</h1>
        <p className="mt-1 text-[var(--muted)]">
          Logged-in help for operating {BRAND.name} day to day. Tenants see a separate FAQ in
          their portal and on the public site.
        </p>
      </div>
      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.q} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <h2 className="font-semibold text-[var(--foreground)]">{item.q}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.a}</p>
          </li>
        ))}
      </ul>
      <p className="text-sm text-[var(--muted)]">
        Public tenant FAQ:{" "}
        <Link href="/faq/tenants" className="text-[var(--accent)] hover:underline">
          /faq/tenants
        </Link>
        .
      </p>
    </div>
  );
}
