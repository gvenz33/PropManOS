import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | Prop Man OS",
  description: "Reach the Prop Man OS team for demos and support.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Contact</h1>
      <p className="mt-4 text-[var(--muted)]">
        We&apos;re rolling out Prop Man OS with early partners. Tell us about
        your portfolio and we&apos;ll follow up with setup steps, bank
        integrations, and messaging providers.
      </p>
      <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <p className="text-sm font-medium text-[var(--foreground)]">Email</p>
        <a
          href="mailto:hello@propmanos.com"
          className="mt-1 inline-block text-[var(--accent)] hover:underline"
        >
          hello@propmanos.com
        </a>
        <p className="mt-6 text-sm text-[var(--muted)]">
          Replace this address with your production inbox in{" "}
          <code className="rounded bg-[var(--muted-bg)] px-1">src/app/(marketing)/contact/page.tsx</code>
          .
        </p>
      </div>
    </div>
  );
}
