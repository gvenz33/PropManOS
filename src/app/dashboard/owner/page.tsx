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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="mt-1 text-[var(--muted)]">
          Your portfolio at a glance. Add properties, units, and tenants from the Properties
          section.
        </p>
      </div>

      {(propCount ?? 0) === 0 ? (
        <section className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent-dim)]/20 p-6">
          <h2 className="font-semibold">Set up your first property</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Start by adding a building you manage, then create units and assign tenant emails for
            each rental.
          </p>
          <Link
            href="/dashboard/owner/properties"
            className="mt-4 inline-flex rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
          >
            Add a property
          </Link>
        </section>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Properties", value: propCount ?? 0, href: "/dashboard/owner/properties" },
          { label: "Units", value: unitCount, href: "/dashboard/owner/properties" },
          { label: "Open / late invoices", value: openInvoices, href: "/dashboard/owner/invoices" },
          { label: "Open maintenance", value: openRepairs, href: "/dashboard/owner/repairs" },
        ].map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm transition hover:border-[var(--accent)]"
          >
            <p className="text-sm text-[var(--muted)]">{c.label}</p>
            <p className="mt-2 text-3xl font-bold tabular-nums">{c.value}</p>
          </Link>
        ))}
      </div>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--accent-dim)]/30 p-6">
        <h2 className="font-semibold text-[var(--foreground)]">Payments & reminders</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Add Zelle and Cash App handles on each unit so tenants know how to pay. Tenants can opt
          into email and text reminders from their notification settings. Set{" "}
          <code className="rounded bg-[var(--muted-bg)] px-1">RESEND_API_KEY</code>, Twilio, and{" "}
          <code className="rounded bg-[var(--muted-bg)] px-1">CRON_SECRET</code> on Vercel to enable
          automated due-date notices.
        </p>
      </div>
    </div>
  );
}
