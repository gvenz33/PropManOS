import { ActionMessage } from "@/components/action-message";
import { ChangePasswordForm } from "@/components/change-password-form";
import { EmailMfaSettings } from "@/components/email-mfa-settings";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string; mfa?: string }>;
}) {
  const { success, error, mfa } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email, email_mfa_enabled")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account settings</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Manage your admin account security.
        </p>
      </div>

      <ActionMessage success={success} error={mfa ? null : error} />

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Signed in as</h2>
        <p className="mt-2 text-sm">
          {profile.full_name || "Site admin"}
          <br />
          <span className="text-[var(--muted)]">{profile.email ?? user.email}</span>
        </p>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Change password</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Enter your current password, then choose a new one.
        </p>
        <div className="mt-4">
          <ChangePasswordForm returnTo="/dashboard/admin/settings" />
        </div>
      </section>

      <EmailMfaSettings
        enabled={Boolean(profile.email_mfa_enabled || user.app_metadata?.email_mfa)}
        email={profile.email ?? user.email ?? ""}
        returnTo="/dashboard/admin/settings"
        mode={mfa}
        error={mfa ? error : null}
      />
    </div>
  );
}
