"use client";

import { useState } from "react";

type Contact = { id: string; name: string; email: string | null };

type Props = {
  properties: { id: string; name: string }[];
  contacts: Contact[];
  defaultYear: number;
  defaultMonth: number;
};

export function MonthlyReportPanel({
  properties,
  contacts,
  defaultYear,
  defaultMonth,
}: Props) {
  const [year, setYear] = useState(defaultYear);
  const [month, setMonth] = useState(defaultMonth);
  const [propertyId, setPropertyId] = useState("");
  const [contactId, setContactId] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"download" | "email" | null>(null);

  function queryString() {
    const params = new URLSearchParams({
      year: String(year),
      month: String(month),
    });
    if (propertyId) params.set("property_id", propertyId);
    return params.toString();
  }

  async function download() {
    setBusy("download");
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/reports/monthly-summary?${queryString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Download failed.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `got-my-rent-summary-${year}-${String(month).padStart(2, "0")}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage("Excel report downloaded.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed.");
    } finally {
      setBusy(null);
    }
  }

  async function emailReport() {
    setBusy("email");
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/reports/monthly-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year,
          month,
          property_id: propertyId || null,
          recipient_email: recipientEmail,
          recipient_name: recipientName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Email failed.");
      setMessage(`Report emailed to ${recipientEmail}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Email failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="dashboard-panel space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="text-sm font-medium">Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="dashboard-input mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Month</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="dashboard-input mt-1"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(2000, m - 1, 1).toLocaleString("en-US", { month: "long" })}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium">Property (optional)</label>
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="dashboard-input mt-1"
          >
            <option value="">All properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Owner contact (CRM)</label>
          <select
            value={contactId}
            onChange={(e) => {
              const id = e.target.value;
              setContactId(id);
              const c = contacts.find((x) => x.id === id);
              if (c) {
                setRecipientName(c.name);
                setRecipientEmail(c.email ?? "");
              }
            }}
            className="dashboard-input mt-1"
          >
            <option value="">Choose or type below</option>
            {contacts
              .filter((c) => c.email)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Owner email</label>
          <input
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="owner@example.com"
            className="dashboard-input mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Owner name (optional)</label>
          <input
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            className="dashboard-input mt-1"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={download}
          disabled={busy !== null}
          className="btn-primary disabled:opacity-60"
        >
          {busy === "download" ? "Preparing…" : "Download Excel"}
        </button>
        <button
          type="button"
          onClick={emailReport}
          disabled={busy !== null || !recipientEmail}
          className="btn-outline-blue disabled:opacity-60"
        >
          {busy === "email" ? "Sending…" : "Email to owner"}
        </button>
      </div>

      {error ? (
        <p className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-lg border border-[var(--accent)]/30 bg-[var(--accent-dim)]/40 px-4 py-3 text-sm">
          {message}
        </p>
      ) : null}

      <p className="text-xs text-[var(--muted)]">
        The Excel file includes a styled summary, unit rent table, and maintenance log. Email
        requires <code className="rounded bg-[var(--muted-bg)] px-1">RESEND_API_KEY</code> on
        Vercel.
      </p>
    </div>
  );
}
