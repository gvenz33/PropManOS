"use client";

import { PasswordInput } from "@/components/password-input";
import { createClient } from "@/lib/supabase/client";
import { authCallbackUrl } from "@/lib/site-url";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignUpForm({ defaultRole }: { defaultRole: "owner" | "tenant" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"owner" | "tenant">(defaultRole);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: authCallbackUrl("/dashboard"),
        data: { full_name: fullName, role },
      },
    });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("Check your email to confirm your account, then sign in.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <span className="block text-sm font-medium">I am a</span>
        <div className="mt-2 flex gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="role"
              checked={role === "owner"}
              onChange={() => setRole("owner")}
            />
            Landlord / PM
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="role"
              checked={role === "tenant"}
              onChange={() => setRole("tenant")}
            />
            Tenant
          </label>
        </div>
      </div>
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium">
          Full name
        </label>
        <input
          id="fullName"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none ring-[var(--accent)] focus:ring-2"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none ring-[var(--accent)] focus:ring-2"
        />
      </div>
      <PasswordInput
        id="password"
        name="password"
        label="Password"
        autoComplete="new-password"
        required
        minLength={8}
        value={password}
        onChange={setPassword}
      />
      {message ? (
        <p className="text-sm text-[var(--muted)]" role="status">
          {message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[var(--accent)] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Creating…" : "Create account"}
      </button>
    </form>
  );
}
