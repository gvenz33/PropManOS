export type AccountRole = "owner" | "tenant" | "admin";

export function roleRequiresEmailMfa(role: AccountRole | string | null | undefined) {
  return role === "owner" || role === "admin";
}

export function profileRequiresEmailMfa(profile: {
  role?: string | null;
  email_mfa_enabled?: boolean | null;
} | null | undefined) {
  if (!profile) return false;
  if (profile.email_mfa_enabled) return true;
  return roleRequiresEmailMfa(profile.role);
}
