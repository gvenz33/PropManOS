"use client";

import { PasswordInput } from "@/components/password-input";
import Link from "next/link";
import { useActionState, useState } from "react";
import { signUpAction, type SignUpState } from "./actions";

const initialState: SignUpState | null = null;

export function SignUpForm({ defaultRole }: { defaultRole: "owner" | "tenant" }) {
  const [role, setRole] = useState<"owner" | "tenant">(defaultRole);
  const [state, formAction, pending] = useActionState(signUpAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <span className="block text-sm font-medium">I am a</span>
        <div className="mt-2 flex gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="role"
              value="owner"
              checked={role === "owner"}
              onChange={() => setRole("owner")}
            />
            Landlord / PM
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="role"
              value="tenant"
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
          name="fullName"
          required
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none ring-[var(--accent)] focus:ring-2"
        />
      </div>
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
      />
      {state?.message ? (
        <p
          className={`text-sm ${state.ok ? "text-[var(--muted)]" : "text-red-600"}`}
          role="status"
        >
          {state.message}
          {state.ok ? (
            <>
              {" "}
              <Link href="/login" className="font-medium text-[var(--accent)] hover:underline">
                Sign in
              </Link>
            </>
          ) : null}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-[var(--accent)] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create account"}
      </button>
    </form>
  );
}
