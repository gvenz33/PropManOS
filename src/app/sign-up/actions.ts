"use server";

import { createAccountAndNotify } from "@/lib/auth/signup-confirmation-email";

export type SignUpState = {
  ok: boolean;
  message: string;
};

export async function signUpAction(
  _prev: SignUpState | null,
  formData: FormData,
): Promise<SignUpState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "owner");
  const role = roleRaw === "tenant" ? "tenant" : "owner";

  if (!fullName) {
    return { ok: false, message: "Enter your full name." };
  }
  if (!email) {
    return { ok: false, message: "Enter your email address." };
  }
  if (password.length < 8) {
    return { ok: false, message: "Password must be at least 8 characters." };
  }

  const result = await createAccountAndNotify({
    email,
    password,
    fullName,
    role,
  });

  if (!result.ok) {
    return { ok: false, message: result.error };
  }

  return {
    ok: true,
    message: result.message,
  };
}
