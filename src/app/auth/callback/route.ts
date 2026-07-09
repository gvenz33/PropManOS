import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

function safeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return null;
  }
  return next;
}

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const authError = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const requestedNext = safeNextPath(searchParams.get("next"));

  if (authError) {
    const detail = errorDescription
      ? encodeURIComponent(errorDescription)
      : encodeURIComponent("Authentication link is invalid or has expired.");
    const recoveryNext = requestedNext === "/reset-password" ? "/reset-password" : "/login";
    return NextResponse.redirect(`${origin}${recoveryNext}?error=${detail}`);
  }

  if (!code || !supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  let destination = requestedNext ?? "/dashboard";
  let redirectUrl = `${origin}${destination}`;
  let response = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.redirect(redirectUrl);
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  if (!requestedNext) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.recovery_sent_at) {
      destination = "/reset-password";
      redirectUrl = `${origin}${destination}`;
      const recoveryResponse = NextResponse.redirect(redirectUrl);
      response.cookies.getAll().forEach((cookie) => {
        recoveryResponse.cookies.set(cookie);
      });
      response = recoveryResponse;
    }
  }

  return response;
}
