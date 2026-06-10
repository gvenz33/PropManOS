import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function OwnerHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { count: propCount } = await supabase
    .from("properties")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", user.id);

  const { data: props } = await supabase.from("properties").select("id").eq("owner_id", user.id);
  const propIds = (props ?? []).map((p) => p.id);
  let unitCount = 0;
  let openInvoices = 0;
  let openRepairs = 0;
  if (propIds.length) {
    const { count: u } = await supabase
      .from("units")
      .select("*", { count: "exact", head: true })
      .in("property_id", propIds);
    unitCount = u ?? 0;
    const { data: units } = await supabase.from("units").select("id").in("property_id", propIds);
    const unitIds = (units ?? []).map((x) => x.id);
    if (unitIds.length) {
      const { data: leases } = await supabase.from("leases").select("id").in("unit_id", unitIds);
      const leaseIds = (leases ?? []).map((l) => l.id);
      if (leaseIds.length) {
        const { count: inv } = await supabase
          .from("invoices")
          .select("*", { count: "exact", head: true })
          .in("lease_id", leaseIds)
          .in("status", ["open", "late"]);
        openInvoices = inv ?? 0;
        const { count: repairs } = await supabase
          .from("repair_requests")
          .select("*", { count: "exact", head: true })
          .in("lease_id", leaseIds)
          .in("status", ["submitted", "acknowledged", "in_progress"]);
        openRepairs = repairs ?? 0;
      }
    }
  }

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Overview"
        description="Your portfolio at a glance — properties, rent status, maintenance, and owner reports."
      />

      {(propCount ?? 0) === 0 ? (
        <section className="dashboard-callout">
          <h2 className="font-semibold">Set up your first property</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Start by adding a building you manage, then create units and assign tenant emails for
            each rental.
          </p>
          <Link href="/dashboard/owner/properties" className="btn-primary mt-4">
            Add a property
          </Link>
        </section>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Properties"
          value={propCount ?? 0}
          href="/dashboard/owner/properties"
          accent="blue"
        />
        <StatCard label="Units" value={unitCount} href="/dashboard/owner/properties" accent="green" />
        <StatCard
          label="Open / late invoices"
          value={openInvoices}
          href="/dashboard/owner/invoices"
          accent="amber"
        />
        <StatCard
          label="Open maintenance"
          value={openRepairs}
          href="/dashboard/owner/repairs"
          accent="default"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="dashboard-panel">
          <h2 className="font-semibold">Owner monthly reports</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Export a styled Excel workbook with occupancy, rent collected, and maintenance — then
            email it directly to property owners from your CRM contacts.
          </p>
          <Link href="/dashboard/owner/reports" className="btn-outline-blue mt-4">
            Create report
          </Link>
        </section>
        <section className="dashboard-panel">
          <h2 className="font-semibold">Payments & reminders</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Add Zelle and Cash App handles on each unit. Tenants can opt into email and text
            reminders from their settings. Set{" "}
            <code className="rounded bg-[var(--muted-bg)] px-1">RESEND_API_KEY</code>, Twilio, and{" "}
            <code className="rounded bg-[var(--muted-bg)] px-1">CRON_SECRET</code> on Vercel for
            automated due-date notices.
          </p>
        </section>
      </div>
    </div>
  );
}
