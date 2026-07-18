import {
  effectiveFeatures,
  normalizeSubscriptionPlan,
  parseFeatureFlags,
  planMaxUnits,
  type ManageableFeature,
  type SubscriptionPlan,
} from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type OwnerBillingProfile = {
  id: string;
  role: string;
  subscription_plan: SubscriptionPlan;
  subscription_status: string;
  billing_interval: "month" | "year" | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  billing_exempt: boolean;
  feature_flags: unknown;
};

export function hasActiveSubscription(profile: {
  role?: string | null;
  subscription_status?: string | null;
  billing_exempt?: boolean | null;
}) {
  if (profile.role === "admin" || profile.role === "tenant") return true;
  if (profile.billing_exempt) return true;
  const status = profile.subscription_status ?? "inactive";
  return status === "active" || status === "trialing";
}

export async function getOwnerBillingProfile(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(
      "id, role, subscription_plan, subscription_status, billing_interval, stripe_customer_id, stripe_subscription_id, billing_exempt, feature_flags",
    )
    .eq("id", userId)
    .maybeSingle();

  if (!data) return null;

  const plan = normalizeSubscriptionPlan(data.subscription_plan);
  return {
    ...data,
    subscription_plan: plan,
    billing_interval: (data.billing_interval as "month" | "year" | null) ?? null,
  } satisfies OwnerBillingProfile;
}

export function ownerFeatures(profile: OwnerBillingProfile) {
  return effectiveFeatures(profile.subscription_plan, parseFeatureFlags(profile.feature_flags));
}

export function ownerHasFeature(profile: OwnerBillingProfile, feature: ManageableFeature) {
  if (!hasActiveSubscription(profile)) return false;
  return ownerFeatures(profile)[feature];
}

export async function countOwnerUnits(ownerId: string) {
  const service = createServiceClient();
  const client = service ?? (await createClient());

  const { data: properties } = await client.from("properties").select("id").eq("owner_id", ownerId);
  const propIds = (properties ?? []).map((p) => p.id);
  if (!propIds.length) return 0;

  const { count } = await client
    .from("units")
    .select("id", { count: "exact", head: true })
    .in("property_id", propIds);

  return count ?? 0;
}

export async function assertCanAddUnit(ownerId: string) {
  const profile = await getOwnerBillingProfile(ownerId);
  if (!profile || profile.role !== "owner") {
    return { ok: false as const, error: "Only landlords can add units." };
  }
  if (!hasActiveSubscription(profile)) {
    return {
      ok: false as const,
      error: "Choose a subscription plan before adding units.",
    };
  }

  const max = planMaxUnits(profile.subscription_plan);
  const current = await countOwnerUnits(ownerId);
  if (current >= max) {
    if (profile.subscription_plan === "essential") {
      return {
        ok: false as const,
        error: `Essential includes up to ${max} units. Upgrade to Pro for more capacity.`,
      };
    }
    return {
      ok: false as const,
      error: `Pro includes up to ${max} units. Contact us for a custom plan above 50 units.`,
    };
  }

  return { ok: true as const, current, max };
}
