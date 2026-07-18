import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type { DashboardLink } from "@/components/dashboard/nav-types";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOutAction } from "../actions";

const primaryLinks: DashboardLink[] = [
  { href: "/dashboard/owner", label: "Overview", shortLabel: "Home", icon: "home" },
  { href: "/dashboard/owner/properties", label: "Properties", shortLabel: "Units", icon: "properties" },
  { href: "/dashboard/owner/invoices", label: "Rent & late fees", shortLabel: "Rent", icon: "rent" },
  { href: "/dashboard/owner/documents", label: "Documents", shortLabel: "Docs", icon: "documents" },
];

const moreLinks: DashboardLink[] = [
  { href: "/dashboard/owner/payments", label: "Bank account", icon: "bank" },
  { href: "/dashboard/owner/repairs", label: "Maintenance", icon: "repairs" },
  { href: "/dashboard/owner/reports", label: "Owner reports", icon: "reports" },
  { href: "/dashboard/owner/crm", label: "CRM", icon: "crm" },
  { href: "/dashboard/owner/settings", label: "Settings", icon: "settings" },
  { href: "/dashboard/owner/faq", label: "Landlord FAQ", icon: "faq" },
];

export default async function OwnerLayout({
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
  if (profile?.role !== "owner") redirect("/dashboard/tenant");

  return (
    <DashboardShell
      portalLabel="Landlord / PM workspace"
      userName={profile.full_name || user.email || "Account"}
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
