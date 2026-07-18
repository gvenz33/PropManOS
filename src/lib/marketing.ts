import { BRAND } from "@/lib/brand";

export type MarketingFeature = {
  title: string;
  body: string;
  icon: "portfolio" | "payments" | "maintenance" | "notices" | "documents" | "crm" | "fees" | "portal" | "reports";
};

export const heroFeatures = [
  "Online rent collection",
  "Maintenance requests",
  "Email & text reminders",
  "Owner monthly reports",
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
    icon: "reports",
    title: "Owner monthly reports",
    body: "Generate styled Excel summaries by property and unit, then email the final report to property owners.",
  },
  {
    icon: "crm",
    title: "Prospect tracking",
    body: "Lightweight CRM for owners, prospects, and vendors alongside your active tenant roster.",
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
  "Export Excel owner summaries and email them",
  "See open invoices and maintenance at a glance",
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
  { feature: "Monthly owner Excel reports", gotMyRent: true, spreadsheets: false },
  { feature: "Document storage & sharing", gotMyRent: true, spreadsheets: false },
  { feature: "Prospect / CRM tracking", gotMyRent: true, spreadsheets: false },
] as const;

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
    title: "Listing syndication",
    body: "Post vacancies to major rental listing sites from one place.",
    status: "planned" as const,
  },
  {
    title: "Online lease signing",
    body: "E-sign lease documents in the tenant portal.",
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
    name: "Essential",
    price: "$49",
    period: "per month · or $488/yr (save 17%)",
    description: "Core rent collection and operations for portfolios up to 8 units.",
    highlights: [
      "Up to 8 units",
      "Tenant & landlord portals",
      "Invoices, documents & notices",
      "Maintenance requests",
      "ACH via Plaid — $0 fee",
      "Card payments — 4% paid by tenant",
    ],
    cta: "Start Essential",
    href: "/sign-up?role=owner",
    featured: false,
  },
  {
    name: "Pro",
    price: "$99",
    period: "per month · or $986/yr (save 17%)",
    description: "Reports, CRM, and room to grow — up to 50 units. Above 50 is custom.",
    highlights: [
      "Up to 50 units",
      "Everything in Essential",
      "Owner monthly Excel reports",
      "CRM / prospect tracking",
      "ACH via Plaid — $0 fee",
      "Card payments — 4% paid by tenant",
    ],
    cta: "Start Pro",
    href: "/sign-up?role=owner",
    featured: true,
  },
];
