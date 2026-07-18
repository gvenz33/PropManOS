"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardNavIcon } from "./nav-icons";
import { isDashboardLinkActive, type DashboardLink } from "./nav-types";

const HOME_HREFS = ["/dashboard/owner", "/dashboard/tenant", "/dashboard/admin"];

export function DashboardBottomNav({
  primary,
  more,
}: {
  primary: DashboardLink[];
  more: DashboardLink[];
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const moreActive = more.some((link) => isDashboardLinkActive(pathname, link.href, HOME_HREFS));

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMoreOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  return (
    <>
      {moreOpen && more.length ? (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
          />
          <div className="app-bottom-chrome relative z-10 rounded-t-3xl border border-[var(--border)] bg-[var(--card)] shadow-2xl">
            <div className="mx-auto max-w-lg px-4 pb-3 pt-3">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--border)]" />
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                More
              </p>
              <ul className="divide-y divide-[var(--border)]">
                {more.map((link) => {
                  const active = isDashboardLinkActive(pathname, link.href, HOME_HREFS);
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setMoreOpen(false)}
                        className={`flex items-center gap-3 px-1 py-3.5 text-sm font-medium touch-manipulation ${
                          active ? "text-[var(--brand-blue)]" : "text-[var(--foreground)]"
                        }`}
                      >
                        {link.icon ? (
                          <DashboardNavIcon name={link.icon} className="h-5 w-5 shrink-0" />
                        ) : null}
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      <nav
        className="app-bottom-chrome fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-md"
        aria-label="Primary"
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
          {primary.map((link) => {
            const active = isDashboardLinkActive(pathname, link.href, HOME_HREFS);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`dashboard-bottom-tab touch-manipulation ${
                  active ? "dashboard-bottom-tab-active" : ""
                }`}
              >
                {link.icon ? <DashboardNavIcon name={link.icon} /> : null}
                <span>{link.shortLabel ?? link.label}</span>
              </Link>
            );
          })}
          {more.length ? (
            <button
              type="button"
              onClick={() => setMoreOpen((open) => !open)}
              className={`dashboard-bottom-tab touch-manipulation ${
                moreOpen || moreActive ? "dashboard-bottom-tab-active" : ""
              }`}
              aria-expanded={moreOpen}
              aria-haspopup="dialog"
            >
              <DashboardNavIcon name="more" />
              <span>More</span>
            </button>
          ) : null}
        </div>
      </nav>
    </>
  );
}
