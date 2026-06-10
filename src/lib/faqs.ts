import { BRAND } from "@/lib/brand";

export type FaqItem = { q: string; a: string };

export const siteFaqs: FaqItem[] = [
  {
    q: `What is ${BRAND.name}?`,
    a: `${BRAND.name} helps independent landlords, property managers, and tenants manage rent, invoices, documents, and reminders in one place — without spreadsheet chaos.`,
  },
  {
    q: "Who is it for?",
    a: "Landlords and property managers use it to run properties, units, leases, and rent collection. Tenants use a separate portal to view invoices, pay rent, and access lease documents.",
  },
  {
    q: "How do I get started?",
    a: 'From the homepage, choose "Start as a landlord" to create a landlord account, or "I\'m a tenant" if your landlord invited you. Tenants are linked automatically when they sign up with the same email used on the lease.',
  },
  {
    q: "Where do I sign in?",
    a: 'Use Sign in from the top menu. Landlords go to the landlord workspace; tenants go to the tenant portal. Each role sees its own dashboard and FAQ after logging in.',
  },
  {
    q: "What payment options are supported?",
    a: "Tenants can pay by bank (ACH) when both sides connect accounts through Plaid, or by Zelle / Cash App when the landlord adds those details on a unit. Landlords can also mark invoices paid manually after receiving off-platform payments.",
  },
  {
    q: "Is bank linking secure?",
    a: "Yes. Bank connections use Plaid — a trusted financial data provider. Got My Rent never sees or stores your bank login password, only secure tokens from Plaid.",
  },
  {
    q: "Are there fees for paying by bank?",
    a: "When a tenant pays by ACH, a small processing fee is added to their payment (not deducted from the landlord's payout). The exact amount is shown before the tenant confirms payment. Zelle and Cash App have no platform processing fee.",
  },
  {
    q: "Where do I get help after I sign in?",
    a: "Landlords see Landlord FAQ in their dashboard nav. Tenants see Tenant FAQ in theirs. Each FAQ explains where to find features, how to pay rent, and how to connect bank accounts.",
  },
];

export const ownerFaqs: FaqItem[] = [
  {
    q: "Where is my dashboard overview?",
    a: 'Open Overview from the top nav. You\'ll see a snapshot of properties, open invoices, and quick links into day-to-day tasks.',
  },
  {
    q: "How do I add properties, units, and tenants?",
    a: 'Go to Properties, open a property, then add units and leases. Each lease ties a tenant email to a unit. When the tenant signs up with that email, they automatically see their unit in the tenant portal.',
  },
  {
    q: "Where are unit and tenant profiles?",
    a: "On a property page, use Unit profile → or Tenant profile → on each row. Profiles hold documents, payment details, and lease info for that unit or tenant.",
  },
  {
    q: "How do I connect my bank account to receive rent?",
    a: 'Open Bank account in the top nav and click Connect bank account. You\'ll use Plaid to link the checking account where you want rent deposited. Tenants can pay by ACH only after you connect a payout account.',
  },
  {
    q: "How do tenants pay me?",
    a: "If both sides have bank accounts connected, tenants pay from Invoices using Pay from bank (ACH). You receive the full rent and any late fee — processing fees are charged to the tenant, not deducted from your payout. You can also add Zelle or Cash App handles on each unit as a backup; tenants see those instructions on their invoice.",
  },
  {
    q: "How do I set up Zelle or Cash App on a unit?",
    a: "On the property page, edit the unit's payment fields (Zelle handle, Cash App handle, and optional payment instructions). Tenants see these on open invoices when bank pay isn't available or as an alternative.",
  },
  {
    q: "Where do I manage rent and late fees?",
    a: 'Open Rent & late fees. You\'ll see all invoices across your portfolio. Mark an invoice paid after you receive payment, or waive a late fee with one click.',
  },
  {
    q: "How do I waive a late fee?",
    a: "On Rent & late fees, find the invoice and click Waive late fee. The tenant's balance drops to rent-only while the change stays on record.",
  },
  {
    q: "Where do I upload and find documents?",
    a: 'Use Documents for portfolio-wide files. On a property page you can attach internal files and rental forms. Unit and tenant profile pages accept uploads tied to that unit or lease.',
  },
  {
    q: "How do rent reminders work?",
    a: "Tenants can receive email or SMS reminders when rent is due soon, due today, or late. They manage phone and notification preferences under Settings in the tenant portal.",
  },
];

export const tenantFaqs: FaqItem[] = [
  {
    q: "Where is my tenant home?",
    a: 'After signing in, Home shows your lease summary and what\'s due. Use Invoices for every bill and Documents for files your landlord shared.',
  },
  {
    q: "How do I pay rent?",
    a: "Open Invoices. On an open invoice you'll see payment options: Pay from bank (ACH) when your landlord has bank pay enabled, or Zelle / Cash App instructions if your landlord added them on your unit.",
  },
  {
    q: "How do I connect my bank account?",
    a: 'Go to Settings and click Connect bank account under Bank account. Plaid opens a secure window to link your checking account. Got My Rent never stores your bank password.',
  },
  {
    q: "What is the ACH processing fee?",
    a: "When you pay by bank, a small processing fee is added to your total (shown before you confirm). Your landlord receives the full rent amount — the fee is not taken from their payout.",
  },
  {
    q: "How do I pay with Zelle or Cash App?",
    a: "On an open invoice, scroll to the payment instructions for your landlord's Zelle or Cash App handle and the memo to include. Send payment there; your landlord will mark the invoice paid in Got My Rent.",
  },
  {
    q: "Why don't I see Pay from bank?",
    a: "Bank pay requires you to connect a bank account in Settings and your landlord to connect a payout account. If either side hasn't connected yet, use Zelle or Cash App if available, or contact your landlord.",
  },
  {
    q: "Where are my invoices?",
    a: "Invoices lists every bill by due date with status (open, late, or paid). Paid invoices show the date paid and any processing fee from a bank payment.",
  },
  {
    q: "Where are my documents?",
    a: "Documents lists leases, notices, and other files your landlord uploaded for your unit. Download anytime; new uploads appear as they're added.",
  },
  {
    q: "How do I update reminders and contact info?",
    a: "Settings lets you add a mobile number for text reminders and choose email or SMS notifications for rent due dates and late notices.",
  },
  {
    q: "I forgot my password — what do I do?",
    a: 'On the sign-in page, use "Forgot password" to reset via email. If you\'re still stuck, contact your landlord or use the Contact link on the public site.',
  },
];
