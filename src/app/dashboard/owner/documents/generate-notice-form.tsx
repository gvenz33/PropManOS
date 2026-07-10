"use client";

import { generateNoticeAction } from "@/app/dashboard/actions";
import { NOTICE_TYPE_LABELS, NOTICE_TYPES, type NoticeType } from "@/lib/documents";
import { useState } from "react";

type LeaseOption = {
  id: string;
  label: string;
};

export function GenerateNoticeForm({
  leases,
  defaultNoticeDate,
}: {
  leases: LeaseOption[];
  defaultNoticeDate: string;
}) {
  const [noticeType, setNoticeType] = useState<NoticeType>("3_day");

  return (
    <form action={generateNoticeAction} className="space-y-4">
      <div>
        <label htmlFor="lease_id" className="text-sm font-medium">
          Tenant / lease
        </label>
        <select
          id="lease_id"
          name="lease_id"
          required
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
        >
          <option value="">Select an active tenant…</option>
          {leases.map((lease) => (
            <option key={lease.id} value={lease.id}>
              {lease.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="notice_type" className="text-sm font-medium">
            Notice type
          </label>
          <select
            id="notice_type"
            name="notice_type"
            value={noticeType}
            onChange={(e) => setNoticeType(e.target.value as NoticeType)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          >
            {NOTICE_TYPES.map((type) => (
              <option key={type} value={type}>
                {NOTICE_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="notice_date" className="text-sm font-medium">
            Notice date
          </label>
          <input
            id="notice_date"
            name="notice_date"
            type="date"
            required
            defaultValue={defaultNoticeDate}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          />
        </div>
      </div>

      {noticeType === "3_day" ? (
        <div>
          <label htmlFor="amount_owed_dollars" className="text-sm font-medium">
            Amount owed
          </label>
          <input
            id="amount_owed_dollars"
            name="amount_owed_dollars"
            type="text"
            inputMode="decimal"
            placeholder="Defaults to monthly rent if blank"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          />
        </div>
      ) : null}

      <div>
        <label htmlFor="additional_notes" className="text-sm font-medium">
          Additional notes <span className="text-[var(--muted)]">(optional)</span>
        </label>
        <textarea
          id="additional_notes"
          name="additional_notes"
          rows={3}
          placeholder="Optional clauses, delivery method, or local ordinance references."
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
      >
        Generate PDF notice
      </button>
    </form>
  );
}
