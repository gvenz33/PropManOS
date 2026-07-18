"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DashboardLink } from "./dashboard-shell";

export function DashboardNav({ links }: { links: DashboardLink[] }) {
  const pathname = usePathname();

  return (
    <nav
      className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden"
      aria-label="Dashboard"
    >
      {links.map((l) => {
        const active =
          l.href === pathname ||
          (l.href !== "/dashboard/owner" &&
            l.href !== "/dashboard/tenant" &&
            l.href !== "/dashboard/admin" &&
            pathname.startsWith(l.href));
        return (
          <Link
            key={l.href}
            href={l.href}
            className={
              (active ? "dashboard-nav-link dashboard-nav-link-active" : "dashboard-nav-link") +
              " shrink-0 touch-manipulation"
            }
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
