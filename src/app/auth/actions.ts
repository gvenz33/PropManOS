"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function safeReturnPath(path: string) {
  if (!path.startsWith("/") || path.startsWith("//")) return "/dashboard";
  return path;
}

export async function changePassword(formData: FormData): Promise<void> {
  const currentPassword = String(formData.get("current_password") ?? "");
  const newPassword = String(formData.get("new_password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");
  const returnTo = safeReturnPath(String(formData.get("return_to") ?? "/dashboard"));

  if (newPassword.length < 8) {
    redirect(`${returnTo}?error=${encodeURIComponent("New password must be at least 8 characters.")}`);
  }
  if (newPassword !== confirmPassword) {
    redirect(`${returnTo}?error=${encodeURIComponent("New passwords do not match.")}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login");

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyError) {
    redirect(`${returnTo}?error=${encodeURIComponent("Current password is incorrect.")}`);
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`${returnTo}?success=password-changed`);
}
