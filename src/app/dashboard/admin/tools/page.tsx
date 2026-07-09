import { BRAND } from "@/lib/brand";
import { isResendConfigured, parseDefaultFromEmail } from "@/lib/notifications/email-config";
import { isPlaidConfigured } from "@/lib/plaid/client";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminToolsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") redirect("/dashboard");

  const emailConfigured = isResendConfigured();
  const fromEmail = parseDefaultFromEmail();
  const plaidConfigured = isPlaidConfigured();
  const siteUrl = getSiteUrl();

  const statusItems = [
    {
      label: "Production site URL",
      ok: siteUrl.includes("gotmyrent.com"),
      detail: siteUrl,
    },
    {
      label: "Outbound email (Resend)",
      ok: emailConfigured,
      detail: emailConfigured ? fromEmail.address || "Configured" : "Missing API key or from address",
    },
    {
      label: "Bank payments (Plaid)",
      ok: plaidConfigured,
      detail: plaidConfigured
        ? `Configured (${process.env.PLAID_ENV ?? "sandbox"})`
        : "Not configured",
    },
    {
      label: "Supabase auth",
      ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      detail: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Connected" : "Missing URL",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform tools</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Operational utilities and configuration checks for {BRAND.name}.
        </p>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold">System status</h2>
        <ul className="mt-4 space-y-3">
          {statusItems.map((item) => (
            <li
              key={item.label}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border)] px-4 py-3"
            >
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-sm text-[var(--muted)]">{item.detail}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  item.ok
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-900"
                }`}
              >
                {item.ok ? "OK" : "Check"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Admin utilities</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--border)] p-4">
            <h3 className="font-medium">Export subscribers</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Download a CSV of all accounts with role, plan, and contact info.
            </p>
            <a
              href="/api/admin/export-subscribers"
              className="mt-3 inline-flex rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--muted-bg)]"
            >
              Download CSV
            </a>
          </div>
          <div className="rounded-xl border border-[var(--border)] p-4">
            <h3 className="font-medium">Password reset flow</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Open the public forgot-password page to test email delivery.
            </p>
            <Link
              href="/forgot-password"
              className="mt-3 inline-flex rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--muted-bg)]"
            >
              Test reset page
            </Link>
          </div>
          <div className="rounded-xl border border-[var(--border)] p-4">
            <h3 className="font-medium">Marketing site</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              View the public homepage and pricing content.
            </p>
            <Link
              href="/"
              className="mt-3 inline-flex rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--muted-bg)]"
            >
              Open homepage
            </Link>
          </div>
          <div className="rounded-xl border border-[var(--border)] p-4">
            <h3 className="font-medium">Supabase dashboard</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Open the database project for advanced auth and SQL operations.
            </p>
            <a
              href="https://supabase.com/dashboard/project/mfylqvjzlnhvurauckuz"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--muted-bg)]"
            >
              Open Supabase
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
