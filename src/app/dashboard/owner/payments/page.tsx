import { BankConnectionCard } from "@/components/bank-connection-card";
import { getActiveBankConnection } from "@/lib/plaid/bank-connections";
import { isPlaidConfigured } from "@/lib/plaid/client";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function OwnerPaymentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const connection = await getActiveBankConnection(user.id, "payout");
  const configured = isPlaidConfigured();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bank account</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Connect the account where you receive rent. ACH via Plaid is free for landlords and
          tenants. Card payments add a 4% fee paid by the tenant.
        </p>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Payout account</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Link a checking account via Plaid. Zelle and Cash App on each unit still work as a backup.
        </p>
        <div className="mt-4">
          <BankConnectionCard
            purpose="payout"
            connection={connection}
            configured={configured}
          />
        </div>
      </section>

      {!configured ? (
        <p className="text-sm text-[var(--muted)]">
          Ask your administrator to add Plaid keys in Vercel environment variables to enable bank
          payments.
        </p>
      ) : null}
    </div>
  );
}
