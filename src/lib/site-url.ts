export function getSiteUrl() {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    process.env.VERCEL_URL ??
    "http://localhost:3000";

  url = url.startsWith("http") ? url : `https://${url}`;
  return url.replace(/\/$/, "");
}

export function absoluteUrl(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}

export function authCallbackUrl(nextPath: string) {
  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  return `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(next)}`;
}

export function resetPasswordUrl(tokenHash: string) {
  const params = new URLSearchParams({
    token_hash: tokenHash,
    type: "recovery",
  });
  return `${getSiteUrl()}/reset-password?${params.toString()}`;
}

export function confirmEmailUrl(
  tokenHash: string,
  nextPath = "/dashboard",
  type: "signup" | "email" = "signup",
) {
  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  const params = new URLSearchParams({
    token_hash: tokenHash,
    type,
    next,
  });
  return `${getSiteUrl()}/auth/confirm?${params.toString()}`;
}
