export type AccountRole = "owner" | "tenant" | "admin";

/** Email MFA is required for every signed-in account role. */
export function roleRequiresEmailMfa(role: AccountRole | string | null | undefined) {
  return role === "owner" || role === "tenant" || role === "admin";
}

export function profileRequiresEmailMfa(profile: {
  role?: string | null;
  email_mfa_enabled?: boolean | null;
} | null | undefined) {
  if (!profile) return false;
  if (profile.email_mfa_enabled) return true;
  return roleRequiresEmailMfa(profile.role);
}
