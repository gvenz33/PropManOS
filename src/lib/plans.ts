export const SUBSCRIPTION_PLANS = {
  essential: {
    label: "Essential",
    description: "Core rent collection and operations for smaller portfolios.",
    monthlyPriceCents: 4900,
    /** 17% off vs paying monthly for a year → $488/yr */
    annualPriceCents: 48800,
    annualDiscountPercent: 17,
    maxUnits: 8,
  },
  pro: {
    label: "Pro",
    description: "Reports, CRM, and room to grow — up to 50 units.",
    monthlyPriceCents: 9900,
    /** 17% off vs paying monthly for a year → $986/yr */
    annualPriceCents: 98600,
    annualDiscountPercent: 17,
    maxUnits: 50,
  },
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;

export const CUSTOM_PLAN_MIN_UNITS = 51;

export const MANAGEABLE_FEATURES = {
  online_payments: "Online payments",
  maintenance: "Maintenance requests",
  email_sms: "Email & SMS reminders",
  owner_reports: "Owner monthly reports",
  documents: "Document storage & sharing",
  crm: "CRM / prospect tracking",
  plaid: "Bank / ACH payments (Plaid)",
  multi_property: "Multi-property dashboard",
} as const;

export type ManageableFeature = keyof typeof MANAGEABLE_FEATURES;

/** Plan defaults — Plaid ACH is included on both paid tiers at $0 fee. */
const PLAN_DEFAULTS: Record<SubscriptionPlan, Record<ManageableFeature, boolean>> = {
  essential: {
    online_payments: true,
    maintenance: true,
    email_sms: true,
    owner_reports: false,
    documents: true,
    crm: false,
    plaid: true,
    multi_property: true,
  },
  pro: {
    online_payments: true,
    maintenance: true,
    email_sms: true,
    owner_reports: true,
    documents: true,
    crm: true,
    plaid: true,
    multi_property: true,
  },
};

export type BillingInterval = "month" | "year";

export function isSubscriptionPlan(value: string): value is SubscriptionPlan {
  return value in SUBSCRIPTION_PLANS;
}

export function isBillingInterval(value: string): value is BillingInterval {
  return value === "month" || value === "year";
}

export function planMaxUnits(plan: SubscriptionPlan) {
  return SUBSCRIPTION_PLANS[plan].maxUnits;
}

export function planPriceCents(plan: SubscriptionPlan, interval: BillingInterval) {
  const cfg = SUBSCRIPTION_PLANS[plan];
  return interval === "year" ? cfg.annualPriceCents : cfg.monthlyPriceCents;
}

export function formatPlanPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function parseFeatureFlags(raw: unknown): Partial<Record<ManageableFeature, boolean>> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const flags: Partial<Record<ManageableFeature, boolean>> = {};
  for (const key of Object.keys(MANAGEABLE_FEATURES) as ManageableFeature[]) {
    const value = (raw as Record<string, unknown>)[key];
    if (typeof value === "boolean") flags[key] = value;
  }
  return flags;
}

export function effectiveFeatures(
  plan: SubscriptionPlan,
  overrides: Partial<Record<ManageableFeature, boolean>>,
) {
  const defaults = PLAN_DEFAULTS[plan];
  const result = {} as Record<ManageableFeature, boolean>;
  for (const key of Object.keys(MANAGEABLE_FEATURES) as ManageableFeature[]) {
    result[key] = overrides[key] ?? defaults[key];
  }
  return result;
}

export function featureFlagsFromForm(formData: FormData, plan: SubscriptionPlan) {
  const defaults = PLAN_DEFAULTS[plan];
  const flags: Partial<Record<ManageableFeature, boolean>> = {};
  for (const key of Object.keys(MANAGEABLE_FEATURES) as ManageableFeature[]) {
    const checked = formData.get(`feature_${key}`) === "on";
    if (checked !== defaults[key]) {
      flags[key] = checked;
    }
  }
  return flags;
}

/** Map legacy VOBizSuite / early-access plan names onto Essential / Pro. */
export function normalizeSubscriptionPlan(raw: string | null | undefined): SubscriptionPlan {
  if (raw === "pro" || raw === "enterprise") return "pro";
  return "essential";
}
