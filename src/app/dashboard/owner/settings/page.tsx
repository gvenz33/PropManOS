import { ActionMessage } from "@/components/action-message";
import { ChangePasswordForm } from "@/components/change-password-form";
import { BRAND } from "@/lib/brand";
import {
  isResendConfigured,
  parseDefaultFromEmail,
  previewFromAddress,
} from "@/lib/notifications/email-config";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { sendTestEmail, updateOwnerEmailSettings } from "../../actions";

export default async function OwnerSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { success, error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, email, email_sender_name, email_from_address, email_reply_to, email_signature",
    )
    .eq("id", user.id)
    .maybeSingle();

  const defaults = parseDefaultFromEmail();
  const resendConfigured = isResendConfigured();
  const fromPreview = previewFromAddress(profile);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Configure how invoices, documents, and reports are sent to tenants.
        </p>
      </div>

      <ActionMessage success={success} error={error} />

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Email delivery</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Outbound email is sent through Resend. Your API key is managed in Vercel; set your
              sender details here.
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              resendConfigured
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-900"
            }`}
          >
            {resendConfigured ? "Resend connected" : "Resend not configured"}
          </span>
        </div>

        {!resendConfigured ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Add <code className="font-mono text-xs">RESEND_API_KEY</code> and{" "}
            <code className="font-mono text-xs">NOTIFICATIONS_FROM_EMAIL</code> in your Vercel
            project environment variables, then redeploy. Verify your sending domain at{" "}
            <a
              href="https://resend.com/domains"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline"
            >
              resend.com/domains
            </a>
            .
          </div>
        ) : null}

        <form action={updateOwnerEmailSettings} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email_sender_name" className="text-sm font-medium">
              Sender name
            </label>
            <input
              id="email_sender_name"
              name="email_sender_name"
              type="text"
              defaultValue={profile?.email_sender_name ?? profile?.full_name ?? ""}
              placeholder={defaults.name ?? BRAND.name}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-[var(--muted)]">
              Shown to tenants as the name on invoice and document emails.
            </p>
          </div>

          <div>
            <label htmlFor="email_from_address" className="text-sm font-medium">
              From email address
            </label>
            <input
              id="email_from_address"
              name="email_from_address"
              type="email"
              defaultValue={profile?.email_from_address ?? ""}
              placeholder={defaults.address || "noreply@yourdomain.com"}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-[var(--muted)]">
              Must use a domain verified in Resend. Leave blank to use the default from Vercel (
              {defaults.address || "not set"}).
            </p>
          </div>

          <div>
            <label htmlFor="email_reply_to" className="text-sm font-medium">
              Reply-to email
            </label>
            <input
              id="email_reply_to"
              name="email_reply_to"
              type="email"
              defaultValue={profile?.email_reply_to ?? profile?.email ?? user.email ?? ""}
              placeholder={profile?.email ?? user.email ?? "you@example.com"}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-[var(--muted)]">
              Tenant replies go to this inbox instead of the no-reply sender.
            </p>
          </div>

          <div>
            <label htmlFor="email_signature" className="text-sm font-medium">
              Email signature
            </label>
            <textarea
              id="email_signature"
              name="email_signature"
              rows={3}
              defaultValue={profile?.email_signature ?? ""}
              placeholder={`Questions? Reply to this email or call your property manager.`}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-[var(--muted)]">
              Optional footer appended to invoice and document emails.
            </p>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] px-4 py-3 text-sm">
            <div className="font-medium">Preview</div>
            <div className="mt-1 text-[var(--muted)]">
              From: <span className="text-[var(--foreground)]">{fromPreview}</span>
            </div>
          </div>

          <button
            type="submit"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
          >
            Save email settings
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Change password</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Update your sign-in password. You will need your current password.
        </p>
        <div className="mt-4">
          <ChangePasswordForm returnTo="/dashboard/owner/settings" />
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Send test email</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Confirm delivery with your current settings before emailing tenants.
        </p>
        <form action={sendTestEmail} className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label htmlFor="test_email" className="text-sm font-medium">
              Send to
            </label>
            <input
              id="test_email"
              name="test_email"
              type="email"
              required
              defaultValue={profile?.email ?? user.email ?? ""}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm font-semibold"
          >
            Send test
          </button>
        </form>
      </section>
    </div>
  );
}
