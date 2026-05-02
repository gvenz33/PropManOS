import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createLease, createUnit } from "../../../actions";

type Props = { params: Promise<{ id: string }> };

export default async function OwnerPropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!property) notFound();

  const { data: units } = await supabase
    .from("units")
    .select("*, leases(id, tenant_email, status, rent_amount_cents)")
    .eq("property_id", id)
    .order("label");

  return (
    <div className="space-y-10">
      <div>
        <Link href="/dashboard/owner/properties" className="text-sm text-[var(--accent)] hover:underline">
          ← All properties
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{property.name}</h1>
        <p className="text-[var(--muted)]">
          {[property.address_line1, property.city, property.state, property.postal_code]
            .filter(Boolean)
            .join(", ") || "Add address details from the list view later."}
        </p>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Add unit</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Rent amounts are in cents for precision (e.g. $1,250.00 → 125000). Bank connection is a
          short note until Plaid/Stripe is wired.
        </p>
        <form action={createUnit} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="property_id" value={id} />
          <div>
            <label className="text-sm font-medium">Unit label</label>
            <input
              name="label"
              required
              placeholder="101"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Monthly rent (cents)</label>
            <input
              name="rent_amount_cents"
              type="number"
              required
              min={0}
              placeholder="125000"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Due day (1–28)</label>
            <input
              name="due_day_of_month"
              type="number"
              min={1}
              max={28}
              defaultValue={1}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Late fee (cents)</label>
            <input
              name="late_fee_cents"
              type="number"
              min={0}
              defaultValue={0}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Grace days</label>
            <input
              name="grace_days"
              type="number"
              min={0}
              defaultValue={0}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Bank / payout note</label>
            <input
              name="bank_connection_note"
              placeholder="Plaid item id, last4, etc."
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
            >
              Save unit
            </button>
          </div>
        </form>
      </section>

      <div className="space-y-6">
        {(units ?? []).map((u) => (
          <div
            key={u.id}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Unit {u.label}</h3>
                <p className="text-sm text-[var(--muted)]">
                  Rent ${(u.rent_amount_cents / 100).toFixed(2)} · Due day {u.due_day_of_month}
                  {u.late_fee_cents ? ` · Late fee $${(u.late_fee_cents / 100).toFixed(2)}` : ""}
                </p>
                {u.bank_connection_note ? (
                  <p className="mt-2 text-xs text-[var(--muted)]">Bank: {u.bank_connection_note}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-4 border-t border-[var(--border)] pt-4">
              <h4 className="text-sm font-semibold">Active leases</h4>
              <ul className="mt-2 space-y-2 text-sm">
                {(u.leases as { id: string; tenant_email: string; status: string }[] | null)?.map(
                  (l) => (
                    <li key={l.id} className="text-[var(--muted)]">
                      {l.tenant_email} · {l.status}
                    </li>
                  ),
                )}
                {!u.leases?.length ? (
                  <li className="text-[var(--muted)]">No leases yet for this unit.</li>
                ) : null}
              </ul>
            </div>

            <form action={createLease} className="mt-6 grid gap-3 border-t border-[var(--border)] pt-4 sm:grid-cols-2">
              <input type="hidden" name="unit_id" value={u.id} />
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Tenant email</label>
                <input
                  name="tenant_email"
                  type="email"
                  required
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                  placeholder="tenant@email.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Rent (cents)</label>
                <input
                  name="rent_amount_cents"
                  type="number"
                  required
                  min={0}
                  defaultValue={u.rent_amount_cents}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Start date</label>
                <input
                  name="start_date"
                  type="date"
                  required
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">End date (optional)</label>
                <input
                  name="end_date"
                  type="date"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--muted-bg)]"
                >
                  Add lease
                </button>
              </div>
            </form>
          </div>
        ))}
        {units?.length === 0 ? (
          <p className="text-[var(--muted)]">No units yet. Create one above.</p>
        ) : null}
      </div>
    </div>
  );
}
