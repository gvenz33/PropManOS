"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function clearConfirmParams() {
  window.history.replaceState({}, "", "/auth/confirm");
}

export function ConfirmEmailForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function verifyLink() {
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const type = params.get("type");
      const code = params.get("code");

      if (tokenHash && (type === "signup" || type === "email")) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type === "email" ? "email" : "signup",
        });
        if (error) {
          setChecking(false);
          setMessage("This confirmation link is invalid or has expired.");
          return;
        }
        clearConfirmParams();
      } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setChecking(false);
          setMessage("This confirmation link is invalid or has expired.");
          return;
        }
        clearConfirmParams();
      } else {
        setChecking(false);
        setMessage("This confirmation link is invalid or has expired.");
        return;
      }

      await supabase.auth.signOut();
      setChecking(false);
      router.push(`/login?success=email-confirmed&next=${encodeURIComponent(nextPath)}`);
      router.refresh();
    }

    void verifyLink();
  }, [nextPath, router]);

  if (checking) {
    return <p className="text-sm text-[var(--muted)]">Confirming your email…</p>;
  }

  return (
    <div className="space-y-4">
      {message ? (
        <p className="text-sm text-[var(--danger)]" role="alert">
          {message}
        </p>
      ) : null}
      <Link
        href="/sign-up"
        className="inline-flex w-full items-center justify-center rounded-lg bg-[var(--accent)] py-2.5 text-sm font-semibold text-white"
      >
        Create a new account
      </Link>
    </div>
  );
}
