"use client";

import { createSubscriber } from "@/app/dashboard/admin/actions";
import { ROLE_LABELS, type UserRole } from "@/lib/brand";
import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from "@/lib/plans";
import { PasswordInput } from "@/components/password-input";
import { useEffect, useRef, useState } from "react";

export function AddSubscriberPanel() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [sendInvite, setSendInvite] = useState(true);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
      >
        Add subscriber
      </button>

      <dialog
        ref={dialogRef}
        className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--card)] p-0 shadow-xl backdrop:bg-black/50"
        onClose={() => setOpen(false)}
      >
        <form action={createSubscriber} className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Add subscriber</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Create a landlord, tenant, or site admin account manually.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[var(--muted)] hover:text-[var(--foreground)]"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="add_full_name" className="text-sm font-medium">
                Full name
              </label>
              <input
                id="add_full_name"
                name="full_name"
                required
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="add_email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="add_email"
                name="email"
                type="email"
                required
                autoComplete="off"
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="add_phone" className="text-sm font-medium">
                Phone <span className="text-[var(--muted)]">(optional)</span>
              </label>
              <input
                id="add_phone"
                name="phone"
                type="tel"
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="add_role" className="text-sm font-medium">
                  Role
                </label>
                <select
                  id="add_role"
                  name="role"
                  defaultValue="owner"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                >
                  {(Object.keys(ROLE_LABELS) as UserRole[]).map((value) => (
                    <option key={value} value={value}>
                      {ROLE_LABELS[value]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="add_plan" className="text-sm font-medium">
                  Plan
                </label>
                <select
                  id="add_plan"
                  name="subscription_plan"
                  defaultValue="free"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                >
                  {(Object.keys(SUBSCRIPTION_PLANS) as SubscriptionPlan[]).map((key) => (
                    <option key={key} value={key}>
                      {SUBSCRIPTION_PLANS[key].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                name="send_invite"
                checked={sendInvite}
                onChange={(e) => setSendInvite(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium">Email password setup link</span>
                <span className="mt-0.5 block text-xs text-[var(--muted)]">
                  Recommended. Sends a reset link so they choose their own password.
                </span>
              </span>
            </label>

            {!sendInvite ? (
              <PasswordInput
                id="add_password"
                name="password"
                label="Temporary password"
                autoComplete="new-password"
                required
                minLength={8}
              />
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
            >
              Create account
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
