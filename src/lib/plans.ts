export const SUBSCRIPTION_PLANS = {
  free: {
    label: "Early access (Free)",
    description: "Full platform during early rollout.",
  },
  starter: {
    label: "Starter",
    description: "Core rent collection and tenant portal.",
  },
  pro: {
    label: "Pro",
    description: "Operations, reports, and CRM for growing portfolios.",
  },
  enterprise: {
    label: "Enterprise",
    description: "All features with priority support.",
  },
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;

export const MANAGEABLE_FEATURES = {
  online_payments: "Online payments",
  maintenance: "Maintenance requests",
  email_sms: "Email & SMS reminders",
  owner_reports: "Owner monthly reports",
  documents: "Document storage & sharing",
  crm: "CRM / prospect tracking",
  plaid: "Bank / ACH payments",
  multi_property: "Multi-property dashboard",
} as const;

export type ManageableFeature = keyof typeof MANAGEABLE_FEATURES;

const PLAN_DEFAULTS: Record<SubscriptionPlan, Record<ManageableFeature, boolean>> = {
  free: {
    online_payments: true,
    maintenance: true,
    email_sms: true,
    owner_reports: true,
    documents: true,
    crm: true,
    plaid: true,
    multi_property: true,
  },
  starter: {
    online_payments: true,
    maintenance: true,
    email_sms: true,
    owner_reports: false,
    documents: true,
    crm: false,
    plaid: false,
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
  enterprise: {
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

export function isSubscriptionPlan(value: string): value is SubscriptionPlan {
  return value in SUBSCRIPTION_PLANS;
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
