export const BRAND = {
  name: "Got My Rent",
  domain: "GotMyRent.com",
  tagline: "Manage. Collect. Grow.",
  description:
    "Rent collection, tenant notices, and property records for landlords, property managers, and tenants.",
  supportEmail: "hello@gotmyrent.com",
  logo: "/got-my-rent-logo.png",
  icon: "/got-my-rent-icon.png",
} as const;

export type UserRole = "owner" | "tenant" | "admin";

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: "Landlord / PM",
  tenant: "Tenant",
  admin: "Site admin",
};
