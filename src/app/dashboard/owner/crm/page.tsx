import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createCrmActivity, createCrmContact } from "../../actions";

export default async function OwnerCrmPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: contacts } = await supabase
    .from("crm_contacts")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const { data: activities } = await supabase
    .from("crm_activities")
    .select("*, crm_contacts(name)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(40);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">CRM</h1>
        <p className="mt-1 text-[var(--muted)]">
          Lightweight pipeline for owners, prospects, and vendors — alongside your tenants.
        </p>
      </div>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <h2 className="text-lg font-semibold">New contact</h2>
          <form action={createCrmContact} className="mt-4 space-y-3">
            <div>
              <label className="text-sm font-medium">Name</label>
              <input name="name" required className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input name="email" type="email" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <input name="phone" type="tel" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea name="notes" rows={3} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
            </div>
            <button type="submit" className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white">
              Save contact
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Log activity</h2>
          <form action={createCrmActivity} className="mt-4 space-y-3">
            <div>
              <label className="text-sm font-medium">Contact</label>
              <select
                name="contact_id"
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {(contacts ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Title</label>
              <input name="title" required className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <select name="activity_type" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm">
                <option value="note">Note</option>
                <option value="call">Call</option>
                <option value="email">Email</option>
                <option value="task">Task</option>
                <option value="showing">Showing</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Due (optional)</label>
              <input name="due_at" type="datetime-local" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
            </div>
            <button type="submit" className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--muted-bg)]">
              Save activity
            </button>
          </form>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold">Contacts</h2>
          <ul className="mt-4 space-y-3">
            {(contacts ?? []).map((c) => (
              <li key={c.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                <p className="font-medium">{c.name}</p>
                <p className="text-sm text-[var(--muted)]">
                  {[c.email, c.phone].filter(Boolean).join(" · ") || "—"}
                </p>
                {c.notes ? <p className="mt-2 text-sm text-[var(--muted)]">{c.notes}</p> : null}
              </li>
            ))}
            {contacts?.length === 0 ? (
              <li className="text-[var(--muted)]">No contacts yet.</li>
            ) : null}
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Recent activity</h2>
          <ul className="mt-4 space-y-3">
            {(activities ?? []).map((a) => {
              const cr = a.crm_contacts as { name: string } | { name: string }[] | null;
              const contact = Array.isArray(cr) ? cr[0] ?? null : cr;
              return (
                <li key={a.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm">
                  <p className="font-medium">{a.title}</p>
                  <p className="text-[var(--muted)]">
                    {a.activity_type}
                    {contact?.name ? ` · ${contact.name}` : ""}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {new Date(a.created_at).toLocaleString()}
                  </p>
                </li>
              );
            })}
            {activities?.length === 0 ? (
              <li className="text-[var(--muted)]">No activity yet.</li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
