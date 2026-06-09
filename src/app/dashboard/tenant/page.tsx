import { PaymentInstructions } from "@/components/payment-instructions";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatMoney } from "@/lib/utils";

export default async function TenantHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: leases } = await supabase
    .from("leases")
    .select(
      "id, tenant_email, units(label, zelle_handle, cashapp_handle, payment_instructions, properties(name, city))",
    )
    .eq("tenant_id", user.id)
    .eq("status", "active");

  const leaseIds = (leases ?? []).map((l) => l.id);
  const { data: openInv } =
    leaseIds.length > 0
      ? await supabase
          .from("invoices")
          .select(
            "id, lease_id, due_date, amount_cents, late_fee_cents, late_fee_waived, status, period_year, period_month",
          )
          .in("lease_id", leaseIds)
          .in("status", ["open", "late"])
          .order("due_date", { ascending: true })
          .limit(5)
      : { data: [] as never[] };

  const leaseById = new Map((leases ?? []).map((l) => [l.id, l]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Your home</h1>
        <p className="mt-1 text-[var(--muted)]">
          Pay rent with Zelle or Cash App, review notices, and keep documents in one place.
        </p>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Active leases</h2>
        <ul className="mt-4 space-y-3">
          {(leases ?? []).map((l) => {
            type U = {
              label: string;
              zelle_handle: string | null;
              cashapp_handle: string | null;
              payment_instructions: string | null;
              properties: { name: string; city: string | null } | { name: string; city: string | null }[];
            };
            const raw = l.units as unknown as U | U[] | null;
            const row = Array.isArray(raw) ? raw[0] ?? null : raw;
            const pRaw = row?.properties;
            const p = Array.isArray(pRaw) ? pRaw[0] ?? null : pRaw ?? null;
            const u = row && p ? { ...row, properties: p } : null;
            return (
              <li key={l.id}>
                <p className="font-medium">
                  {u?.properties?.name ?? "Property"} · Unit {u?.label ?? "—"}
                </p>
                <p className="text-sm text-[var(--muted)]">{u?.properties?.city}</p>
              </li>
            );
          })}
          {leases?.length === 0 ? (
            <li className="text-[var(--muted)]">
              No active leases linked yet. Ask your landlord to add your email to the lease, then
              refresh after signing in with the same address.
            </li>
          ) : null}
        </ul>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Upcoming charges</h2>
          <Link href="/dashboard/tenant/invoices" className="text-sm text-[var(--accent)] hover:underline">
            View all
          </Link>
        </div>
        <ul className="mt-4 space-y-6">
          {(openInv ?? []).map((inv) => {
            const lease = leaseById.get(inv.lease_id);
            type U = {
              label: string;
              zelle_handle: string | null;
              cashapp_handle: string | null;
              payment_instructions: string | null;
              properties: { name: string } | { name: string }[];
            };
            const raw = lease?.units as unknown as U | U[] | null;
            const unit = Array.isArray(raw) ? raw[0] ?? null : raw;
            const pRaw = unit?.properties;
            const property = Array.isArray(pRaw) ? pRaw[0] ?? null : pRaw ?? null;
            const late = inv.late_fee_waived ? 0 : inv.late_fee_cents ?? 0;
            const total = inv.amount_cents + late;
            const periodLabel = `${inv.period_year}-${String(inv.period_month).padStart(2, "0")}`;
            return (
              <li key={inv.id} className="space-y-3 border-b border-[var(--border)] pb-6 last:border-0 last:pb-0">
                <div className="flex flex-wrap justify-between gap-2 text-sm">
                  <span className="font-medium">{periodLabel}</span>
                  <span className="font-semibold">{formatMoney(total)}</span>
                </div>
                <p className="text-sm text-[var(--muted)]">
                  Due {inv.due_date} · <span className="capitalize">{inv.status}</span>
                </p>
                {unit ? (
                  <PaymentInstructions
                    unit={{ ...unit, label: unit.label }}
                    propertyName={property?.name}
                    amountLabel={formatMoney(total)}
                    periodLabel={periodLabel}
                  />
                ) : null}
              </li>
            );
          })}
          {openInv?.length === 0 ? (
            <li className="text-[var(--muted)]">You&apos;re all caught up — no open invoices.</li>
          ) : null}
        </ul>
        <p className="mt-4 text-sm text-[var(--muted)]">
          Manage text and email reminders in{" "}
          <Link href="/dashboard/tenant/settings" className="text-[var(--accent)] hover:underline">
            notification settings
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
