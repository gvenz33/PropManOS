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
    .select("id, tenant_email, units(label, properties(name, city))")
    .eq("tenant_id", user.id)
    .eq("status", "active");

  const leaseIds = (leases ?? []).map((l) => l.id);
  const { data: openInv } =
    leaseIds.length > 0
      ? await supabase
          .from("invoices")
          .select("id, due_date, amount_cents, late_fee_cents, late_fee_waived, status")
          .in("lease_id", leaseIds)
          .in("status", ["open", "late"])
          .order("due_date", { ascending: true })
          .limit(5)
      : { data: [] as never[] };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Your home</h1>
        <p className="mt-1 text-[var(--muted)]">
          Pay rent, review notices, and keep documents in one place.
        </p>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Active leases</h2>
        <ul className="mt-4 space-y-3">
          {(leases ?? []).map((l) => {
            type U = {
              label: string;
              properties: { name: string; city: string | null } | { name: string; city: string | null }[];
            };
            const raw = l.units as unknown as U | U[] | null;
            const row = Array.isArray(raw) ? raw[0] ?? null : raw;
            const pRaw = row?.properties;
            const p = Array.isArray(pRaw) ? pRaw[0] ?? null : pRaw ?? null;
            const u = row && p ? { label: row.label, properties: p } : null;
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
        <ul className="mt-4 space-y-3">
          {(openInv ?? []).map((inv) => {
            const late = inv.late_fee_waived ? 0 : inv.late_fee_cents ?? 0;
            const total = inv.amount_cents + late;
            return (
              <li key={inv.id} className="flex flex-wrap justify-between gap-2 text-sm">
                <span className="text-[var(--muted)]">Due {inv.due_date}</span>
                <span className="font-medium">{formatMoney(total)}</span>
                <span className="w-full capitalize text-[var(--muted)]">{inv.status}</span>
              </li>
            );
          })}
          {openInv?.length === 0 ? (
            <li className="text-[var(--muted)]">You&apos;re all caught up — no open invoices.</li>
          ) : null}
        </ul>
        <p className="mt-4 text-sm text-[var(--muted)]">
          When online payments are enabled, a Pay button will appear here. Until then, use the
          instructions from your landlord.
        </p>
      </section>
    </div>
  );
}
