"use client";

import { sendRentalFormAction } from "@/app/dashboard/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type FormRecipient = {
  key: string;
  label: string;
  email: string;
  phone: string;
};

export function SendRentalForm({
  documentId,
  documentName,
  propertyId,
  recipients,
}: {
  documentId: string;
  documentName: string;
  propertyId: string;
  recipients: FormRecipient[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("document_id", documentId);
    formData.set("property_id", propertyId);

    const result = await sendRentalFormAction(formData);
    setLoading(false);

    if (result.error) {
      setStatus(result.error);
      return;
    }

    const parts = result.sent ?? [];
    if (!parts.length) {
      setStatus("Nothing sent. Choose email or text and provide contact info.");
      return;
    }

    const failed = parts.filter((p) => !p.ok);
    if (failed.length) {
      setStatus(failed.map((p) => `${p.channel}: ${p.error ?? "failed"}`).join(" · "));
      return;
    }

    setStatus(`Sent ${documentName} via ${parts.map((p) => p.channel).join(" and ")}.`);
    form.reset();
    router.refresh();
  }

  function fillRecipient(key: string, form: HTMLFormElement) {
    const recipient = recipients.find((r) => r.key === key);
    if (!recipient) return;
    const emailInput = form.elements.namedItem("recipient_email") as HTMLInputElement;
    const phoneInput = form.elements.namedItem("recipient_phone") as HTMLInputElement;
    const nameInput = form.elements.namedItem("recipient_name") as HTMLInputElement;
    if (emailInput) emailInput.value = recipient.email;
    if (phoneInput) phoneInput.value = recipient.phone;
    if (nameInput) nameInput.value = recipient.label.replace(/ \((prospect|tenant)\)$/, "");
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-[var(--accent)]/40 px-3 py-1.5 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent-dim)]"
      >
        Send
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-3 rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Send {documentName}</p>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setStatus(null);
          }}
          className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          Close
        </button>
      </div>
      {recipients.length ? (
        <div>
          <label className="text-sm font-medium">Recipient</label>
          <select
            name="recipient_key"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
            onChange={(e) => fillRecipient(e.target.value, e.currentTarget.form!)}
          >
            <option value="">Choose a prospect or tenant…</option>
            {recipients.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div>
        <label className="text-sm font-medium">Name (optional)</label>
        <input
          name="recipient_name"
          placeholder="Jordan Smith"
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            name="recipient_email"
            type="email"
            placeholder="prospect@email.com"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Phone</label>
          <input
            name="recipient_phone"
            type="tel"
            placeholder="+1 555 123 4567"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Message (optional)</label>
        <textarea
          name="message"
          rows={2}
          placeholder="Please complete and return this application at your earliest convenience."
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input name="send_email" type="checkbox" defaultChecked className="rounded" />
          Send email
        </label>
        <label className="flex items-center gap-2">
          <input name="send_sms" type="checkbox" className="rounded" />
          Send text
        </label>
      </div>
      {status ? <p className="text-sm text-[var(--muted)]">{status}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Sending…" : "Send form"}
      </button>
    </form>
  );
}
