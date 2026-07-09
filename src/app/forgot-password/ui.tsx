"use client";

import { createClient } from "@/lib/supabase/client";
import { authCallbackUrl } from "@/lib/site-url";
import { useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: authCallbackUrl("/reset-password"),
    });

    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }

    setSent(true);
    setMessage("If an account exists for that email, we sent a password reset link.");
  }

  return (
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
          disabled={sent}
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none ring-[var(--accent)] focus:ring-2 disabled:opacity-60"
        />
      </div>
      {message ? (
        <p
          className={`text-sm ${sent ? "text-[var(--foreground)]" : "text-[var(--danger)]"}`}
          role={sent ? "status" : "alert"}
        >
          {message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading || sent}
        className="w-full rounded-lg bg-[var(--accent)] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Sending…" : sent ? "Email sent" : "Send reset link"}
      </button>
    </form>
  );
}
