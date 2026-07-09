import { changePassword } from "@/app/auth/actions";
import { PasswordInput } from "@/components/password-input";

export function ChangePasswordForm({ returnTo }: { returnTo: string }) {
  return (
    <form action={changePassword} className="space-y-4">
      <input type="hidden" name="return_to" value={returnTo} />
      <PasswordInput
        id="current_password"
        name="current_password"
        label="Current password"
        autoComplete="current-password"
        required
      />
      <PasswordInput
        id="new_password"
        name="new_password"
        label="New password"
        autoComplete="new-password"
        required
        minLength={8}
      />
      <PasswordInput
        id="confirm_password"
        name="confirm_password"
        label="Confirm new password"
        autoComplete="new-password"
        required
        minLength={8}
      />
      <button
        type="submit"
        className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
      >
        Update password
      </button>
    </form>
  );
}
