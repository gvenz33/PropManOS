import { BrandLogo } from "@/components/brand-logo";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { BRAND } from "@/lib/brand";

export type DashboardLink = {
  href: string;
  label: string;
};

type Props = {
  portalLabel: string;
  userName: string;
  links: DashboardLink[];
  signOut: React.ReactNode;
  children: React.ReactNode;
};

export function DashboardShell({
  portalLabel,
  userName,
  links,
  signOut,
  children,
}: Props) {
  return (
    <div className="min-h-full bg-[var(--background)]">
      <header className="dashboard-header border-b border-[var(--border)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-4">
            <BrandLogo href="/" variant="icon" className="shrink-0" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--brand-blue)]">
                {BRAND.name}
              </p>
              <p className="font-semibold text-[var(--foreground)]">{userName}</p>
              <p className="text-xs text-[var(--muted)]">{portalLabel}</p>
            </div>
          </div>
          {signOut}
        </div>
        <DashboardNav links={links} />
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
