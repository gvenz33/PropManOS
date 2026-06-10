import Link from "next/link";

type Props = {
  label: string;
  value: string | number;
  href?: string;
  accent?: "blue" | "green" | "amber" | "default";
};

const accentClass = {
  blue: "dashboard-stat-blue",
  green: "dashboard-stat-green",
  amber: "dashboard-stat-amber",
  default: "",
};

export function StatCard({ label, value, href, accent = "default" }: Props) {
  const className = `dashboard-stat-card ${accentClass[accent]}`;
  const inner = (
    <>
      <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight">{value}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${className} block transition hover:-translate-y-0.5`}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}
