import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOutAction } from "../actions";

const links = [
  { href: "/dashboard/tenant", label: "Home" },
  { href: "/dashboard/tenant/invoices", label: "Invoices" },
  { href: "/dashboard/tenant/documents", label: "Documents" },
  { href: "/dashboard/tenant/repairs", label: "Maintenance" },
  { href: "/dashboard/tenant/settings", label: "Settings" },
  { href: "/dashboard/tenant/faq", label: "Tenant FAQ" },
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
      links={links}
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
