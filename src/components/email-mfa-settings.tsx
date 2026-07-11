"use client";

import {
  cancelMfaSetup,
  confirmDisableEmailMfa,
  confirmEnableEmailMfa,
  startDisableEmailMfa,
  startEnableEmailMfa,
} from "@/app/auth/mfa-actions";

export function EmailMfaSettings({
  enabled,
  email,
  returnTo,
  mode,
  error,
}: {
  enabled: boolean;
  email: string;
  returnTo: string;
  mode?: string | null;
  error?: string | null;
}) {
  const confirmingEnable = mode === "enable";
  const confirmingDisable = mode === "disable";

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Email multi-factor authentication</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            When enabled, signing in with your password also requires a one-time code sent to{" "}
            <span className="font-medium text-[var(--foreground)]">{email}</span>.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            enabled ? "bg-emerald-100 text-emerald-800" : "bg-[var(--muted-bg)] text-[var(--muted)]"
          }`}
        >
          {enabled ? "On" : "Off"}
        </span>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}

      {confirmingEnable ? (
        <form action={confirmEnableEmailMfa} className="mt-4 space-y-3">
          <input type="hidden" name="return_to" value={returnTo} />
          <p className="text-sm text-[var(--muted)]">
            Enter the 6-digit code we just emailed you to turn MFA on.
          </p>
          <input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            placeholder="000000"
            className="w-full max-w-xs rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-center text-lg tracking-[0.35em]"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
            >
              Confirm and enable
            </button>
            <button
              formAction={cancelMfaSetup}
              name="return_to"
              value={returnTo}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : confirmingDisable ? (
        <form action={confirmDisableEmailMfa} className="mt-4 space-y-3">
          <input type="hidden" name="return_to" value={returnTo} />
          <p className="text-sm text-[var(--muted)]">
            Enter the 6-digit code we just emailed you to turn MFA off.
          </p>
          <input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            placeholder="000000"
            className="w-full max-w-xs rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-center text-lg tracking-[0.35em]"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
            >
              Confirm and disable
            </button>
            <button
              formAction={cancelMfaSetup}
              name="return_to"
              value={returnTo}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : enabled ? (
        <form action={startDisableEmailMfa} className="mt-4">
          <input type="hidden" name="return_to" value={returnTo} />
          <button
            type="submit"
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold"
          >
            Turn off email MFA
          </button>
        </form>
      ) : (
        <form action={startEnableEmailMfa} className="mt-4">
          <input type="hidden" name="return_to" value={returnTo} />
          <button
            type="submit"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
          >
            Turn on email MFA
          </button>
        </form>
      )}
    </section>
  );
}
