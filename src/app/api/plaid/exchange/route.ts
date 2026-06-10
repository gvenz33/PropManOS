import {
  disconnectBankConnection,
  saveBankConnection,
} from "@/lib/plaid/bank-connections";
import {
  getPlaidClient,
  isPlaidConfigured,
  type BankConnectionPurpose,
} from "@/lib/plaid/client";
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

    const connection = await saveBankConnection({
      profileId: user.id,
      purpose,
      plaidItemId: itemId,
      plaidAccessToken: accessToken,
      plaidAccountId: accountId,
      institutionName: body.institution_name,
      accountName: body.account_name,
      accountMask: body.account_mask,
      accountSubtype: body.account_subtype,
    });

    return NextResponse.json({ connection });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not connect bank";
    return NextResponse.json({ error: message }, { status: 500 });
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
    await disconnectBankConnection(user.id, purpose);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not disconnect bank";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
