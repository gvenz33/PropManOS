"use server";

import { sendPasswordResetEmail } from "@/lib/auth/password-reset-email";
import { redirect } from "next/navigation";

function forgotPasswordPath(query?: string) {
  return `/forgot-password${query ? `?${query}` : ""}`;
}

export async function requestPasswordReset(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) {
    redirect(forgotPasswordPath(`error=${encodeURIComponent("Enter your email address.")}`));
  }

  const result = await sendPasswordResetEmail(email);

  if (!result.ok) {
    redirect(
      forgotPasswordPath(
        `error=${encodeURIComponent(result.error ?? "Could not send reset email. Try again later.")}`,
      ),
    );
  }

  redirect(forgotPasswordPath("success=sent"));
}
