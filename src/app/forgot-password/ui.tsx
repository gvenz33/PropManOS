import { ActionMessage } from "@/components/action-message";
import { requestPasswordReset } from "./actions";

export function ForgotPasswordForm() {
  return (
    <form action={requestPasswordReset} className="space-y-4">
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
      <button
        type="submit"
        className="w-full rounded-lg bg-[var(--accent)] py-2.5 text-sm font-semibold text-white"
      >
        Send reset link
      </button>
    </form>
  );
}
