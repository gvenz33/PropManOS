import { createHash, createHmac, randomInt, timingSafeEqual } from "crypto";
import { BRAND } from "@/lib/brand";
import { sendEmail } from "@/lib/notifications/outbound";
import { createServiceClient } from "@/lib/supabase/service";
import type { User } from "@supabase/supabase-js";

export const MFA_COOKIE = "gmr_mfa_v";
const CODE_TTL_MS = 10 * 60 * 1000;
const COOKIE_TTL_SECONDS = 60 * 60 * 24 * 14; // match long-lived sessions
const MAX_ACTIVE_CHALLENGES = 5;

export type MfaPurpose = "login" | "enable" | "disable";

function pepper() {
  return (
    process.env.SUPABASE_JWT_SECRET ||
    process.env.CRON_SECRET ||
    process.env.PLAID_SECRET ||
    "gotmyrent-mfa-dev"
  );
}

export function hashMfaCode(code: string) {
  return createHash("sha256").update(`${pepper()}:${code}`).digest("hex");
}

export function generateMfaCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function getAuthSessionId(accessToken: string | null | undefined): string | null {
  if (!accessToken) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(accessToken.split(".")[1] ?? "", "base64url").toString("utf8"),
    ) as { session_id?: string; sessionId?: string };
    return payload.session_id ?? payload.sessionId ?? null;
  } catch {
    return null;
  }
}

export function isEmailMfaEnabled(user: User | null | undefined) {
  if (!user) return false;
  if (user.app_metadata?.email_mfa === true) return true;
  return false;
}

function signCookiePayload(userId: string, sessionId: string, exp: number) {
  const body = `${userId}.${sessionId}.${exp}`;
  const sig = createHmac("sha256", pepper()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function createMfaCookieValue(userId: string, sessionId: string) {
  const exp = Math.floor(Date.now() / 1000) + COOKIE_TTL_SECONDS;
  return { value: signCookiePayload(userId, sessionId, exp), maxAge: COOKIE_TTL_SECONDS };
}

export function verifyMfaCookieValue(
  cookieValue: string | undefined,
  userId: string,
  sessionId: string,
) {
  if (!cookieValue) return false;
  const parts = cookieValue.split(".");
  if (parts.length !== 4) return false;
  const [uid, sid, expStr, sig] = parts;
  if (uid !== userId || sid !== sessionId) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return false;
  const expected = createHmac("sha256", pepper())
    .update(`${uid}.${sid}.${exp}`)
    .digest("base64url");
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function sendMfaChallengeEmail(to: string, code: string, purpose: MfaPurpose) {
  const subject =
    purpose === "enable"
      ? `Confirm email MFA for ${BRAND.name}`
      : purpose === "disable"
        ? `Confirm turning off MFA for ${BRAND.name}`
        : `Your ${BRAND.name} sign-in code`;

  const intro =
    purpose === "enable"
      ? `Use this code to turn on email multi-factor authentication for your ${BRAND.name} account:`
      : purpose === "disable"
        ? `Use this code to turn off email multi-factor authentication for your ${BRAND.name} account:`
        : `Use this code to finish signing in to ${BRAND.name}:`;

  return sendEmail(
    to,
    subject,
    `${intro}

${code}

This code expires in 10 minutes. If you did not request it, you can ignore this email.

— ${BRAND.name}`,
    undefined,
    `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#0f2942;">
  <p>${intro}</p>
  <p style="font-size:28px;letter-spacing:6px;font-weight:700;">${code}</p>
  <p style="font-size:13px;color:#64748b;">This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>
</div>`,
  );
}

export async function createAndSendMfaChallenge(input: {
  userId: string;
  email: string;
  purpose: MfaPurpose;
}) {
  const service = createServiceClient();
  if (!service) {
    return { ok: false as const, error: "MFA is temporarily unavailable." };
  }

  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count } = await service
    .from("email_mfa_challenges")
    .select("id", { count: "exact", head: true })
    .eq("user_id", input.userId)
    .gte("created_at", since);

  if ((count ?? 0) >= MAX_ACTIVE_CHALLENGES) {
    return {
      ok: false as const,
      error: "Too many codes requested. Wait a few minutes and try again.",
    };
  }

  const code = generateMfaCode();
  const { error } = await service.from("email_mfa_challenges").insert({
    user_id: input.userId,
    code_hash: hashMfaCode(code),
    purpose: input.purpose,
    expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
  });

  if (error) {
    return { ok: false as const, error: error.message };
  }

  const sent = await sendMfaChallengeEmail(input.email, code, input.purpose);
  if (!sent.ok) {
    return {
      ok: false as const,
      error: sent.error || "Could not send the verification email.",
    };
  }

  return { ok: true as const };
}

export async function consumeMfaChallenge(input: {
  userId: string;
  code: string;
  purpose: MfaPurpose;
}) {
  const service = createServiceClient();
  if (!service) {
    return { ok: false as const, error: "MFA is temporarily unavailable." };
  }

  const code = input.code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) {
    return { ok: false as const, error: "Enter the 6-digit code from your email." };
  }

  const { data: rows, error } = await service
    .from("email_mfa_challenges")
    .select("id, code_hash, expires_at, consumed_at")
    .eq("user_id", input.userId)
    .eq("purpose", input.purpose)
    .is("consumed_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  const match = (rows ?? []).find((row) => row.code_hash === hashMfaCode(code));
  if (!match) {
    return { ok: false as const, error: "Invalid or expired code. Request a new one." };
  }

  const { error: consumeError } = await service
    .from("email_mfa_challenges")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", match.id);

  if (consumeError) {
    return { ok: false as const, error: consumeError.message };
  }

  return { ok: true as const };
}

export async function markSessionMfaVerified(userId: string, sessionId: string) {
  const service = createServiceClient();
  if (!service) return { ok: false as const, error: "MFA is temporarily unavailable." };

  const { error } = await service.from("email_mfa_session_verifications").upsert(
    {
      session_id: sessionId,
      user_id: userId,
      verified_at: new Date().toISOString(),
    },
    { onConflict: "session_id" },
  );

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export async function setEmailMfaEnabled(userId: string, enabled: boolean) {
  const service = createServiceClient();
  if (!service) return { ok: false as const, error: "MFA is temporarily unavailable." };

  const { error: profileError } = await service
    .from("profiles")
    .update({ email_mfa_enabled: enabled })
    .eq("id", userId);

  if (profileError) return { ok: false as const, error: profileError.message };

  const { data: existing, error: getError } = await service.auth.admin.getUserById(userId);
  if (getError || !existing.user) {
    return { ok: false as const, error: getError?.message ?? "User not found." };
  }

  const { error: metaError } = await service.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...(existing.user.app_metadata ?? {}),
      email_mfa: enabled,
    },
  });

  if (metaError) return { ok: false as const, error: metaError.message };
  return { ok: true as const };
}

export async function profileHasEmailMfa(userId: string) {
  const service = createServiceClient();
  if (!service) return false;
  const { data } = await service
    .from("profiles")
    .select("email_mfa_enabled")
    .eq("id", userId)
    .maybeSingle();
  return Boolean(data?.email_mfa_enabled);
}
