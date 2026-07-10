"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function resourcesPath(query?: string) {
  return `/dashboard/owner/documents?tab=shared${query ? `&${query}` : ""}`;
}

async function requireOwner() {
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

  if (profile?.role !== "owner") {
    redirect("/dashboard");
  }

  return { supabase, user };
}

export async function addPlatformDocumentToLibrary(formData: FormData): Promise<void> {
  const { supabase, user } = await requireOwner();
  const documentId = String(formData.get("document_id") ?? "").trim();
  if (!documentId) {
    redirect(resourcesPath(`error=${encodeURIComponent("Choose a document to add.")}`));
  }

  const { data: doc } = await supabase
    .from("documents")
    .select("id, source")
    .eq("id", documentId)
    .eq("source", "platform")
    .maybeSingle();

  if (!doc) {
    redirect(resourcesPath(`error=${encodeURIComponent("Document not found.")}`));
  }

  const { data: existing } = await supabase
    .from("platform_document_shares")
    .select("id")
    .eq("document_id", documentId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (existing) {
    redirect(resourcesPath("success=resource-added"));
  }

  const { error } = await supabase.from("platform_document_shares").insert({
    document_id: documentId,
    owner_id: user.id,
    shared_by: user.id,
    message: "Added from Resource Center",
  });

  if (error) {
    redirect(resourcesPath(`error=${encodeURIComponent(error.message)}`));
  }

  revalidatePath("/dashboard/owner/documents");
  redirect(resourcesPath("success=resource-added"));
}

export async function bulkAddPlatformDocumentsToLibrary(formData: FormData): Promise<void> {
  const { supabase, user } = await requireOwner();
  const documentIds = formData
    .getAll("document_ids")
    .map((value) => String(value).trim())
    .filter(Boolean);
  const csv = String(formData.get("document_ids_csv") ?? "").trim();
  const ids = [
    ...new Set([
      ...documentIds,
      ...(csv ? csv.split(",").map((value) => value.trim()).filter(Boolean) : []),
    ]),
  ];

  if (!ids.length) {
    redirect(resourcesPath(`error=${encodeURIComponent("Select at least one document.")}`));
  }

  const { data: docs } = await supabase
    .from("documents")
    .select("id")
    .in("id", ids)
    .eq("source", "platform");

  if (!docs?.length) {
    redirect(resourcesPath(`error=${encodeURIComponent("Documents not found.")}`));
  }

  const { data: already } = await supabase
    .from("platform_document_shares")
    .select("document_id")
    .eq("owner_id", user.id)
    .in("document_id", docs.map((doc) => doc.id));

  const alreadyIds = new Set((already ?? []).map((row) => row.document_id));
  const toAdd = docs.filter((doc) => !alreadyIds.has(doc.id));

  if (!toAdd.length) {
    redirect(resourcesPath("success=resources-added&count=0"));
  }

  const rows = toAdd.map((doc) => ({
    document_id: doc.id,
    owner_id: user.id,
    shared_by: user.id,
    message: "Added from Resource Center",
  }));

  const { error } = await supabase.from("platform_document_shares").insert(rows);

  if (error) {
    redirect(resourcesPath(`error=${encodeURIComponent(error.message)}`));
  }

  revalidatePath("/dashboard/owner/documents");
  redirect(resourcesPath(`success=resources-added&count=${toAdd.length}`));
}

export async function removePlatformDocumentFromLibrary(formData: FormData): Promise<void> {
  const { supabase, user } = await requireOwner();
  const documentId = String(formData.get("document_id") ?? "").trim();
  if (!documentId) redirect(resourcesPath());

  const { error } = await supabase
    .from("platform_document_shares")
    .delete()
    .eq("document_id", documentId)
    .eq("owner_id", user.id);

  if (error) {
    redirect(resourcesPath(`error=${encodeURIComponent(error.message)}`));
  }

  revalidatePath("/dashboard/owner/documents");
  redirect(resourcesPath("success=resource-removed"));
}
