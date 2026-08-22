import { BRAND } from "@/lib/brand";
import { sendEmail } from "@/lib/notifications/outbound";
import { getSiteUrl } from "@/lib/site-url";
import { createServiceClient } from "@/lib/supabase/service";
import { isResendConfigured } from "@/lib/notifications/email-config";

export type SignUpInput = {
  email: string;
  password: string;
  fullName: string;
  role: "owner" | "tenant";
};

/**
 * Creates the account via the Admin API (so Supabase Auth SMTP is never used),
 * marks the email confirmed, and sends a welcome email through Resend when configured.
 *
 * Production Auth SMTP is currently timing out on /signup confirmation emails;
 * routing signup through this path is what makes account creation reliable.
 */
export async function createAccountAndNotify(input: SignUpInput) {
  const service = createServiceClient();
  if (!service) {
    return {
      ok: false as const,
      error:
        "Sign up is temporarily unavailable. Missing server auth configuration (SUPABASE_SERVICE_ROLE_KEY).",
    };
  }

  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  const role = input.role === "owner" ? "owner" : "tenant";

  const { data, error } = await service.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  });

  if (error || !data.user) {
    const message = error?.message?.toLowerCase() ?? "";
    if (message.includes("already") || message.includes("registered")) {
      return {
        ok: false as const,
        error: "An account with this email already exists. Sign in or reset your password.",
      };
    }
    return {
      ok: false as const,
      error: error?.message || "Could not create your account. Try again.",
    };
  }

  // Welcome email is best-effort. Account is already usable without it.
  if (isResendConfigured()) {
    const signInUrl = `${getSiteUrl()}/login`;
    await sendEmail(
      email,
      `Welcome to ${BRAND.name}`,
      `Hello${fullName ? ` ${fullName}` : ""},

Your ${BRAND.name} account is ready. Sign in here:
${signInUrl}

— ${BRAND.name}`,
      undefined,
      `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#0f2942;">
  <p>Hello${fullName ? ` ${escapeHtml(fullName)}` : ""},</p>
  <p>Your ${escapeHtml(BRAND.name)} account is ready.</p>
  <p><a href="${signInUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">Sign in</a></p>
  <p style="font-size:13px;color:#64748b;">If the button does not work, copy and paste this link into your browser:<br/><a href="${signInUrl}">${signInUrl}</a></p>
</div>`,
    );
  }

  return {
    ok: true as const,
    message: "Account created. You can sign in now.",
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
