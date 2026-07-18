import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { MonthlyReportPanel } from "@/components/dashboard/monthly-report-panel";
import { getOwnerBillingProfile, ownerHasFeature } from "@/lib/billing/access";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function OwnerReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getOwnerBillingProfile(user.id);
  if (!profile || !ownerHasFeature(profile, "owner_reports")) {
    redirect("/dashboard/owner/billing");
  }
  const now = new Date();
  const defaultYear = now.getFullYear();
  const defaultMonth = now.getMonth() + 1;

  const { data: properties } = await supabase
    .from("properties")
    .select("id, name")
    .eq("owner_id", user.id)
    .order("name");

  const { data: contacts } = await supabase
    .from("crm_contacts")
    .select("id, name, email")
    .eq("owner_id", user.id)
    .order("name");

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Owner monthly reports"
        description="Build a polished Excel summary for any month — occupancy, rent collected, outstanding balances, and maintenance — then download or email it to a property owner."
      />

      <MonthlyReportPanel
        properties={properties ?? []}
        contacts={contacts ?? []}
        defaultYear={defaultYear}
        defaultMonth={defaultMonth}
      />
    </div>
  );
}
