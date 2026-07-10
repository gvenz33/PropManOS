"use client";

import { registerDocument } from "@/app/dashboard/actions";
import type { DocumentCategory, DocumentKind } from "@/lib/documents";
import { createClient } from "@/lib/supabase/client";
import { PROP_MAN_STORAGE_BUCKET } from "@/lib/supabase/storage";
import { useRouter } from "next/navigation";
import { useState } from "react";

type KindOption = { value: DocumentKind; label: string };

export function DocumentUpload({
  propertyId,
  unitId,
  leaseId,
  category = "internal",
  kindOptions,
  defaultKind,
  compact = false,
  title = "Upload documents",
}: {
  propertyId?: string;
  unitId?: string;
  leaseId?: string;
  category?: DocumentCategory;
  kindOptions: KindOption[];
  defaultKind?: DocumentKind;
  compact?: boolean;
  title?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileCount, setFileCount] = useState(0);
  const resolvedDefaultKind = defaultKind ?? kindOptions[0]?.value ?? "other";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const files = Array.from(fileInput.files ?? []);
    const kind = (form.elements.namedItem("kind") as HTMLSelectElement).value;

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
      const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;

      const { error: upErr } = await supabase.storage
        .from(PROP_MAN_STORAGE_BUCKET)
        .upload(path, file, { upsert: false });
      if (upErr) {
        failures.push(`${file.name}: ${upErr.message}`);
        continue;
      }

      const reg = await registerDocument({
        propertyId: propertyId ?? null,
        unitId: unitId ?? null,
        leaseId: leaseId ?? null,
        category,
        storagePath: path,
        filename: file.name,
        kind,
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
      setStatus(
        uploaded === 1 ? "Uploaded 1 file." : `Uploaded ${uploaded} files.`,
      );
    }
    setLoading(false);
    router.refresh();
  }

  const wrapperClass = compact
    ? "mt-3 rounded-lg border border-[var(--border)] bg-[var(--background)] p-4"
    : "rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm";

  return (
    <section className={wrapperClass}>
      <h3 className={compact ? "text-sm font-semibold" : "text-lg font-semibold"}>{title}</h3>
      <form onSubmit={onSubmit} className={`${compact ? "mt-3" : "mt-4"} space-y-3`}>
        <div>
          <label className="text-sm font-medium">Files</label>
          <input
            name="file"
            type="file"
            required
            multiple
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.txt"
            onChange={(e) => setFileCount(e.target.files?.length ?? 0)}
            className="mt-1 block w-full text-sm"
          />
          <p className="mt-1 text-xs text-[var(--muted)]">
            Select multiple files at once. Same document type applies to all.
            {fileCount > 0 ? ` ${fileCount} selected.` : ""}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium">Document type</label>
          <select
            name="kind"
            defaultValue={resolvedDefaultKind}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          >
            {kindOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
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
              : "Upload"}
        </button>
      </form>
    </section>
  );
}
