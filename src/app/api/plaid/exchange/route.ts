import {
  disconnectBankConnection,
  getActiveBankConnectionWithToken,
  saveBankConnection,
} from "@/lib/plaid/bank-connections";
import {
  getPlaidClient,
  isPlaidConfigured,
  plaidCountryCodes,
  type BankConnectionPurpose,
} from "@/lib/plaid/client";
import { plaidErrorMessage } from "@/lib/plaid/errors";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type ExchangeBody = {
  public_token?: string;
  account_id?: string;
  purpose?: BankConnectionPurpose;
  institution_name?: string | null;
  account_name?: string | null;
  account_mask?: string | null;
  account_subtype?: string | null;
};

export async function POST(request: Request) {
  if (!isPlaidConfigured()) {
    return NextResponse.json({ error: "Plaid is not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as ExchangeBody;
  const publicToken = body.public_token?.trim();
  const accountId = body.account_id?.trim();
  const purpose = body.purpose;

  if (!publicToken || !accountId || (purpose !== "payout" && purpose !== "payment")) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (purpose === "payout" && profile?.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (purpose === "payment" && profile?.role !== "tenant") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const plaid = getPlaidClient();
    const exchange = await plaid.itemPublicTokenExchange({ public_token: publicToken });
    const accessToken = exchange.data.access_token;
    const itemId = exchange.data.item_id;

    // Prefer Auth metadata when available (mask / name from Plaid).
    let institutionName = body.institution_name ?? null;
    let accountName = body.account_name ?? null;
    let accountMask = body.account_mask ?? null;
    let accountSubtype = body.account_subtype ?? null;

    try {
      const auth = await plaid.authGet({ access_token: accessToken });
      const matched = auth.data.accounts.find((account) => account.account_id === accountId);
      if (matched) {
        accountName = matched.name ?? accountName;
        accountMask = matched.mask ?? accountMask;
        accountSubtype = matched.subtype ?? accountSubtype;
      }
    } catch {
      // Auth metadata is optional; Link metadata is enough to save the connection.
    }

    if (!institutionName) {
      try {
        const item = await plaid.itemGet({ access_token: accessToken });
        const institutionId = item.data.item.institution_id;
        if (institutionId) {
          const institution = await plaid.institutionsGetById({
            institution_id: institutionId,
            country_codes: plaidCountryCodes(),
          });
          institutionName = institution.data.institution.name;
        }
      } catch {
        // keep Link metadata
      }
    }

    const connection = await saveBankConnection({
      profileId: user.id,
      purpose,
      plaidItemId: itemId,
      plaidAccessToken: accessToken,
      plaidAccountId: accountId,
      institutionName,
      accountName,
      accountMask,
      accountSubtype,
    });

    return NextResponse.json({ connection });
  } catch (error) {
    return NextResponse.json(
      { error: plaidErrorMessage(error, "Could not connect bank") },
      { status: 500 },
    );
  }
}

type DisconnectBody = { purpose?: BankConnectionPurpose };

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let purpose: BankConnectionPurpose = "payment";
  try {
    const body = (await request.json()) as DisconnectBody;
    if (body.purpose === "payout" || body.purpose === "payment") {
      purpose = body.purpose;
    }
  } catch {
    // default
  }

  try {
    if (isPlaidConfigured()) {
      const existing = await getActiveBankConnectionWithToken(user.id, purpose);
      if (existing?.plaid_access_token) {
        try {
          const plaid = getPlaidClient();
          await plaid.itemRemove({ access_token: existing.plaid_access_token });
        } catch {
          // Still disconnect locally if Plaid revoke fails.
        }
      }
    }

    await disconnectBankConnection(user.id, purpose);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: plaidErrorMessage(error, "Could not disconnect bank") },
      { status: 500 },
    );
  }
}
