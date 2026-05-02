"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { registerDocument } from "../../actions";

export function DocumentUpload({
  leaseOptions,
}: {
  leaseOptions: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput.files?.[0];
    const leaseId = (form.elements.namedItem("lease_id") as HTMLSelectElement).value || "";
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

    const { error: upErr } = await supabase.storage.from("documents").upload(path, file, {
      upsert: false,
    });
    if (upErr) {
      setStatus(upErr.message);
      setLoading(false);
      return;
    }

    const reg = await registerDocument({
      leaseId: leaseId || null,
      unitId: null,
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

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Upload</h2>
      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div>
          <label className="text-sm font-medium">File</label>
          <input
            name="file"
            type="file"
            required
            className="mt-1 block w-full text-sm"
          />
        </div>
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
        <div>
          <label className="text-sm font-medium">Type</label>
          <select
            name="kind"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          >
            <option value="lease">Lease</option>
            <option value="notice">Notice</option>
            <option value="receipt">Receipt</option>
            <option value="other">Other</option>
          </select>
        </div>
        {status ? <p className="text-sm text-[var(--muted)]">{status}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Uploading…" : "Upload document"}
        </button>
      </form>
    </section>
  );
}
