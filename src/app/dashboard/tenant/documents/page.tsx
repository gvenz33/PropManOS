import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function TenantDocumentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
        <p className="mt-1 text-[var(--muted)]">
          Your landlord sends rental applications, agreements, and other forms directly to your email
          or phone. Check your inbox or messages for download links from Got My Rent.
        </p>
      </div>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--muted)] shadow-sm">
        Forms are not stored in this portal. If you need a rental application or lease document,
        contact your landlord and they can send it to you.
      </div>
    </div>
  );
}
