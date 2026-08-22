/**
 * Edge-safe MFA cookie helpers (Web Crypto only).
 * Middleware must not import Node `crypto` or server-only email modules.
 */

export const MFA_COOKIE = "gmr_mfa_v";
const COOKIE_TTL_SECONDS = 60 * 60 * 24 * 14;

function pepper() {
  return (
    process.env.SUPABASE_JWT_SECRET ||
    process.env.CRON_SECRET ||
    process.env.PLAID_SECRET ||
    "gotmyrent-mfa-dev"
  );
}

function base64UrlEncode(bytes: ArrayBuffer | Uint8Array) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (let i = 0; i < view.length; i++) binary += String.fromCharCode(view[i]!);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecodeToString(input: string) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return atob(padded + pad);
}

function timingSafeEqualString(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i)! ^ b.charCodeAt(i)!;
  return out === 0;
}

async function hmacSha256Base64Url(message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pepper()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return base64UrlEncode(signature);
}

export function getAuthSessionId(accessToken: string | null | undefined): string | null {
  if (!accessToken) return null;
  try {
    const payload = JSON.parse(base64UrlDecodeToString(accessToken.split(".")[1] ?? "")) as {
      session_id?: string;
      sessionId?: string;
    };
    return payload.session_id ?? payload.sessionId ?? null;
  } catch {
    return null;
  }
}

export function isEmailMfaEnabled(user: { app_metadata?: Record<string, unknown> } | null | undefined) {
  if (!user) return false;
  return user.app_metadata?.email_mfa === true;
}

export async function createMfaCookieValue(userId: string, sessionId: string) {
  const exp = Math.floor(Date.now() / 1000) + COOKIE_TTL_SECONDS;
  const body = `${userId}.${sessionId}.${exp}`;
  const sig = await hmacSha256Base64Url(body);
  return { value: `${body}.${sig}`, maxAge: COOKIE_TTL_SECONDS };
}

export async function verifyMfaCookieValue(
  cookieValue: string | undefined,
  userId: string,
  sessionId: string,
) {
  if (!cookieValue) return false;
  const parts = cookieValue.split(".");
  if (parts.length !== 4) return false;
  const [uid, sid, expStr, sig] = parts;
  if (uid !== userId || sid !== sessionId || !sig) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return false;
  const expected = await hmacSha256Base64Url(`${uid}.${sid}.${exp}`);
  return timingSafeEqualString(sig, expected);
}
