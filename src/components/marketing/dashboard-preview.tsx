import { BRAND } from "@/lib/brand";

export function DashboardPreview() {
  return (
    <div className="marketing-dashboard relative mx-auto w-full max-w-lg">
      <div className="absolute -inset-4 rounded-3xl bg-[var(--brand-blue)]/10 blur-2xl" aria-hidden />
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl shadow-[var(--brand-navy)]/10">
        <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--muted-bg)] px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-2 text-xs font-medium text-[var(--muted)]">{BRAND.name} dashboard</span>
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-[140px_1fr]">
          <nav className="hidden space-y-1 sm:block">
            {["Overview", "Properties", "Rent", "Maintenance", "Documents"].map((item, i) => (
              <div
                key={item}
                className={`rounded-lg px-3 py-2 text-xs font-medium ${
                  i === 0
                    ? "bg-[var(--brand-blue)]/10 text-[var(--brand-blue)]"
                    : "text-[var(--muted)]"
                }`}
              >
                {item}
              </div>
            ))}
          </nav>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Properties", value: "4" },
                { label: "Open rent", value: "3" },
                { label: "Repairs", value: "2" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3"
                >
                  <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-xl font-bold tabular-nums">{stat.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-[var(--border)] p-3">
              <p className="text-xs font-semibold">Recent activity</p>
              <ul className="mt-2 space-y-2 text-[11px] text-[var(--muted)]">
                <li className="flex justify-between gap-2">
                  <span>Rent due reminder sent</span>
                  <span className="shrink-0">Unit 2B</span>
                </li>
                <li className="flex justify-between gap-2">
                  <span className="text-[var(--foreground)]">Maintenance: leaky faucet</span>
                  <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                    New
                  </span>
                </li>
                <li className="flex justify-between gap-2">
                  <span>Invoice marked paid</span>
                  <span className="shrink-0">Unit 1A</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
