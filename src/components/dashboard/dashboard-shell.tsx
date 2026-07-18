import { BrandLogo } from "@/components/brand-logo";
import { DashboardBottomNav } from "@/components/dashboard/dashboard-bottom-nav";
import { BRAND } from "@/lib/brand";
import type { DashboardLink } from "./nav-types";

export type { DashboardLink } from "./nav-types";

type Props = {
  portalLabel: string;
  userName: string;
  /** Primary destinations shown in the bottom tab bar */
  primaryLinks: DashboardLink[];
  /** Secondary destinations under the More sheet */
  moreLinks?: DashboardLink[];
  signOut: React.ReactNode;
  children: React.ReactNode;
};

export function DashboardShell({
  portalLabel,
  userName,
  primaryLinks,
  moreLinks = [],
  signOut,
  children,
}: Props) {
  return (
    <div className="min-h-full min-h-dvh bg-[var(--background)]">
      <header className="app-top-chrome dashboard-header sticky top-0 z-40 border-b border-[var(--border)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <BrandLogo href="/dashboard" variant="icon" className="shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--brand-blue)]">
                {BRAND.name}
              </p>
              <p className="truncate font-semibold text-[var(--foreground)]">{userName}</p>
              <p className="truncate text-xs text-[var(--muted)]">{portalLabel}</p>
            </div>
          </div>
          {signOut}
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 pb-28 sm:px-6 sm:py-8 sm:pb-32">
        {children}
      </div>

      <DashboardBottomNav primary={primaryLinks} more={moreLinks} />
    </div>
  );
}
