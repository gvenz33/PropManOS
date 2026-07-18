import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type { DashboardLink } from "@/components/dashboard/nav-types";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOutAction } from "../actions";

const primaryLinks: DashboardLink[] = [
  { href: "/dashboard/tenant", label: "Home", shortLabel: "Home", icon: "home" },
  { href: "/dashboard/tenant/invoices", label: "Invoices", shortLabel: "Rent", icon: "rent" },
  { href: "/dashboard/tenant/documents", label: "Documents", shortLabel: "Docs", icon: "documents" },
  { href: "/dashboard/tenant/repairs", label: "Maintenance", shortLabel: "Fixes", icon: "repairs" },
];

const moreLinks: DashboardLink[] = [
  { href: "/dashboard/tenant/settings", label: "Settings", icon: "settings" },
  { href: "/dashboard/tenant/faq", label: "Tenant FAQ", icon: "faq" },
];

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "admin") redirect("/dashboard/admin");
  if (profile?.role === "owner") redirect("/dashboard/owner");

  return (
    <DashboardShell
      portalLabel="Tenant portal"
      userName={profile?.full_name || user.email || "Account"}
      primaryLinks={primaryLinks}
      moreLinks={moreLinks}
      signOut={
        <form action={signOutAction}>
          <button type="submit" className="dashboard-signout">
            Sign out
          </button>
        </form>
      }
    >
      {children}
    </DashboardShell>
  );
}
