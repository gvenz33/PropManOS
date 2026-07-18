import { ActionMessage } from "@/components/action-message";
import { BankConnectionCard } from "@/components/bank-connection-card";
import { ChangePasswordForm } from "@/components/change-password-form";
import { EmailMfaSettings } from "@/components/email-mfa-settings";
import { getActiveBankConnection } from "@/lib/plaid/bank-connections";
import { isPlaidConfigured } from "@/lib/plaid/client";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { updateTenantNotifications } from "../../actions";

export default async function TenantSettingsPage({
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
    .select("full_name, phone, email, notify_email, notify_sms, email_mfa_enabled")
    .eq("id", user.id)
    .maybeSingle();

  const plaidEnabled = isPlaidConfigured();
  const bankConnection = plaidEnabled
    ? await getActiveBankConnection(user.id, "payment")
    : null;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Manage how you pay rent and receive reminders.
        </p>
      </div>

      <ActionMessage success={success} error={mfa ? null : error} />

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Bank account</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Connect a checking account to pay rent by ACH at no fee. Card payments add a 4% fee paid
          by you.
        </p>
        <div className="mt-4">
          <BankConnectionCard
            purpose="payment"
            connection={bankConnection}
            configured={plaidEnabled}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Change password</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Update your sign-in password. You will need your current password.
        </p>
        <div className="mt-4">
          <ChangePasswordForm returnTo="/dashboard/tenant/settings" />
        </div>
      </section>

      <EmailMfaSettings
        enabled={Boolean(profile?.email_mfa_enabled || user.app_metadata?.email_mfa)}
        email={profile?.email ?? user.email ?? ""}
        returnTo="/dashboard/tenant/settings"
        mode={mfa}
        error={mfa ? error : null}
      />

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Notification preferences</h2>
        <form action={updateTenantNotifications} className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              value={profile?.email ?? user.email ?? ""}
              readOnly
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] px-3 py-2 text-sm text-[var(--muted)]"
            />
          </div>
          <div>
            <label htmlFor="phone" className="text-sm font-medium">
              Mobile number (for text reminders)
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={profile?.phone ?? ""}
              placeholder="+1 555 123 4567"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Send me reminders by</legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="notify_email"
                defaultChecked={profile?.notify_email ?? true}
              />
              Email
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="notify_sms"
                defaultChecked={profile?.notify_sms ?? true}
              />
              Text message (SMS)
            </label>
          </fieldset>
          <button
            type="submit"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
          >
            Save preferences
          </button>
        </form>
      </section>
    </div>
  );
}
