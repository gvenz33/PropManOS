import { FaqList } from "@/components/faq-list";
import { BRAND } from "@/lib/brand";
import { ownerFaqs } from "@/lib/faqs";

export default function OwnerFaqPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Landlord FAQ</h1>
        <p className="mt-1 text-[var(--muted)]">
          Where to find things in your {BRAND.name} workspace — properties, rent, bank accounts,
          documents, and payment options.
        </p>
      </div>
      <FaqList items={ownerFaqs} />
    </div>
  );
}
