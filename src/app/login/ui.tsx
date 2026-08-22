"use client";

import { PasswordInput } from "@/components/password-input";
import { profileRequiresEmailMfa } from "@/lib/auth/mfa-policy";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { resendConfirmationAction } from "./resend-confirmation";

const initialResendState: { ok: boolean; message: string } | null = null;

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resendState, resendAction, resendPending] = useActionState(
    resendConfirmationAction,
    initialResendState,
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setNeedsConfirmation(false);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      setMessage(error.message);
      if (/confirm/i.test(error.message)) {
        setNeedsConfirmation(true);
      }
      return;
    }

    let mfaRequired = isEmailMfaEnabled(data.user);
    if (!mfaRequired && data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, email_mfa_enabled")
        .eq("id", data.user.id)
        .maybeSingle();
      mfaRequired = profileRequiresEmailMfa(profile);
    }

    if (mfaRequired) {
      setLoading(false);
      router.push(`/login/mfa?next=${encodeURIComponent(nextPath)}`);
      router.refresh();
      return;
    }

    setLoading(false);
    router.push(nextPath);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none ring-[var(--accent)] focus:ring-2"
          />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between gap-3">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Link href="/forgot-password" className="text-sm text-[var(--accent)] hover:underline">
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            name="password"
            label=""
            autoComplete="current-password"
            required
            value={password}
            onChange={setPassword}
          />
        </div>
        {message ? (
          <p className="text-sm text-[var(--danger)]" role="alert">
            {message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[var(--accent)] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {needsConfirmation ? (
        <form action={resendAction} className="rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] p-4 space-y-3">
          <p className="text-sm text-[var(--muted)]">
            Need a new confirmation link? We can resend it to your email.
          </p>
          <input type="hidden" name="email" value={email} />
          {resendState?.message ? (
            <p className={`text-sm ${resendState.ok ? "text-[var(--foreground)]" : "text-[var(--danger)]"}`}>
              {resendState.message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={resendPending || !email}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-2 text-sm font-semibold disabled:opacity-60"
          >
            {resendPending ? "Sending…" : "Resend confirmation email"}
          </button>
        </form>
      ) : null}
    </div>
  );
}

function isEmailMfaEnabled(user: { app_metadata?: Record<string, unknown> } | null | undefined) {
  return user?.app_metadata?.email_mfa === true;
}
