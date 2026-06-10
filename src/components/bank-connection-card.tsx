"use client";

import { formatBankLabel } from "@/lib/plaid/format-bank-label";
import type { BankConnectionRow } from "@/lib/plaid/bank-connections";
import type { BankConnectionPurpose } from "@/lib/plaid/client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlaidLink } from "react-plaid-link";

type Props = {
  purpose: BankConnectionPurpose;
  connection: BankConnectionRow | null;
  configured: boolean;
  onConnected?: () => void;
};

export function BankConnectionCard({
  purpose,
  connection,
  configured,
  onConnected,
}: Props) {
  const router = useRouter();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loadingToken, setLoadingToken] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  const fetchLinkToken = useCallback(async () => {
    setLoadingToken(true);
    setError(null);
    try {
      const res = await fetch("/api/plaid/link-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose }),
      });
      const data = (await res.json()) as { link_token?: string; error?: string };
      if (!res.ok || !data.link_token) {
        throw new Error(data.error ?? "Could not start bank linking");
      }
      setLinkToken(data.link_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start bank linking");
    } finally {
      setLoadingToken(false);
    }
  }, [purpose]);

  const onSuccess = useCallback(
    async (
      publicToken: string,
      metadata: {
        institution?: { name?: string | null } | null;
        accounts?: Array<{
          id: string;
          name?: string | null;
          mask?: string | null;
          subtype?: string | null;
        }>;
      },
    ) => {
      setError(null);
      setMessage(null);
      const account = metadata.accounts?.[0];
      if (!account?.id) {
        setError("No bank account was selected");
        return;
      }

      try {
        const res = await fetch("/api/plaid/exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            public_token: publicToken,
            account_id: account.id,
            purpose,
            institution_name: metadata.institution?.name ?? null,
            account_name: account.name ?? null,
            account_mask: account.mask ?? null,
            account_subtype: account.subtype ?? null,
          }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          throw new Error(data.error ?? "Could not save bank connection");
        }
        setMessage("Bank account connected.");
        router.refresh();
        onConnected?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save bank connection");
      }
    },
    [onConnected, purpose, router],
  );

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
    onExit: (exit) => {
      if (exit.error_display_message) {
        setError(exit.error_display_message);
      }
    },
  });

  useEffect(() => {
    if (linkToken && ready) {
      open();
    }
  }, [linkToken, ready, open]);

  async function disconnect() {
    setDisconnecting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/plaid/exchange", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not disconnect");
      }
      setMessage("Bank account disconnected.");
      router.refresh();
      onConnected?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not disconnect");
    } finally {
      setDisconnecting(false);
    }
  }

  if (!configured) {
    return (
      <p className="text-sm text-[var(--muted)]">
        Bank linking is not enabled yet. Your landlord can still collect rent via Zelle or Cash App.
      </p>
    );
  }

  const label = formatBankLabel(connection);

  return (
    <div className="space-y-3">
      {label ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--muted-bg)] px-4 py-3 text-sm">
          <p className="font-medium text-[var(--foreground)]">Connected account</p>
          <p className="mt-1 text-[var(--muted)]">{label}</p>
        </div>
      ) : (
        <p className="text-sm text-[var(--muted)]">
          No bank account connected yet. Use Plaid to link a checking account securely.
        </p>
      )}

      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            void fetchLinkToken();
          }}
          disabled={loadingToken}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loadingToken ? "Loading…" : label ? "Replace bank account" : "Connect bank account"}
        </button>
        {label ? (
          <button
            type="button"
            onClick={() => {
              void disconnect();
            }}
            disabled={disconnecting}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--muted-bg)] disabled:opacity-60"
          >
            {disconnecting ? "Disconnecting…" : "Disconnect"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
