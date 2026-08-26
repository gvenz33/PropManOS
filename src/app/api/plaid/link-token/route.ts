import { BRAND } from "@/lib/brand";
import {
  getPlaidClient,
  isPlaidConfigured,
  plaidCheckingAccountFilters,
  plaidCountryCodes,
  plaidLinkProducts,
  type BankConnectionPurpose,
} from "@/lib/plaid/client";
import { plaidErrorMessage } from "@/lib/plaid/errors";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type Body = { purpose?: BankConnectionPurpose };

export async function POST(request: Request) {
  if (!isPlaidConfigured()) {
    return NextResponse.json(
      {
        error:
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

  try {
    const plaid = getPlaidClient();
    const linkToken = await plaid.linkTokenCreate({
      user: { client_user_id: user.id },
      client_name: BRAND.name,
      products: plaidLinkProducts(),
      country_codes: plaidCountryCodes(),
      language: "en",
      account_filters: plaidCheckingAccountFilters(),
    });

    return NextResponse.json({
      link_token: linkToken.data.link_token,
      expiration: linkToken.data.expiration,
      purpose,
    });
  } catch (error) {
    return NextResponse.json(
      { error: plaidErrorMessage(error, "Could not create link token") },
      { status: 500 },
    );
  }
}
