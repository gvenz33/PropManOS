import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOutAction } from "../actions";

const links = [
  { href: "/dashboard/owner", label: "Overview" },
  { href: "/dashboard/owner/properties", label: "Properties" },
  { href: "/dashboard/owner/invoices", label: "Rent & late fees" },
  { href: "/dashboard/owner/payments", label: "Bank account" },
  { href: "/dashboard/owner/documents", label: "Documents" },
  { href: "/dashboard/owner/repairs", label: "Maintenance" },
  { href: "/dashboard/owner/reports", label: "Owner reports" },
  { href: "/dashboard/owner/crm", label: "CRM" },
  { href: "/dashboard/owner/faq", label: "Landlord FAQ" },
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
