import { BankConnectionCard } from "@/components/bank-connection-card";
import { getActiveBankConnection } from "@/lib/plaid/bank-connections";
import { formatBankLabel } from "@/lib/plaid/format-bank-label";
import { getPlaidConfigStatus } from "@/lib/plaid/client";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function OwnerPaymentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const connection = await getActiveBankConnection(user.id, "payout");
  const plaidStatus = getPlaidConfigStatus();
  const configured = plaidStatus.configured;
  const connectedLabel = formatBankLabel(connection);
  const env = plaidStatus.env;
  const envMismatch =
    configured &&
    !plaidStatus.secretLooksStripe &&
    ((env === "sandbox" && !plaidStatus.secretLooksSandbox && plaidStatus.secretPresent) ||
      (env === "production" && plaidStatus.secretLooksSandbox));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bank account</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Connect the checking account where you want rent deposited. Tenants can then pay by ACH
          from their portal. Zelle and Cash App on each unit still work as a backup.
        </p>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Payout account</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Secure bank linking through Plaid. Got My Rent never sees your bank login password.
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              connectedLabel
                ? "bg-emerald-100 text-emerald-800"
                : "bg-[var(--muted-bg)] text-[var(--muted)]"
            }`}
          >
            {connectedLabel ? "Connected" : "Not connected"}
          </span>
        </div>

        <div className="mt-4">
          <BankConnectionCard
            purpose="payout"
            connection={connection}
            configured={configured}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold">How it works</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-[var(--muted)]">
          <li>Click Connect bank account and sign in to your bank with Plaid.</li>
          <li>Choose the checking account where rent should be deposited.</li>
          <li>When a tenant pays by ACH, funds are sent toward this account.</li>
          <li>You can replace or disconnect the account anytime.</li>
        </ol>
      </section>

      {configured ? (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--muted-bg)] px-4 py-3 text-xs text-[var(--muted)]">
          <p>
            Plaid status:{" "}
            <span className="font-medium text-[var(--foreground)]">keys loaded</span>
            {" · "}
            env <span className="font-mono text-[var(--foreground)]">{env}</span>
            {plaidStatus.clientIdLast4 ? (
              <>
                {" · "}
                client id …
                <span className="font-mono text-[var(--foreground)]">
                  {plaidStatus.clientIdLast4}
                </span>
              </>
            ) : null}
          </p>
          {plaidStatus.secretLooksStripe ? (
            <p className="mt-2 text-amber-800">
              Warning: <span className="font-mono">PLAID_SECRET</span> looks like a Stripe key
              (<span className="font-mono">sk_live_</span> / <span className="font-mono">sk_test_</span>
              ). Replace it with the Plaid secret from{" "}
              <a
                href="https://dashboard.plaid.com/developers/keys"
                className="underline"
                target="_blank"
                rel="noreferrer"
              >
                dashboard.plaid.com/developers/keys
              </a>
              .
            </p>
          ) : null}
          {envMismatch ? (
            <p className="mt-2 text-amber-800">
              Warning: <span className="font-mono">PLAID_ENV={env}</span> may not match your secret
              type. Use the matching secret from the Plaid Dashboard for that environment.
            </p>
          ) : null}
          {env !== "production" ? (
            <p className="mt-2">
              Testing tip: in sandbox use Plaid&apos;s test login{" "}
              <span className="font-mono">user_good</span> /{" "}
              <span className="font-mono">pass_good</span>.
            </p>
          ) : null}
        </section>
      ) : (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
          <p className="font-semibold">Plaid keys required</p>
          <p className="mt-2">
            Add these environment variables in Vercel (Production), then redeploy:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 font-mono text-xs">
            <li>PLAID_CLIENT_ID</li>
            <li>PLAID_SECRET</li>
            <li>PLAID_ENV=sandbox (use production when you go live)</li>
          </ul>
          <p className="mt-3">
            Create free sandbox keys at{" "}
            <a
              href="https://dashboard.plaid.com/developers/keys"
              className="font-medium underline"
              target="_blank"
              rel="noreferrer"
            >
              dashboard.plaid.com/developers/keys
            </a>
            .
          </p>
        </section>
      )}
    </div>
  );
}
