import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type { DashboardLink } from "@/components/dashboard/nav-types";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOutAction } from "../actions";

const primaryLinks: DashboardLink[] = [
  { href: "/dashboard/admin", label: "Overview", shortLabel: "Home", icon: "home" },
  {
    href: "/dashboard/admin/subscribers",
    label: "Subscribers",
    shortLabel: "Users",
    icon: "people",
  },
  { href: "/dashboard/admin/documents", label: "Documents", shortLabel: "Docs", icon: "documents" },
  { href: "/dashboard/admin/tools", label: "Tools", shortLabel: "Tools", icon: "tools" },
];

const moreLinks: DashboardLink[] = [
  { href: "/dashboard/admin/settings", label: "Account settings", icon: "settings" },
];

export default async function AdminLayout({
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

  if (profile?.role !== "admin") redirect("/dashboard");

  return (
    <DashboardShell
      portalLabel="Site administration console"
      userName={profile.full_name || user.email || "Admin"}
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
