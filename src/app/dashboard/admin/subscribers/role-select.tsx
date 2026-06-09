"use client";

import { ROLE_LABELS, type UserRole } from "@/lib/brand";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateSubscriberRole } from "../actions";

export function SubscriberRoleSelect({
  profileId,
  currentRole,
  disabled,
}: {
  profileId: string;
  currentRole: UserRole;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>(currentRole);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onChange(nextRole: UserRole) {
    setRole(nextRole);
    setLoading(true);
    setStatus(null);
    const result = await updateSubscriberRole(profileId, nextRole);
    setLoading(false);
    if (result.error) {
      setStatus(result.error);
      setRole(currentRole);
      return;
    }
    setStatus("Saved");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <select
        value={role}
        disabled={disabled || loading}
        onChange={(e) => onChange(e.target.value as UserRole)}
        className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm"
      >
        {(Object.keys(ROLE_LABELS) as UserRole[]).map((value) => (
          <option key={value} value={value}>
            {ROLE_LABELS[value]}
          </option>
        ))}
      </select>
      {status ? <span className="text-xs text-[var(--muted)]">{status}</span> : null}
    </div>
  );
}
