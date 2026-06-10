import { BRAND } from "@/lib/brand";

export type MarketingFeature = {
  title: string;
  body: string;
  icon: "portfolio" | "payments" | "maintenance" | "notices" | "documents" | "crm" | "fees" | "portal";
};

export const heroFeatures = [
  "Online rent collection",
  "Maintenance requests",
  "Email & text reminders",
  "Tenant & landlord portals",
] as const;

export const marketingFeatures: MarketingFeature[] = [
  {
    icon: "portfolio",
    title: "Portfolio in one place",
    body: "Manage multiple properties and units. Link leases, tenants, and documents without spreadsheet chaos.",
  },
  {
    icon: "payments",
    title: "Online payments",
    body: "Tenants pay by bank (ACH) or Zelle / Cash App. Landlords connect payout accounts and mark invoices paid.",
  },
  {
    icon: "maintenance",
    title: "Online maintenance",
    body: "Tenants submit repair requests from their portal. Landlords track status from submitted to completed.",
  },
  {
    icon: "notices",
    title: "Smarter notices",
    body: "Automated email and SMS when rent is due in 3 days, due today, or late — tenants control preferences.",
  },
  {
    icon: "documents",
    title: "Paper trail",
    body: "Upload leases, notices, and rental forms. Send documents to prospects or tenants with signed links.",
  },
  {
    icon: "crm",
    title: "Prospect tracking",
    body: "Lightweight CRM for owners, prospects, and vendors alongside your active tenant roster.",
  },
  {
    icon: "fees",
    title: "Late fees you control",
    body: "Apply late rules automatically and waive fees with one click when you choose to.",
  },
  {
    icon: "portal",
    title: "Resident portal",
    body: "Tenants view invoices, pay rent, request repairs, and access lease files in a dedicated portal.",
  },
];

export const landlordHighlights = [
  "Add properties, units, and tenants in minutes",
  "Generate monthly rent invoices automatically",
  "See open invoices and maintenance at a glance",
  "Send rental forms by email or text",
] as const;

export const tenantHighlights = [
  "Pay rent online with clear instructions",
  "Submit maintenance requests with priority levels",
  "Get reminders before rent is due",
  "Access lease documents anytime",
] as const;

export const comparisonRows = [
  { feature: "Multi-property dashboard", gotMyRent: true, spreadsheets: false },
  { feature: "Tenant portal", gotMyRent: true, spreadsheets: false },
  { feature: "Online rent payments", gotMyRent: true, spreadsheets: false },
  { feature: "Maintenance requests", gotMyRent: true, spreadsheets: false },
  { feature: "Email & SMS reminders", gotMyRent: true, spreadsheets: false },
  { feature: "Document storage & sharing", gotMyRent: true, spreadsheets: false },
  { feature: "Prospect / CRM tracking", gotMyRent: true, spreadsheets: false },
  { feature: "Full general ledger accounting", gotMyRent: false, spreadsheets: false },
] as const;

/** Features Yardi Breeze offers that we don't yet — honest roadmap for the features page */
export const roadmapFeatures = [
  {
    title: "Online rental applications",
    body: "Let prospects apply online and track them through your pipeline.",
    status: "planned" as const,
  },
  {
    title: "Resident screening",
    body: "Credit and background checks integrated at lease-up.",
    status: "planned" as const,
  },
  {
    title: "Owner financial reports",
    body: "Customizable income statements and owner payout summaries.",
    status: "planned" as const,
  },
  {
    title: "Listing syndication (ILS)",
    body: "Post vacancies to Zillow, Apartments.com, and similar sites.",
    status: "planned" as const,
  },
  {
    title: "Online lease signing",
    body: "E-sign state-based lease documents in the tenant portal.",
    status: "planned" as const,
  },
  {
    title: "Vendor payments",
    body: "Pay maintenance vendors and track job costs from one place.",
    status: "planned" as const,
  },
];

export const testimonial = {
  quote: `We replaced three spreadsheets and a group text thread with ${BRAND.name}. Rent reminders and maintenance requests finally live in one place.`,
  name: "Independent landlord",
  role: "Early partner",
};

export const pricingTiers = [
  {
    name: "Early access",
    price: "Free",
    period: "while we onboard partners",
    description: "Full platform for landlords and tenants — no per-unit fees during early rollout.",
    highlights: [
      "Unlimited properties & units",
      "Tenant & landlord portals",
      "ACH, Zelle & Cash App payments",
      "Maintenance requests",
      "Email & SMS rent reminders",
    ],
    cta: "Get started free",
    href: "/sign-up",
    featured: true,
  },
  {
    name: "Compare to Yardi Breeze",
    price: "From $1",
    period: "per unit / month (their pricing)",
    description: `${BRAND.name} is built for indie landlords who want core tools without enterprise minimums.`,
    highlights: [
      "No $100+/mo minimums",
      "No annual contract required",
      "Focused on rent & operations",
      "Transparent, simple setup",
    ],
    cta: "See all features",
    href: "/features",
    featured: false,
  },
];
