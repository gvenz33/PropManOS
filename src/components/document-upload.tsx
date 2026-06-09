"use client";

import { documentKindLabel, type DocumentKind } from "@/lib/documents";
import { createClient } from "@/lib/supabase/client";
import { PROP_MAN_STORAGE_BUCKET } from "@/lib/supabase/storage";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { registerDocument } from "@/app/dashboard/actions";

type KindOption = { value: DocumentKind; label: string };

export function DocumentUpload({
  propertyId,
  leaseId,
  unitId,
  kindOptions,
  defaultKind,
  hideLeasePicker = false,
  leaseOptions = [],
  compact = false,
  title = "Upload document",
}: {
  propertyId?: string;
  leaseId?: string;
  unitId?: string;
  kindOptions: KindOption[];
  defaultKind?: DocumentKind;
  hideLeasePicker?: boolean;
  leaseOptions?: { id: string; label: string }[];
  compact?: boolean;
  title?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const resolvedDefaultKind = defaultKind ?? kindOptions[0]?.value ?? "other";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput.files?.[0];
    const selectedLeaseId =
      leaseId ??
      ((form.elements.namedItem("lease_id") as HTMLSelectElement | null)?.value || "") ||
      null;
    const kind = (form.elements.namedItem("kind") as HTMLSelectElement).value;

    if (!file) {
      setStatus("Choose a file.");
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

    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;

    const { error: upErr } = await supabase.storage.from(PROP_MAN_STORAGE_BUCKET).upload(path, file, {
      upsert: false,
    });
    if (upErr) {
      setStatus(upErr.message);
      setLoading(false);
      return;
    }

    const reg = await registerDocument({
      propertyId: propertyId ?? null,
      leaseId: selectedLeaseId,
      unitId: unitId ?? null,
      storagePath: path,
      filename: file.name,
      kind,
    });
    if (reg.error) {
      setStatus(reg.error);
      setLoading(false);
      return;
    }

    form.reset();
    setStatus("Uploaded.");
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
          <label className="text-sm font-medium">File</label>
          <input
            name="file"
            type="file"
            required
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.txt"
            className="mt-1 block w-full text-sm"
          />
        </div>
        {!hideLeasePicker && !leaseId ? (
          <div>
            <label className="text-sm font-medium">Lease / tenant</label>
            <select
              name="lease_id"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            >
              <option value="">Portfolio-level (not tied to a lease)</option>
              {leaseOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
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
          {loading ? "Uploading…" : "Upload"}
        </button>
      </form>
    </section>
  );
}

export function kindOptionsFrom(values: DocumentKind[]): KindOption[] {
  return values.map((value) => ({ value, label: documentKindLabel(value) }));
}
