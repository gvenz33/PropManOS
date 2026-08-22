"use server";

import { resendSignupConfirmationEmail } from "@/lib/auth/signup-confirmation-email";

export async function resendConfirmationAction(
  _prev: { ok: boolean; message: string } | null,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const email = String(formData.get("email") ?? "").trim();
  const result = await resendSignupConfirmationEmail(email);
  if (!result.ok) {
    return { ok: false, message: result.error };
  }
  return {
    ok: true,
    message: "If that email is waiting for confirmation, we sent a new link.",
  };
}
