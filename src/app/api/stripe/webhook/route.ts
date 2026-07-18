import { getStripe, isStripeConfigured } from "@/lib/billing/stripe";
import { isSubscriptionPlan, type SubscriptionPlan } from "@/lib/plans";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

function planFromSubscription(sub: Stripe.Subscription): SubscriptionPlan {
  const metaPlan = sub.metadata?.plan;
  if (metaPlan && isSubscriptionPlan(metaPlan)) return metaPlan;
  const nickname = sub.items.data[0]?.price?.nickname?.toLowerCase() ?? "";
  const productName =
    typeof sub.items.data[0]?.price?.product === "object" &&
    sub.items.data[0]?.price?.product &&
    "name" in sub.items.data[0].price.product
      ? String(sub.items.data[0].price.product.name).toLowerCase()
      : "";
  if (nickname.includes("pro") || productName.includes("pro")) return "pro";
  return "essential";
}

function intervalFromSubscription(sub: Stripe.Subscription): "month" | "year" | null {
  const meta = sub.metadata?.interval;
  if (meta === "month" || meta === "year") return meta;
  const interval = sub.items.data[0]?.price?.recurring?.interval;
  if (interval === "month" || interval === "year") return interval;
  return null;
}

function statusFromSubscription(sub: Stripe.Subscription) {
  if (sub.status === "active") return "active";
  if (sub.status === "trialing") return "trialing";
  if (sub.status === "past_due") return "past_due";
  if (sub.status === "canceled" || sub.status === "unpaid") return "canceled";
  return "inactive";
}

async function syncSubscription(sub: Stripe.Subscription) {
  const service = createServiceClient();
  if (!service) return;

  const profileId = sub.metadata?.profile_id;
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;

  const patch = {
    subscription_plan: planFromSubscription(sub),
    subscription_status: statusFromSubscription(sub),
    billing_interval: intervalFromSubscription(sub),
    stripe_subscription_id: sub.id,
    stripe_customer_id: customerId ?? null,
    billing_exempt: false,
  };

  if (profileId) {
    await service.from("profiles").update(patch).eq("id", profileId);
    return;
  }

  if (customerId) {
    await service.from("profiles").update(patch).eq("stripe_customer_id", customerId);
  }
}

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    if (secret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, secret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid webhook";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.subscription) {
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id;
        const sub = await stripe.subscriptions.retrieve(subId);
        if (session.client_reference_id && !sub.metadata?.profile_id) {
          await stripe.subscriptions.update(subId, {
            metadata: {
              ...sub.metadata,
              profile_id: session.client_reference_id,
              plan: session.metadata?.plan ?? sub.metadata?.plan ?? "essential",
              interval: session.metadata?.interval ?? sub.metadata?.interval ?? "month",
            },
          });
        }
        const refreshed = await stripe.subscriptions.retrieve(subId);
        await syncSubscription(refreshed);
      }

      if (session.mode === "payment" && session.metadata?.type === "rent_card") {
        const service = createServiceClient();
        const invoiceId = session.metadata.invoice_id;
        if (service && invoiceId && session.payment_status === "paid") {
          const paidAt = new Date().toISOString();
          const rent = Number(session.metadata.rent_cents ?? 0);
          const late = Number(session.metadata.late_fee_cents ?? 0);
          await service
            .from("invoices")
            .update({
              status: "paid",
              amount_paid_cents: rent + late,
              paid_at: paidAt,
              platform_fee_cents: Number(session.metadata.fee_cents ?? 0),
            })
            .eq("id", invoiceId)
            .neq("status", "paid");
        }
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      await syncSubscription(event.data.object as Stripe.Subscription);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const service = createServiceClient();
      if (service) {
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
        const profileId = sub.metadata?.profile_id;
        const patch = {
          subscription_status: "canceled",
          stripe_subscription_id: null,
        };
        if (profileId) await service.from("profiles").update(patch).eq("id", profileId);
        else if (customerId)
          await service.from("profiles").update(patch).eq("stripe_customer_id", customerId);
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
