import { FaqList } from "@/components/faq-list";
import { BRAND } from "@/lib/brand";
import { tenantFaqs } from "@/lib/faqs";

export default function TenantDashboardFaqPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tenant FAQ</h1>
        <p className="mt-1 text-[var(--muted)]">
          How to pay rent, connect your bank, and find invoices and documents in your{" "}
          {BRAND.name} portal.
        </p>
      </div>
      <FaqList items={tenantFaqs} />
    </div>
  );
}
