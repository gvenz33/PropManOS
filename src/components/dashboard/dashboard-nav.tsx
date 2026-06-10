"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DashboardLink } from "./dashboard-shell";

export function DashboardNav({ links }: { links: DashboardLink[] }) {
  const pathname = usePathname();

  return (
    <nav className="mx-auto flex max-w-6xl flex-wrap gap-1 px-4 pb-3 sm:px-6">
      {links.map((l) => {
        const active =
          l.href === pathname ||
          (l.href !== "/dashboard/owner" &&
            l.href !== "/dashboard/tenant" &&
            pathname.startsWith(l.href));
        return (
          <Link
            key={l.href}
            href={l.href}
            className={active ? "dashboard-nav-link dashboard-nav-link-active" : "dashboard-nav-link"}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
