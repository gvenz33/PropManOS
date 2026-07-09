"use client";

import { PasswordInput } from "@/components/password-input";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function verifySession() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setCheckingSession(false);
          setMessage("This reset link is invalid or has expired.");
          return;
        }
        window.history.replaceState({}, "", "/reset-password");
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCheckingSession(false);
      if (user) {
        setReady(true);
        return;
      }
      setMessage("This reset link is invalid or has expired.");
    }

    void verifySession();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (checkingSession) {
    return <p className="text-sm text-[var(--muted)]">Verifying reset link…</p>;
  }

  if (!ready) {
    return (
      <div className="space-y-4">
        {message ? (
          <p className="text-sm text-[var(--danger)]" role="alert">
            {message}
          </p>
        ) : null}
        <Link
          href="/forgot-password"
          className="inline-flex w-full items-center justify-center rounded-lg bg-[var(--accent)] py-2.5 text-sm font-semibold text-white"
        >
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PasswordInput
        id="password"
        name="password"
        label="New password"
        autoComplete="new-password"
        required
        minLength={8}
        value={password}
        onChange={setPassword}
      />
      <PasswordInput
        id="confirmPassword"
        name="confirmPassword"
        label="Confirm new password"
        autoComplete="new-password"
        required
        minLength={8}
        value={confirmPassword}
        onChange={setConfirmPassword}
      />
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
        {loading ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}
