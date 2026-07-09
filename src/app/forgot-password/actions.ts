"use server";

import { BRAND } from "@/lib/brand";
import { sendEmail } from "@/lib/notifications/outbound";
import { authCallbackUrl } from "@/lib/site-url";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";

function forgotPasswordPath(query?: string) {
  return `/forgot-password${query ? `?${query}` : ""}`;
}

export async function requestPasswordReset(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) {
    redirect(forgotPasswordPath(`error=${encodeURIComponent("Enter your email address.")}`));
  }

  const service = createServiceClient();
  if (!service) {
    redirect(
      forgotPasswordPath(
        `error=${encodeURIComponent("Password reset is temporarily unavailable.")}`,
      ),
    );
  }

  const { data, error } = await service.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo: authCallbackUrl("/reset-password"),
    },
  });

  if (error || !data?.properties?.action_link) {
    redirect(forgotPasswordPath("success=sent"));
  }

  const resetLink = data.properties.action_link;
  const emailResult = await sendEmail(
    email,
    `Reset your ${BRAND.name} password`,
    `Hello,

We received a request to reset your password for ${BRAND.name}.

Open this link to choose a new password:
${resetLink}

If you did not request this, you can ignore this email.

— ${BRAND.name}`,
    undefined,
    `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#0f2942;">
  <p>Hello,</p>
  <p>We received a request to reset your password for ${BRAND.name}.</p>
  <p><a href="${resetLink}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">Reset password</a></p>
  <p style="font-size:13px;color:#64748b;">If the button does not work, copy and paste this link into your browser:<br/><a href="${resetLink}">${resetLink}</a></p>
  <p style="font-size:13px;color:#64748b;">If you did not request this, you can ignore this email.</p>
</div>`,
  );

  if (!emailResult.ok) {
    redirect(
      forgotPasswordPath(
        `error=${encodeURIComponent(emailResult.error ?? "Could not send reset email. Try again later.")}`,
      ),
    );
  }

  redirect(forgotPasswordPath("success=sent"));
}
