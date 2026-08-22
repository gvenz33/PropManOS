import { BRAND } from "@/lib/brand";
import { roleRequiresEmailMfa } from "@/lib/auth/mfa-policy";
import { isResendConfigured } from "@/lib/notifications/email-config";
import { sendEmail } from "@/lib/notifications/outbound";
import { authCallbackUrl, confirmEmailUrl } from "@/lib/site-url";
import { createServiceClient } from "@/lib/supabase/service";
import { setEmailMfaEnabled } from "@/lib/auth/email-mfa";

export type SignUpInput = {
  email: string;
  password: string;
  fullName: string;
  role: "owner" | "tenant";
};

function confirmationEmailBody(fullName: string, confirmLink: string) {
  return {
    text: `Hello${fullName ? ` ${fullName}` : ""},

Thanks for signing up for ${BRAND.name}.

Open this link to confirm your email and finish creating your account:
${confirmLink}

If you did not create an account, you can ignore this email.

— ${BRAND.name}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#0f2942;">
  <p>Hello${fullName ? ` ${escapeHtml(fullName)}` : ""},</p>
  <p>Thanks for signing up for ${escapeHtml(BRAND.name)}.</p>
  <p><a href="${confirmLink}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">Confirm email</a></p>
  <p style="font-size:13px;color:#64748b;">If the button does not work, copy and paste this link into your browser:<br/><a href="${confirmLink}">${confirmLink}</a></p>
  <p style="font-size:13px;color:#64748b;">If you did not create an account, you can ignore this email.</p>
</div>`,
  };
}

export async function sendSignupConfirmationEmail(input: SignUpInput) {
  const service = createServiceClient();
  if (!service) {
    return {
      ok: false as const,
      error:
        "Sign up is temporarily unavailable. Missing server auth configuration (SUPABASE_SERVICE_ROLE_KEY).",
    };
  }

  if (!isResendConfigured()) {
    return {
      ok: false as const,
      error:
        "Email is not configured yet. Add RESEND_API_KEY and NOTIFICATIONS_FROM_EMAIL, then try again.",
    };
  }

  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  const role = input.role === "owner" ? "owner" : "tenant";

  const { data, error } = await service.auth.admin.generateLink({
    type: "signup",
    email,
    password: input.password,
    options: {
      data: { full_name: fullName, role },
      redirectTo: authCallbackUrl("/dashboard"),
    },
  });

  if (error || !data?.properties?.hashed_token || !data.user?.id) {
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

  const confirmLink = confirmEmailUrl(data.properties.hashed_token);
  const body = confirmationEmailBody(fullName, confirmLink);
  const sent = await sendEmail(
    email,
    `Confirm your ${BRAND.name} account`,
    body.text,
    undefined,
    body.html,
  );

  if (!sent.ok) {
    await service.auth.admin.deleteUser(data.user.id);
    return {
      ok: false as const,
      error: "Could not send the confirmation email. Try again in a few minutes.",
    };
  }

  if (roleRequiresEmailMfa(role)) {
    await setEmailMfaEnabled(data.user.id, true);
  }

  return {
    ok: true as const,
    message: "Check your email to confirm your account, then sign in.",
  };
}

export async function resendSignupConfirmationEmail(email: string) {
  const service = createServiceClient();
  if (!service || !isResendConfigured()) {
    return { ok: false as const, error: "Email confirmation is temporarily unavailable." };
  }

  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return { ok: false as const, error: "Enter your email address." };
  }

  const { data, error } = await service.auth.admin.generateLink({
    type: "magiclink",
    email: normalized,
    options: {
      redirectTo: authCallbackUrl("/dashboard"),
    },
  });

  if (error || !data?.properties?.hashed_token) {
    return { ok: true as const };
  }

  const confirmLink = confirmEmailUrl(data.properties.hashed_token, "/dashboard", "email");
  const body = confirmationEmailBody("", confirmLink);
  await sendEmail(normalized, `Confirm your ${BRAND.name} account`, body.text, undefined, body.html);
  return { ok: true as const };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
