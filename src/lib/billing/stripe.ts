import Stripe from "stripe";
import {
  isBillingInterval,
  isSubscriptionPlan,
  planPriceCents,
  type BillingInterval,
  type SubscriptionPlan,
} from "@/lib/plans";

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured");
  return new Stripe(key, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
  });
}

export function stripePriceEnvKey(plan: SubscriptionPlan, interval: BillingInterval) {
  const planKey = plan.toUpperCase();
  const intervalKey = interval === "year" ? "ANNUAL" : "MONTHLY";
  return `STRIPE_PRICE_${planKey}_${intervalKey}`;
}

export function stripePriceId(plan: SubscriptionPlan, interval: BillingInterval) {
  return process.env[stripePriceEnvKey(plan, interval)]?.trim() || null;
}

export function parseCheckoutSelection(planRaw: string, intervalRaw: string) {
  if (!isSubscriptionPlan(planRaw)) return null;
  if (!isBillingInterval(intervalRaw)) return null;
  return { plan: planRaw, interval: intervalRaw };
}

/** Build Checkout line items — prefers Dashboard Price IDs, falls back to inline price_data. */
export function subscriptionLineItems(plan: SubscriptionPlan, interval: BillingInterval) {
  const priceId = stripePriceId(plan, interval);
  if (priceId) {
    return [{ price: priceId, quantity: 1 }];
  }

  const amount = planPriceCents(plan, interval);
  return [
    {
      price_data: {
        currency: "usd",
        unit_amount: amount,
        recurring: { interval },
        product_data: {
          name: `Got My Rent ${plan === "pro" ? "Pro" : "Essential"}`,
          description:
            plan === "pro"
              ? "Up to 50 units · reports, CRM, ACH"
              : "Up to 8 units · rent collection & operations",
        },
      },
      quantity: 1,
    },
  ];
}

export const STRIPE_CARD_FEE_PERCENT = 4;

export function stripeCardFeeCents(subtotalCents: number) {
  return Math.round(subtotalCents * (STRIPE_CARD_FEE_PERCENT / 100));
}
