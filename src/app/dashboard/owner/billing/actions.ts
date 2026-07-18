"use server";

import { hasActiveSubscription, getOwnerBillingProfile } from "@/lib/billing/access";
import {
  getStripe,
  isStripeConfigured,
  parseCheckoutSelection,
  subscriptionLineItems,
} from "@/lib/billing/stripe";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { absoluteUrl } from "@/lib/site-url";
import { redirect } from "next/navigation";

export async function startSubscriptionCheckout(formData: FormData): Promise<void> {
  if (!isStripeConfigured()) {
    redirect(
      `/dashboard/owner/billing?error=${encodeURIComponent("Stripe is not configured yet. Add STRIPE_SECRET_KEY in Vercel.")}`,
    );
  }

  const selection = parseCheckoutSelection(
    String(formData.get("plan") ?? ""),
    String(formData.get("interval") ?? "month"),
  );
  if (!selection) {
    redirect(`/dashboard/owner/billing?error=${encodeURIComponent("Choose Essential or Pro.")}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getOwnerBillingProfile(user.id);
  if (!profile || profile.role !== "owner") redirect("/dashboard");

  const stripe = getStripe();
  const service = createServiceClient();
  if (!service) {
    redirect(`/dashboard/owner/billing?error=${encodeURIComponent("Billing is temporarily unavailable.")}`);
  }

  let customerId = profile.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      name: undefined,
      metadata: { profile_id: user.id },
    });
    customerId = customer.id;
    await service
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    metadata: {
      profile_id: user.id,
      plan: selection.plan,
      interval: selection.interval,
    },
    subscription_data: {
      metadata: {
        profile_id: user.id,
        plan: selection.plan,
        interval: selection.interval,
      },
    },
    line_items: subscriptionLineItems(selection.plan, selection.interval),
    success_url: absoluteUrl("/dashboard/owner/billing?success=subscribed"),
    cancel_url: absoluteUrl("/dashboard/owner/billing?error=Checkout%20canceled"),
    allow_promotion_codes: true,
  });

  if (!session.url) {
    redirect(`/dashboard/owner/billing?error=${encodeURIComponent("Could not start checkout.")}`);
  }

  redirect(session.url);
}

export async function openBillingPortal(): Promise<void> {
  if (!isStripeConfigured()) {
    redirect(
      `/dashboard/owner/billing?error=${encodeURIComponent("Stripe is not configured yet.")}`,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getOwnerBillingProfile(user.id);
  if (!profile?.stripe_customer_id) {
    redirect(
      `/dashboard/owner/billing?error=${encodeURIComponent("No Stripe customer yet. Subscribe first.")}`,
    );
  }

  const stripe = getStripe();
  const portal = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: absoluteUrl("/dashboard/owner/billing"),
  });

  redirect(portal.url);
}

export async function requireOwnerSubscriptionOrRedirect(userId: string, path: string) {
  const profile = await getOwnerBillingProfile(userId);
  if (!profile || profile.role !== "owner") return profile;
  if (hasActiveSubscription(profile)) return profile;
  if (path.startsWith("/dashboard/owner/billing")) return profile;
  redirect("/dashboard/owner/billing");
}
