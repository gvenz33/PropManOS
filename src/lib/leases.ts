export type LeaseProfile = { full_name: string; phone: string | null };

export type LeaseRow = {
  id: string;
  tenant_email: string;
  tenant_name: string | null;
  tenant_phone: string | null;
  tenant_id: string | null;
  status: string;
  rent_amount_cents: number;
  start_date: string;
  end_date: string | null;
  profiles: LeaseProfile | LeaseProfile[] | null;
};

export function leaseProfile(lease: LeaseRow) {
  return Array.isArray(lease.profiles) ? lease.profiles[0] : lease.profiles;
}

export function displayTenantName(lease: LeaseRow) {
  const profile = leaseProfile(lease);
  return profile?.full_name?.trim() || lease.tenant_name?.trim() || null;
}

export function displayTenantPhone(lease: LeaseRow) {
  const profile = leaseProfile(lease);
  return profile?.phone?.trim() || lease.tenant_phone?.trim() || "";
}
