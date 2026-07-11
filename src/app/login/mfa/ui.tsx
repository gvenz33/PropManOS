"use client";

import { sendLoginMfaCode, verifyLoginMfaCode } from "@/app/auth/mfa-actions";
import { useEffect, useState, useTransition } from "react";

export function LoginMfaForm({
  nextPath,
  initialError,
}: {
  nextPath: string;
  initialError?: string | null;
}) {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(initialError ?? null);
  const [sentNote, setSentNote] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    if (bootstrapped) return;
    setBootstrapped(true);
    startTransition(async () => {
      const result = await sendLoginMfaCode();
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setSentNote("We sent a 6-digit code to your email.");
    });
  }, [bootstrapped]);

  function resend() {
    setMessage(null);
    startTransition(async () => {
      const result = await sendLoginMfaCode();
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setSentNote("A new code was sent to your email.");
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted)]">
        Enter the verification code we emailed you to finish signing in.
      </p>
      {sentNote ? <p className="text-sm text-[var(--foreground)]">{sentNote}</p> : null}
      <form action={verifyLoginMfaCode} className="space-y-4">
        <input type="hidden" name="next" value={nextPath} />
        <div>
          <label htmlFor="code" className="block text-sm font-medium">
            Verification code
          </label>
          <input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-center text-lg tracking-[0.35em] outline-none ring-[var(--accent)] focus:ring-2"
            placeholder="000000"
          />
        </div>
        {message ? (
          <p className="text-sm text-[var(--danger)]" role="alert">
            {message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending || code.length !== 6}
          className="w-full rounded-lg bg-[var(--accent)] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          Verify and continue
        </button>
      </form>
      <button
        type="button"
        onClick={resend}
        disabled={pending}
        className="w-full text-sm font-medium text-[var(--accent)] hover:underline disabled:opacity-60"
      >
        {pending ? "Sending…" : "Resend code"}
      </button>
    </div>
  );
}
