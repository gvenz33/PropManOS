import type { UserRole } from "@/lib/brand";

export type ProfileRow = {
  id: string;
  full_name: string;
  role: UserRole;
  email: string | null;
  phone: string | null;
  created_at: string;
};

export function dashboardPathForRole(role: UserRole | null | undefined) {
  if (role === "admin") return "/dashboard/admin";
  if (role === "owner") return "/dashboard/owner";
  return "/dashboard/tenant";
}
