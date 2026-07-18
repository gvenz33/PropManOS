import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type { DashboardLink } from "@/components/dashboard/nav-types";
import {
  getOwnerBillingProfile,
  hasActiveSubscription,
  ownerHasFeature,
} from "@/lib/billing/access";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOutAction } from "../actions";

const primaryLinks: DashboardLink[] = [
  { href: "/dashboard/owner", label: "Overview", shortLabel: "Home", icon: "home" },
  {
    href: "/dashboard/owner/properties",
    label: "Properties",
    shortLabel: "Units",
    icon: "properties",
  },
  { href: "/dashboard/owner/invoices", label: "Rent & late fees", shortLabel: "Rent", icon: "rent" },
  { href: "/dashboard/owner/documents", label: "Documents", shortLabel: "Docs", icon: "documents" },
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

  const profile = await getOwnerBillingProfile(user.id);
  if (!profile) redirect("/login");
  if (profile.role === "admin") redirect("/dashboard/admin");
  if (profile.role !== "owner") redirect("/dashboard/tenant");

  const subscribed = hasActiveSubscription(profile);

  const moreLinks: DashboardLink[] = [
    { href: "/dashboard/owner/payments", label: "Bank account", icon: "bank" },
    { href: "/dashboard/owner/repairs", label: "Maintenance", icon: "repairs" },
  ];

  if (ownerHasFeature(profile, "owner_reports")) {
    moreLinks.push({ href: "/dashboard/owner/reports", label: "Owner reports", icon: "reports" });
  }
  if (ownerHasFeature(profile, "crm")) {
    moreLinks.push({ href: "/dashboard/owner/crm", label: "CRM", icon: "crm" });
  }

  moreLinks.push(
    { href: "/dashboard/owner/billing", label: "Billing & plans", icon: "settings" },
    { href: "/dashboard/owner/settings", label: "Settings", icon: "settings" },
    { href: "/dashboard/owner/faq", label: "Landlord FAQ", icon: "faq" },
  );

  const { data: nameRow } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <DashboardShell
      portalLabel="Landlord / PM workspace"
      userName={nameRow?.full_name || user.email || "Account"}
      primaryLinks={subscribed ? primaryLinks : []}
      moreLinks={
        subscribed
          ? moreLinks
          : [{ href: "/dashboard/owner/billing", label: "Billing & plans", icon: "settings" }]
      }
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
