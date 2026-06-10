import { createServiceClient } from "@/lib/supabase/service";
import type { BankConnectionPurpose } from "./client";

export type BankConnectionRow = {
  id: string;
  profile_id: string;
  purpose: BankConnectionPurpose;
  institution_name: string | null;
  account_name: string | null;
  account_mask: string | null;
  account_subtype: string | null;
  status: string;
  created_at: string;
};

export async function getActiveBankConnection(
  profileId: string,
  purpose: BankConnectionPurpose,
) {
  const service = createServiceClient();
  if (!service) return null;

  const { data } = await service
    .from("bank_connections")
    .select(
      "id, profile_id, purpose, institution_name, account_name, account_mask, account_subtype, status, created_at",
    )
    .eq("profile_id", profileId)
    .eq("purpose", purpose)
    .eq("status", "active")
    .maybeSingle();

  return (data as BankConnectionRow | null) ?? null;
}

export async function getActiveBankConnectionWithToken(
  profileId: string,
  purpose: BankConnectionPurpose,
) {
  const service = createServiceClient();
  if (!service) return null;

  const { data } = await service
    .from("bank_connections")
    .select("*")
    .eq("profile_id", profileId)
    .eq("purpose", purpose)
    .eq("status", "active")
    .maybeSingle();

  return data as
    | (BankConnectionRow & {
        plaid_item_id: string;
        plaid_access_token: string;
        plaid_account_id: string;
      })
    | null;
}

export async function saveBankConnection(input: {
  profileId: string;
  purpose: BankConnectionPurpose;
  plaidItemId: string;
  plaidAccessToken: string;
  plaidAccountId: string;
  institutionName?: string | null;
  accountName?: string | null;
  accountMask?: string | null;
  accountSubtype?: string | null;
}) {
  const service = createServiceClient();
  if (!service) throw new Error("Service client unavailable");

  await service
    .from("bank_connections")
    .update({ status: "disconnected", updated_at: new Date().toISOString() })
    .eq("profile_id", input.profileId)
    .eq("purpose", input.purpose)
    .eq("status", "active");

  const { data, error } = await service
    .from("bank_connections")
    .insert({
      profile_id: input.profileId,
      purpose: input.purpose,
      plaid_item_id: input.plaidItemId,
      plaid_access_token: input.plaidAccessToken,
      plaid_account_id: input.plaidAccountId,
      institution_name: input.institutionName ?? null,
      account_name: input.accountName ?? null,
      account_mask: input.accountMask ?? null,
      account_subtype: input.accountSubtype ?? null,
      status: "active",
    })
    .select(
      "id, profile_id, purpose, institution_name, account_name, account_mask, account_subtype, status, created_at",
    )
    .single();

  if (error) throw new Error(error.message);
  return data as BankConnectionRow;
}

export async function disconnectBankConnection(
  profileId: string,
  purpose: BankConnectionPurpose,
) {
  const service = createServiceClient();
  if (!service) throw new Error("Service client unavailable");

  const { error } = await service
    .from("bank_connections")
    .update({ status: "disconnected", updated_at: new Date().toISOString() })
    .eq("profile_id", profileId)
    .eq("purpose", purpose)
    .eq("status", "active");

  if (error) throw new Error(error.message);
}

export function formatBankLabel(connection: BankConnectionRow | null) {
  if (!connection) return null;
  const institution = connection.institution_name ?? "Bank";
  const mask = connection.account_mask ? `••••${connection.account_mask}` : "";
  const name = connection.account_name ?? "Account";
  return `${institution} — ${name}${mask ? ` ${mask}` : ""}`;
}

export function formatBankLabel(connection: BankConnectionRow | null) {
  if (!connection) return null;
  const institution = connection.institution_name ?? "Bank";
  const mask = connection.account_mask ? `••••${connection.account_mask}` : "";
  const name = connection.account_name ?? "Account";
  return `${institution} — ${name}${mask ? ` ${mask}` : ""}`;
}
