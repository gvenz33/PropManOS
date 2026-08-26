import { BRAND } from "@/lib/brand";
import {
  getPlaidClient,
  getPlaidConfigProblem,
  isPlaidConfigured,
  plaidCountryCodes,
  type BankConnectionPurpose,
} from "@/lib/plaid/client";
import { plaidErrorDetails, plaidErrorMessage } from "@/lib/plaid/errors";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import { Products } from "plaid";
import { NextResponse } from "next/server";

type Body = { purpose?: BankConnectionPurpose };

function isInvalidProduct(error: unknown) {
  const details = plaidErrorDetails(error);
  const body = details.body as { error_code?: string; error_message?: string } | null;
  const code = body?.error_code ?? "";
  const message = `${body?.error_message ?? ""} ${plaidErrorMessage(error)}`.toLowerCase();
  return code === "INVALID_PRODUCT" || message.includes("not authorized to access");
}

export async function POST(request: Request) {
  const configProblem = getPlaidConfigProblem();
  if (configProblem || !isPlaidConfigured()) {
    return NextResponse.json(
      {
        error:
          configProblem ??
          "Plaid is not configured. Add PLAID_CLIENT_ID and PLAID_SECRET in Vercel environment variables.",
      },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let purpose: BankConnectionPurpose = "payment";
  try {
    const body = (await request.json()) as Body;
    if (body.purpose === "payout" || body.purpose === "payment") {
      purpose = body.purpose;
    }
  } catch {
    // default purpose
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (purpose === "payout" && profile?.role !== "owner") {
    return NextResponse.json(
      { error: "Only landlords can connect payout accounts" },
      { status: 403 },
    );
  }
  if (purpose === "payment" && profile?.role !== "tenant") {
    return NextResponse.json(
      { error: "Only tenants can connect payment accounts" },
      { status: 403 },
    );
  }

  const redirectUri = process.env.PLAID_REDIRECT_URI?.trim() || undefined;
  const baseRequest = {
    user: { client_user_id: user.id },
    client_name: BRAND.name,
    country_codes: plaidCountryCodes(),
    language: "en" as const,
    // Auth already limits to checking/savings; avoid extra filters that can 400.
    ...(redirectUri ? { redirect_uri: redirectUri } : {}),
  };

  // Prefer Auth for bank/ACH. Fall back to Transactions if Auth isn't enabled yet.
  const productAttempts: Products[][] = [[Products.Auth], [Products.Transactions]];

  let lastError: unknown = null;
  for (const products of productAttempts) {
    try {
      const plaid = getPlaidClient();
      const linkToken = await plaid.linkTokenCreate({
        ...baseRequest,
        products,
      });

      return NextResponse.json({
        link_token: linkToken.data.link_token,
        expiration: linkToken.data.expiration,
        purpose,
        products,
      });
    } catch (error) {
      lastError = error;
      if (!isInvalidProduct(error)) break;
    }
  }

  const details = plaidErrorDetails(lastError);
  console.error("Plaid linkTokenCreate failed", {
    purpose,
    siteUrl: getSiteUrl(),
    redirectUri: redirectUri ?? null,
    ...details,
  });

  let message = plaidErrorMessage(lastError, "Could not start bank linking");
  const body = details.body as { error_code?: string; error_message?: string } | null;
  if (body?.error_code === "INVALID_API_KEYS" || /invalid.*key/i.test(message)) {
    message =
      "Plaid API keys are invalid for this environment. Check PLAID_CLIENT_ID, PLAID_SECRET, and PLAID_ENV (sandbox vs production) in Vercel.";
  } else if (body?.error_code === "INVALID_REDIRECT_URI") {
    message =
      "Plaid redirect URI is not allowlisted. Add your site URL in the Plaid Dashboard → Team Settings → API, or remove PLAID_REDIRECT_URI.";
  } else if (isInvalidProduct(lastError)) {
    message =
      "This Plaid account cannot use Auth/Transactions yet. In the Plaid Dashboard, enable Auth (or Transactions) for your app, then try again.";
  }

  return NextResponse.json({ error: message }, { status: 400 });
}
