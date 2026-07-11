import { createServerClient } from "@supabase/ssr";
import {
  getAuthSessionId,
  isEmailMfaEnabled,
  MFA_COOKIE,
  verifyMfaCookieValue,
} from "@/lib/auth/email-mfa";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Supabase may fall back to Site URL (/) with ?code= when the callback URL
  // is missing from the project's redirect allow list — forward to the handler.
  const authCode = request.nextUrl.searchParams.get("code");
  if (authCode && !request.nextUrl.pathname.startsWith("/auth/callback")) {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = "/auth/callback";
    if (!callbackUrl.searchParams.has("next")) {
      const recoveryType = request.nextUrl.searchParams.get("type");
      callbackUrl.searchParams.set(
        "next",
        recoveryType === "recovery" ? "/reset-password" : "/dashboard",
      );
    }
    return NextResponse.redirect(callbackUrl);
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (path.startsWith("/dashboard") && !user) {
    const u = request.nextUrl.clone();
    u.pathname = "/login";
    u.searchParams.set("next", path);
    return NextResponse.redirect(u);
  }

  if (user && path.startsWith("/dashboard") && isEmailMfaEnabled(user)) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const sessionId = getAuthSessionId(session?.access_token);
    const cookieOk =
      sessionId &&
      verifyMfaCookieValue(request.cookies.get(MFA_COOKIE)?.value, user.id, sessionId);

    if (!cookieOk) {
      const u = request.nextUrl.clone();
      u.pathname = "/login/mfa";
      u.searchParams.set("next", path);
      return NextResponse.redirect(u);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
