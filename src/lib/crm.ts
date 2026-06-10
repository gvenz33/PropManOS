import type { SupabaseClient } from "@supabase/supabase-js";

type PropertyAddress = {
  name: string;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
};

export function formatUnitAddress(property: PropertyAddress, unitLabel: string): string {
  const cityState = [property.city, property.state].filter(Boolean).join(", ");
  const parts = [
    property.address_line1,
    unitLabel ? `Unit ${unitLabel}` : null,
    cityState || null,
    property.postal_code,
  ].filter(Boolean);
  return parts.join(", ");
}

export async function upsertTenantCrmContact(
  supabase: SupabaseClient,
  ownerId: string,
  params: {
    name: string;
    email: string;
    phone: string | null;
    address: string;
  },
) {
  const email = params.email.trim().toLowerCase();
  if (!email) return;

  const { data: existing } = await supabase
    .from("crm_contacts")
    .select("id")
    .eq("owner_id", ownerId)
    .ilike("email", email)
    .maybeSingle();

  const row = {
    name: params.name.trim() || email,
    email,
    phone: params.phone?.trim() || null,
    address: params.address.trim() || null,
    notes: "Active tenant",
  };

  if (existing?.id) {
    await supabase.from("crm_contacts").update(row).eq("id", existing.id);
  } else {
    await supabase.from("crm_contacts").insert({ owner_id: ownerId, ...row });
  }
}
