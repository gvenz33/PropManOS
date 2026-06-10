import type { FaqItem } from "@/lib/faqs";

type Props = {
  items: FaqItem[];
  className?: string;
};

export function FaqList({ items, className = "" }: Props) {
  return (
    <ul className={`space-y-4 ${className}`}>
      {items.map((item) => (
        <li
          key={item.q}
          className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm"
        >
          <h2 className="font-semibold text-[var(--foreground)]">{item.q}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.a}</p>
        </li>
      ))}
    </ul>
  );
}
