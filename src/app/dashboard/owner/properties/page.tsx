import { ActionMessage } from "@/components/action-message";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { createProperty } from "../../actions";

export default async function OwnerPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { success, error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: rows } = await supabase
    .from("properties")
    .select("id, name, city, state, units(id)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const hasProperties = (rows?.length ?? 0) > 0;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Properties</h1>
        <p className="mt-1 text-[var(--muted)]">
          Add every building you manage, then open a property to add units and assign tenants.
        </p>
      </div>

      <ActionMessage success={success} error={error} />

      {!hasProperties ? (
        <section className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent-dim)]/20 p-6">
          <h2 className="font-semibold">Get started in 3 steps</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-[var(--muted)]">
            <li>Add a property below (name and address).</li>
            <li>Open the property and add each unit you rent out.</li>
            <li>Add a tenant email to each unit — they connect when they sign up.</li>
          </ol>
        </section>
      ) : null}

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold">New property</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Examples: duplex, apartment building, single-family rental, or a portfolio address.
        </p>
        <form action={createProperty} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Property name</label>
            <input
              name="name"
              required
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
              placeholder="Oak Street Apartments"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Street address</label>
            <input
              name="address_line1"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
              placeholder="123 Oak St"
            />
          </div>
          <div>
            <label className="text-sm font-medium">City</label>
            <input
              name="city"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">State</label>
            <input
              name="state"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Postal code</label>
            <input
              name="postal_code"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-end sm:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
            >
              Save property
            </button>
          </div>
        </form>
      </section>

      <ul className="space-y-3">
        {(rows ?? []).map((p) => {
          const unitCount = Array.isArray(p.units) ? p.units.length : 0;
          return (
            <li key={p.id}>
              <Link
                href={`/dashboard/owner/properties/${p.id}`}
                className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-4 shadow-sm transition hover:border-[var(--accent)]"
              >
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {[p.city, p.state].filter(Boolean).join(", ") || "No address yet"}
                    {unitCount ? ` · ${unitCount} unit${unitCount === 1 ? "" : "s"}` : " · No units yet"}
                  </p>
                </div>
                <span className="text-sm text-[var(--accent)]">Manage units & tenants →</span>
              </Link>
            </li>
          );
        })}
        {!hasProperties ? (
          <li className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-[var(--muted)]">
            No properties yet. Add your first one above.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
