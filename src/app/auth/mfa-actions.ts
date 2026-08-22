"use server";

import {
  createAndSendMfaChallenge,
  createMfaCookieValue,
  consumeMfaChallenge,
  getAuthSessionId,
  markSessionMfaVerified,
  setEmailMfaEnabled,
} from "@/lib/auth/email-mfa";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { MFA_COOKIE } from "@/lib/auth/mfa-cookie";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return { supabase, user, session };
}

export async function sendLoginMfaCode(): Promise<{ ok: true } | { ok: false; error: string }> {
  const { user } = await requireUser();
  const email = user.email;
  if (!email) return { ok: false, error: "No email on this account." };

  const result = await createAndSendMfaChallenge({
    userId: user.id,
    email,
    purpose: "login",
  });
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function verifyLoginMfaCode(formData: FormData): Promise<void> {
  const { user, session } = await requireUser();
  const code = String(formData.get("code") ?? "").trim();
  const next = String(formData.get("next") ?? "/dashboard").trim() || "/dashboard";

  const verified = await consumeMfaChallenge({
    userId: user.id,
    code,
    purpose: "login",
  });

  if (!verified.ok) {
    redirect(`/login/mfa?next=${encodeURIComponent(next)}&error=${encodeURIComponent(verified.error)}`);
  }

  const sessionId = getAuthSessionId(session?.access_token);
  if (!sessionId) {
    redirect(`/login/mfa?next=${encodeURIComponent(next)}&error=${encodeURIComponent("Session expired. Sign in again.")}`);
  }

  await markSessionMfaVerified(user.id, sessionId);
  const cookie = await createMfaCookieValue(user.id, sessionId);
  const jar = await cookies();
  jar.set(MFA_COOKIE, cookie.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: cookie.maxAge,
  });

  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function startEnableEmailMfa(formData: FormData): Promise<void> {
  const returnTo = String(formData.get("return_to") ?? "/dashboard").trim();
  const { user } = await requireUser();
  const email = user.email;
  if (!email) {
    redirect(`${returnTo}?error=${encodeURIComponent("No email on this account.")}`);
  }

  const result = await createAndSendMfaChallenge({
    userId: user.id,
    email,
    purpose: "enable",
  });

  if (!result.ok) {
    redirect(`${returnTo}?error=${encodeURIComponent(result.error)}`);
  }

  redirect(`${returnTo}?mfa=enable`);
}

export async function confirmEnableEmailMfa(formData: FormData): Promise<void> {
  const returnTo = String(formData.get("return_to") ?? "/dashboard").trim();
  const code = String(formData.get("code") ?? "").trim();
  const { user, session } = await requireUser();

  const verified = await consumeMfaChallenge({
    userId: user.id,
    code,
    purpose: "enable",
  });

  if (!verified.ok) {
    redirect(`${returnTo}?mfa=enable&error=${encodeURIComponent(verified.error)}`);
  }

  const enabled = await setEmailMfaEnabled(user.id, true);
  if (!enabled.ok) {
    redirect(`${returnTo}?error=${encodeURIComponent(enabled.error)}`);
  }

  const sessionId = getAuthSessionId(session?.access_token);
  if (sessionId) {
    await markSessionMfaVerified(user.id, sessionId);
    const cookie = await createMfaCookieValue(user.id, sessionId);
    const jar = await cookies();
    jar.set(MFA_COOKIE, cookie.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: cookie.maxAge,
    });
  }

  // Refresh JWT so app_metadata.email_mfa is present
  const supabase = await createClient();
  await supabase.auth.refreshSession();

  revalidatePath(returnTo);
  redirect(`${returnTo}?success=mfa-enabled`);
}

export async function startDisableEmailMfa(formData: FormData): Promise<void> {
  const returnTo = String(formData.get("return_to") ?? "/dashboard").trim();
  const { user } = await requireUser();
  const email = user.email;
  if (!email) {
    redirect(`${returnTo}?error=${encodeURIComponent("No email on this account.")}`);
  }

  const result = await createAndSendMfaChallenge({
    userId: user.id,
    email,
    purpose: "disable",
  });

  if (!result.ok) {
    redirect(`${returnTo}?error=${encodeURIComponent(result.error)}`);
  }

  redirect(`${returnTo}?mfa=disable`);
}

export async function confirmDisableEmailMfa(formData: FormData): Promise<void> {
  const returnTo = String(formData.get("return_to") ?? "/dashboard").trim();
  const code = String(formData.get("code") ?? "").trim();
  const { user } = await requireUser();

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "owner" || profile?.role === "admin" || profile?.role === "tenant") {
    redirect(
      `${returnTo}?error=${encodeURIComponent("Two-factor authentication is required for this account.")}`,
    );
  }

  const verified = await consumeMfaChallenge({
    userId: user.id,
    code,
    purpose: "disable",
  });

  if (!verified.ok) {
    redirect(`${returnTo}?mfa=disable&error=${encodeURIComponent(verified.error)}`);
  }

  const disabled = await setEmailMfaEnabled(user.id, false);
  if (!disabled.ok) {
    redirect(`${returnTo}?error=${encodeURIComponent(disabled.error)}`);
  }

  const jar = await cookies();
  jar.delete(MFA_COOKIE);

  await supabase.auth.refreshSession();

  revalidatePath(returnTo);
  redirect(`${returnTo}?success=mfa-disabled`);
}

export async function cancelMfaSetup(formData: FormData): Promise<void> {
  const returnTo = String(formData.get("return_to") ?? "/dashboard").trim();
  redirect(returnTo);
}
