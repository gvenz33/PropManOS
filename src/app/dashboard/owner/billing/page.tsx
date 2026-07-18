import { ActionMessage } from "@/components/action-message";
import {
  countOwnerUnits,
  getOwnerBillingProfile,
  hasActiveSubscription,
} from "@/lib/billing/access";
import { isStripeConfigured } from "@/lib/billing/stripe";
import {
  CUSTOM_PLAN_MIN_UNITS,
  formatPlanPrice,
  planMaxUnits,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
} from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { openBillingPortal, startSubscriptionCheckout } from "./actions";

export default async function OwnerBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { success, error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getOwnerBillingProfile(user.id);
  if (!profile || profile.role !== "owner") redirect("/dashboard");

  const unitCount = await countOwnerUnits(user.id);
  const active = hasActiveSubscription(profile);
  const stripeReady = isStripeConfigured();
  const maxUnits = planMaxUnits(profile.subscription_plan);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing & plans</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Essential and Pro are paid plans. Bank ACH via Plaid is free; card payments add a 4% fee
          paid by the tenant.
        </p>
      </div>

      <ActionMessage success={success} error={error} />

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Current plan</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[var(--muted)]">Plan</dt>
            <dd className="font-semibold">
              {SUBSCRIPTION_PLANS[profile.subscription_plan].label}
              {profile.billing_exempt ? " · admin complimentary" : ""}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Status</dt>
            <dd className="font-semibold capitalize">{profile.subscription_status}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Units used</dt>
            <dd className="font-semibold">
              {unitCount} / {maxUnits}
              {profile.subscription_plan === "pro" ? ` (custom from ${CUSTOM_PLAN_MIN_UNITS}+)` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Billing</dt>
            <dd className="font-semibold capitalize">
              {profile.billing_interval ?? (active ? "—" : "Not subscribed")}
            </dd>
          </div>
        </dl>

        {!active ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Your workspace is locked until you choose Essential or Pro.
          </p>
        ) : null}

        {profile.stripe_customer_id ? (
          <form action={openBillingPortal} className="mt-4">
            <button
              type="submit"
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold"
            >
              Manage billing in Stripe
            </button>
          </form>
        ) : null}
      </section>

      {!stripeReady ? (
        <p className="text-sm text-[var(--muted)]">
          Stripe keys are not on this deployment yet. Add{" "}
          <code className="rounded bg-[var(--muted-bg)] px-1 text-xs">STRIPE_SECRET_KEY</code> to
          enable checkout.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {(Object.keys(SUBSCRIPTION_PLANS) as SubscriptionPlan[]).map((plan) => {
            const cfg = SUBSCRIPTION_PLANS[plan];
            const featured = plan === "pro";
            return (
              <section
                key={plan}
                className={`rounded-2xl border p-6 shadow-sm ${
                  featured
                    ? "border-[var(--brand-blue)] bg-[var(--card)]"
                    : "border-[var(--border)] bg-[var(--card)]"
                }`}
              >
                <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-blue)]">
                  {cfg.label}
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {formatPlanPrice(cfg.monthlyPriceCents)}
                  <span className="text-base font-medium text-[var(--muted)]">/mo</span>
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  or {formatPlanPrice(cfg.annualPriceCents)}/yr (save {cfg.annualDiscountPercent}%)
                </p>
                <p className="mt-3 text-sm text-[var(--muted)]">{cfg.description}</p>
                <ul className="mt-4 space-y-1 text-sm text-[var(--muted)]">
                  <li>Up to {cfg.maxUnits} units</li>
                  <li>ACH via Plaid — $0 fee</li>
                  {plan === "pro" ? <li>Owner reports & CRM</li> : <li>Core rent & documents</li>}
                </ul>
                <div className="mt-6 flex flex-col gap-2">
                  <form action={startSubscriptionCheckout}>
                    <input type="hidden" name="plan" value={plan} />
                    <input type="hidden" name="interval" value="month" />
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white"
                    >
                      Subscribe monthly
                    </button>
                  </form>
                  <form action={startSubscriptionCheckout}>
                    <input type="hidden" name="plan" value={plan} />
                    <input type="hidden" name="interval" value="year" />
                    <button
                      type="submit"
                      className="w-full rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-semibold"
                    >
                      Subscribe annually (−{cfg.annualDiscountPercent}%)
                    </button>
                  </form>
                </div>
              </section>
            );
          })}
        </div>
      )}

      <p className="text-sm text-[var(--muted)]">
        Need more than 50 units?{" "}
        <Link href="/contact" className="font-medium text-[var(--brand-blue)] hover:underline">
          Contact us
        </Link>{" "}
        for a custom plan.
      </p>
    </div>
  );
}
