"use client";

import { registerPlatformDocument } from "@/app/dashboard/admin/documents/actions";
import { createClient } from "@/lib/supabase/client";
import { PROP_MAN_STORAGE_BUCKET } from "@/lib/supabase/storage";
import { useRouter } from "next/navigation";
import { useState } from "react";

const KIND_OPTIONS = [
  { value: "other", label: "Resource / guide" },
  { value: "notice", label: "Notice template" },
  { value: "lease", label: "Lease template" },
  { value: "rental_application", label: "Application template" },
] as const;

export function AdminDocumentUpload() {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileCount, setFileCount] = useState(0);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const files = Array.from(fileInput.files ?? []);
    const kind = (form.elements.namedItem("kind") as HTMLSelectElement).value;
    const description = (
      form.elements.namedItem("description") as HTMLTextAreaElement
    ).value.trim();

    if (!files.length) {
      setStatus("Choose one or more files.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setStatus("Not signed in.");
      setLoading(false);
      return;
    }

    let uploaded = 0;
    const failures: string[] = [];

    for (const file of files) {
      setStatus(`Uploading ${uploaded + 1} of ${files.length}…`);
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `platform/${user.id}/${crypto.randomUUID()}-${safeName}`;

      const { error: upErr } = await supabase.storage
        .from(PROP_MAN_STORAGE_BUCKET)
        .upload(path, file, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });
      if (upErr) {
        failures.push(`${file.name}: ${upErr.message}`);
        continue;
      }

      const reg = await registerPlatformDocument({
        storagePath: path,
        filename: file.name,
        kind,
        description: description || null,
      });
      if (reg.error) {
        await supabase.storage.from(PROP_MAN_STORAGE_BUCKET).remove([path]);
        failures.push(`${file.name}: ${reg.error}`);
        continue;
      }

      uploaded += 1;
    }

    form.reset();
    setFileCount(0);

    if (failures.length && uploaded === 0) {
      setStatus(failures[0]);
    } else if (failures.length) {
      setStatus(
        `Uploaded ${uploaded} of ${files.length}. ${failures.length} failed: ${failures[0]}`,
      );
    } else {
      setStatus(uploaded === 1 ? "Uploaded 1 file." : `Uploaded ${uploaded} files.`);
    }

    setLoading(false);
    router.refresh();
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Upload documents</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Select one or many files. Files upload one at a time so large batches stay reliable.
      </p>
      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div>
          <label htmlFor="admin_file" className="text-sm font-medium">
            Files
          </label>
          <input
            id="admin_file"
            name="file"
            type="file"
            required
            multiple
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.txt,.xlsx,.csv"
            onChange={(e) => setFileCount(e.target.files?.length ?? 0)}
            className="mt-1 block w-full text-sm"
          />
          <p className="mt-1 text-xs text-[var(--muted)]">
            Same document type and description apply to all selected files.
            {fileCount > 0 ? ` ${fileCount} selected.` : ""}
          </p>
        </div>
        <div>
          <label htmlFor="admin_kind" className="text-sm font-medium">
            Document type
          </label>
          <select
            id="admin_kind"
            name="kind"
            defaultValue="other"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          >
            {KIND_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="admin_description" className="text-sm font-medium">
            Description <span className="text-[var(--muted)]">(optional)</span>
          </label>
          <textarea
            id="admin_description"
            name="description"
            rows={2}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          />
        </div>
        {status ? <p className="text-sm text-[var(--muted)]">{status}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading
            ? "Uploading…"
            : fileCount > 1
              ? `Upload ${fileCount} files`
              : "Upload files"}
        </button>
      </form>
    </section>
  );
}
