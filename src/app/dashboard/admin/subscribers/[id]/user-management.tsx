import { PasswordInput } from "@/components/password-input";
import {
  MANAGEABLE_FEATURES,
  SUBSCRIPTION_PLANS,
  type ManageableFeature,
  type SubscriptionPlan,
} from "@/lib/plans";
import {
  deleteSubscriber,
  sendSubscriberPasswordReset,
  setSubscriberTemporaryPassword,
  updateSubscriberFeatures,
  updateSubscriberPlan,
  updateSubscriberProfile,
} from "../../actions";

type Props = {
  profileId: string;
  fullName: string;
  email: string;
  phone: string;
  plan: SubscriptionPlan;
  overrides: Partial<Record<ManageableFeature, boolean>>;
  effectiveFeatures: Record<ManageableFeature, boolean>;
  isSelf: boolean;
};

export function UserManagementForms({
  profileId,
  fullName,
  email,
  phone,
  plan,
  overrides,
  effectiveFeatures,
  isSelf,
}: Props) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Profile</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Update display name, contact email, and phone number.
        </p>
        <form action={updateSubscriberProfile} className="mt-4 space-y-4">
          <input type="hidden" name="profile_id" value={profileId} />
          <div>
            <label htmlFor="full_name" className="text-sm font-medium">
              Full name
            </label>
            <input
              id="full_name"
              name="full_name"
              defaultValue={fullName}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={email}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="phone" className="text-sm font-medium">
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={phone}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
          >
            Save profile
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Subscription plan</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Change the account&apos;s subscription tier.
        </p>
        <form action={updateSubscriberPlan} className="mt-4 space-y-4">
          <input type="hidden" name="profile_id" value={profileId} />
          <select
            name="subscription_plan"
            defaultValue={plan}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          >
            {(Object.keys(SUBSCRIPTION_PLANS) as SubscriptionPlan[]).map((key) => (
              <option key={key} value={key}>
                {SUBSCRIPTION_PLANS[key].label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
          >
            Update plan
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Feature access</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Override individual features for this account. Checked boxes apply directly; unchecked
          boxes follow the plan default.
        </p>
        <form action={updateSubscriberFeatures} className="mt-4 space-y-3">
          <input type="hidden" name="profile_id" value={profileId} />
          <input type="hidden" name="subscription_plan" value={plan} />
          {(Object.keys(MANAGEABLE_FEATURES) as ManageableFeature[]).map((key) => (
            <label key={key} className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                name={`feature_${key}`}
                defaultChecked={effectiveFeatures[key]}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium">{MANAGEABLE_FEATURES[key]}</span>
                <span className="block text-xs text-[var(--muted)]">
                  Effective: {effectiveFeatures[key] ? "Enabled" : "Disabled"}
                </span>
              </span>
            </label>
          ))}
          <button
            type="submit"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
          >
            Save features
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Password</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Send a reset email or set a temporary password the user can change after signing in.
        </p>
        <div className="mt-4 space-y-6">
          <form action={sendSubscriberPasswordReset}>
            <input type="hidden" name="profile_id" value={profileId} />
            <button
              type="submit"
              disabled={!email}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              Send password reset email
            </button>
          </form>

          {!isSelf ? (
            <form action={setSubscriberTemporaryPassword} className="space-y-4">
              <input type="hidden" name="profile_id" value={profileId} />
              <PasswordInput
                id="temporary_password"
                name="temporary_password"
                label="Set temporary password"
                autoComplete="new-password"
                required
                minLength={8}
              />
              <button
                type="submit"
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
              >
                Set temporary password
              </button>
            </form>
          ) : null}
        </div>
      </section>

      {!isSelf ? (
        <section className="rounded-2xl border border-red-200 bg-red-50/50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-red-900">Delete account</h2>
          <p className="mt-1 text-sm text-red-800">
            Permanently remove this user and their profile. This cannot be undone if the account
            has payment or lease records that block deletion.
          </p>
          <form action={deleteSubscriber} className="mt-4 space-y-4">
            <input type="hidden" name="profile_id" value={profileId} />
            <div>
              <label htmlFor="confirm_email" className="text-sm font-medium text-red-900">
                Type <span className="font-mono">{email}</span> to confirm
              </label>
              <input
                id="confirm_email"
                name="confirm_email"
                type="email"
                required
                className="mt-1 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Delete account
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
