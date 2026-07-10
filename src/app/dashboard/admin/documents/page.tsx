import { ActionMessage } from "@/components/action-message";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PlatformDocumentLibrary } from "./library";
import { AdminDocumentUpload } from "./upload";

export default async function AdminDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string; count?: string }>;
}) {
  const { success, error, count } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: platformDocs } = await supabase
    .from("documents")
    .select("id, filename, kind, created_at, metadata")
    .eq("source", "platform")
    .order("created_at", { ascending: false });

  const { data: owners } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "owner")
    .order("full_name", { ascending: true });

  const { data: shareCounts } = await supabase
    .from("platform_document_shares")
    .select("document_id");

  const shareCountByDoc = new Map<string, number>();
  for (const row of shareCounts ?? []) {
    shareCountByDoc.set(row.document_id, (shareCountByDoc.get(row.document_id) ?? 0) + 1);
  }

  const docs =
    platformDocs?.map((doc) => {
      const description =
        typeof doc.metadata === "object" &&
        doc.metadata &&
        "description" in doc.metadata &&
        typeof (doc.metadata as { description?: unknown }).description === "string"
          ? (doc.metadata as { description: string }).description
          : null;

      return {
        id: doc.id,
        filename: doc.filename,
        kind: doc.kind,
        created_at: doc.created_at,
        description,
        sharedCount: shareCountByDoc.get(doc.id) ?? 0,
      };
    }) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Upload platform resources and share them with landlords individually or in bulk.
        </p>
      </div>

      <ActionMessage success={success} error={error} count={count} />
      <AdminDocumentUpload />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Platform library</h2>
        <PlatformDocumentLibrary docs={docs} owners={owners ?? []} />
      </section>
    </div>
  );
}
