"use server";

import { BRAND } from "@/lib/brand";
import { sendEmail } from "@/lib/notifications/outbound";
import { PROP_MAN_STORAGE_BUCKET } from "@/lib/supabase/storage";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") throw new Error("Admin access required.");
  return { supabase, user, profile };
}

function documentsPath(query?: string) {
  return `/dashboard/admin/documents${query ? `?${query}` : ""}`;
}

export async function uploadPlatformDocument(formData: FormData): Promise<void> {
  const { user } = await requireAdmin();
  const files = formData
    .getAll("file")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const kind = String(formData.get("kind") ?? "other").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!files.length) {
    redirect(documentsPath(`error=${encodeURIComponent("Choose one or more files to upload.")}`));
  }

  const service = createServiceClient();
  if (!service) {
    redirect(documentsPath(`error=${encodeURIComponent("Upload is temporarily unavailable.")}`));
  }

  let uploaded = 0;
  let lastError: string | null = null;

  for (const file of files) {
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const storagePath = `platform/${user.id}/${crypto.randomUUID()}-${safeName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await service.storage
      .from(PROP_MAN_STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
    if (uploadError) {
      lastError = uploadError.message;
      continue;
    }

    const { error } = await service.from("documents").insert({
      owner_id: user.id,
      uploaded_by: user.id,
      storage_path: storagePath,
      filename: file.name,
      kind,
      category: "internal",
      source: "platform",
      metadata: description ? { description } : {},
    });
    if (error) {
      await service.storage.from(PROP_MAN_STORAGE_BUCKET).remove([storagePath]);
      lastError = error.message;
      continue;
    }

    uploaded += 1;
  }

  revalidatePath("/dashboard/admin/documents");

  if (uploaded === 0) {
    redirect(
      documentsPath(
        `error=${encodeURIComponent(lastError ?? "Could not upload files.")}`,
      ),
    );
  }

  if (lastError && uploaded < files.length) {
    redirect(
      documentsPath(
        `success=docs-uploaded&count=${uploaded}&error=${encodeURIComponent(
          `Uploaded ${uploaded} of ${files.length}. Some files failed: ${lastError}`,
        )}`,
      ),
    );
  }

  redirect(
    documentsPath(
      uploaded === 1
        ? "success=doc-uploaded"
        : `success=docs-uploaded&count=${uploaded}`,
    ),
  );
}

export async function deletePlatformDocument(formData: FormData): Promise<void> {
  await requireAdmin();
  const documentId = String(formData.get("document_id") ?? "").trim();
  if (!documentId) redirect(documentsPath());

  const service = createServiceClient();
  if (!service) {
    redirect(documentsPath(`error=${encodeURIComponent("Delete is temporarily unavailable.")}`));
  }

  const { data: doc } = await service
    .from("documents")
    .select("id, storage_path, source")
    .eq("id", documentId)
    .eq("source", "platform")
    .maybeSingle();

  if (!doc) {
    redirect(documentsPath(`error=${encodeURIComponent("Document not found.")}`));
  }

  await service.storage.from(PROP_MAN_STORAGE_BUCKET).remove([doc.storage_path]);
  const { error } = await service.from("documents").delete().eq("id", documentId);
  if (error) {
    redirect(documentsPath(`error=${encodeURIComponent(error.message)}`));
  }

  revalidatePath("/dashboard/admin/documents");
  redirect(documentsPath("success=doc-deleted"));
}

async function notifyLandlordShare(
  ownerEmail: string,
  ownerName: string,
  filename: string,
  message: string | null,
) {
  const body = `Hello${ownerName ? ` ${ownerName}` : ""},

A new document has been shared with you on ${BRAND.name}:

${filename}
${message ? `\nMessage from the admin team:\n${message}\n` : ""}
Sign in to your landlord dashboard → Documents → Site resources to download it.

— ${BRAND.name}`;

  await sendEmail(ownerEmail, `New document shared on ${BRAND.name}`, body);
}

export async function sharePlatformDocument(formData: FormData): Promise<void> {
  const { user, profile } = await requireAdmin();
  const documentId = String(formData.get("document_id") ?? "").trim();
  const ownerId = String(formData.get("owner_id") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim() || null;
  const notify = formData.get("notify") === "on";

  if (!documentId || !ownerId) {
    redirect(documentsPath(`error=${encodeURIComponent("Choose a document and landlord.")}`));
  }

  const service = createServiceClient();
  if (!service) {
    redirect(documentsPath(`error=${encodeURIComponent("Sharing is temporarily unavailable.")}`));
  }

  const { data: doc } = await service
    .from("documents")
    .select("id, filename, source")
    .eq("id", documentId)
    .eq("source", "platform")
    .maybeSingle();
  if (!doc) {
    redirect(documentsPath(`error=${encodeURIComponent("Document not found.")}`));
  }

  const { data: owner } = await service
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", ownerId)
    .eq("role", "owner")
    .maybeSingle();
  if (!owner?.email) {
    redirect(documentsPath(`error=${encodeURIComponent("Landlord not found.")}`));
  }

  const { error } = await service.from("platform_document_shares").upsert(
    {
      document_id: documentId,
      owner_id: ownerId,
      shared_by: user.id,
      message,
      shared_at: new Date().toISOString(),
    },
    { onConflict: "document_id,owner_id" },
  );
  if (error) {
    redirect(documentsPath(`error=${encodeURIComponent(error.message)}`));
  }

  if (notify) {
    await notifyLandlordShare(
      owner.email,
      owner.full_name ?? "",
      doc.filename,
      message ?? `Shared by ${profile.full_name || "site admin"}`,
    );
  }

  revalidatePath("/dashboard/admin/documents");
  revalidatePath("/dashboard/owner/documents");
  redirect(documentsPath("success=doc-shared"));
}

export async function sharePlatformDocumentBulk(formData: FormData): Promise<void> {
  const { user, profile } = await requireAdmin();
  const documentId = String(formData.get("document_id") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim() || null;
  const notify = formData.get("notify") === "on";

  if (!documentId) {
    redirect(documentsPath(`error=${encodeURIComponent("Choose a document to share.")}`));
  }

  const service = createServiceClient();
  if (!service) {
    redirect(documentsPath(`error=${encodeURIComponent("Sharing is temporarily unavailable.")}`));
  }

  const { data: doc } = await service
    .from("documents")
    .select("id, filename, source")
    .eq("id", documentId)
    .eq("source", "platform")
    .maybeSingle();
  if (!doc) {
    redirect(documentsPath(`error=${encodeURIComponent("Document not found.")}`));
  }

  const { data: owners } = await service
    .from("profiles")
    .select("id, email, full_name")
    .eq("role", "owner")
    .not("email", "is", null);

  if (!owners?.length) {
    redirect(documentsPath(`error=${encodeURIComponent("No landlord accounts to share with.")}`));
  }

  const rows = owners.map((owner) => ({
    document_id: documentId,
    owner_id: owner.id,
    shared_by: user.id,
    message,
    shared_at: new Date().toISOString(),
  }));

  const { error } = await service.from("platform_document_shares").upsert(rows, {
    onConflict: "document_id,owner_id",
  });
  if (error) {
    redirect(documentsPath(`error=${encodeURIComponent(error.message)}`));
  }

  if (notify) {
    for (const owner of owners) {
      if (!owner.email) continue;
      await notifyLandlordShare(
        owner.email,
        owner.full_name ?? "",
        doc.filename,
        message ?? `Shared by ${profile.full_name || "site admin"}`,
      );
    }
  }

  revalidatePath("/dashboard/admin/documents");
  revalidatePath("/dashboard/owner/documents");
  redirect(documentsPath(`success=doc-shared-bulk&count=${owners.length}`));
}
