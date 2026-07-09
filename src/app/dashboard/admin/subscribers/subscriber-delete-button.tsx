"use client";

import { deleteSubscriber } from "@/app/dashboard/admin/actions";
import { useEffect, useRef, useState } from "react";

export function SubscriberDeleteButton({
  profileId,
  email,
  name,
  disabled,
}: {
  profileId: string;
  email: string;
  name: string;
  disabled?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  if (disabled) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-red-600 hover:underline"
      >
        Delete
      </button>

      <dialog
        ref={dialogRef}
        className="w-full max-w-md rounded-2xl border border-red-200 bg-[var(--card)] p-0 shadow-xl backdrop:bg-black/50"
        onClose={() => setOpen(false)}
      >
        <form action={deleteSubscriber} className="p-6">
          <input type="hidden" name="profile_id" value={profileId} />
          <h2 className="text-lg font-semibold text-red-900">Delete subscriber</h2>
          <p className="mt-2 text-sm text-red-800">
            Permanently remove <span className="font-medium">{name || email}</span>. This cannot be
            undone if the account has leases or payment records.
          </p>
          <div className="mt-4">
            <label htmlFor={`confirm_${profileId}`} className="text-sm font-medium text-red-900">
              Type <span className="font-mono">{email}</span> to confirm
            </label>
            <input
              id={`confirm_${profileId}`}
              name="confirm_email"
              type="email"
              required
              className="mt-1 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Delete account
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
