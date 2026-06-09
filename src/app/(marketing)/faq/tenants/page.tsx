import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Tenant FAQ",
  description: "How to pay rent, connect your bank, and use your tenant portal.",
};

const items = [
  {
    q: "How do I pay rent?",
    a: `Sign in to your ${BRAND.name} tenant dashboard. Open Invoices to see what is due. Your landlord can enable card or ACH depending on their processor — follow the Pay button when it appears. Until payments are connected, use the instructions your landlord shared (check, ACH, or portal transfer).`,
  },
  {
    q: "How do I link my bank account?",
    a: `When your landlord turns on bank linking (Plaid or similar), you will see a secure prompt inside the dashboard to connect your account. ${BRAND.name} never stores your bank password — only tokens from the provider.`,
  },
  {
    q: "When will I get reminders?",
    a: "You may receive email or text when rent is due in three days, due today, or if a payment is late. You can update your phone and email in your profile once logged in.",
  },
  {
    q: "Where do I see documents?",
    a: "The Documents section of your dashboard lists uploads and notices tied to your lease. Download anytime; new items appear as your landlord adds them.",
  },
  {
    q: "I forgot my password.",
    a: "On the sign-in page, use “Forgot password” (coming from your email provider via Supabase Auth) to reset. If you are stuck, contact your landlord or our support address on the Contact page.",
  },
];

export default function TenantFaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-sm font-semibold text-[var(--accent)]">For tenants</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Frequently asked questions</h1>
      <p className="mt-4 text-[var(--muted)]">
        Quick answers about paying rent and using your portal. Landlords have a
        separate FAQ inside their dashboard after signing in.
      </p>
      <ul className="mt-10 space-y-6">
        {items.map((item) => (
          <li
            key={item.q}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm"
          >
            <h2 className="font-semibold text-[var(--foreground)]">{item.q}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.a}</p>
          </li>
        ))}
      </ul>
      <p className="mt-10 text-sm text-[var(--muted)]">
        Need more help?{" "}
        <Link href="/contact" className="font-medium text-[var(--accent)] hover:underline">
          Contact us
        </Link>
        .
      </p>
    </div>
  );
}
