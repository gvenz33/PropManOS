import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function TenantDocumentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: leases } = await supabase.from("leases").select("id").eq("tenant_id", user.id);
  const leaseIds = (leases ?? []).map((l) => l.id);

  const { data: docs } =
    leaseIds.length > 0
      ? await supabase
          .from("documents")
          .select("id, filename, kind, created_at")
          .in("lease_id", leaseIds)
          .order("created_at", { ascending: false })
      : { data: [] as never[] };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
        <p className="mt-1 text-[var(--muted)]">
          Files your landlord shared for your lease. Download links can be added via a signed-URL
          API route.
        </p>
      </div>
      <ul className="space-y-3">
        {(docs ?? []).map((d) => (
          <li
            key={d.id}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm"
          >
            <p className="font-medium">{d.filename}</p>
            <p className="text-sm text-[var(--muted)]">
              {d.kind} · {new Date(d.created_at).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
      {docs?.length === 0 ? (
        <p className="text-[var(--muted)]">No documents linked to your leases yet.</p>
      ) : null}
    </div>
  );
}
