export type DashboardLink = {
  href: string;
  label: string;
  /** Short label for the bottom tab bar */
  shortLabel?: string;
  icon?: DashboardIconName;
};

export type DashboardIconName =
  | "home"
  | "properties"
  | "rent"
  | "bank"
  | "documents"
  | "repairs"
  | "reports"
  | "crm"
  | "settings"
  | "faq"
  | "people"
  | "tools"
  | "more";

export function isDashboardLinkActive(pathname: string, href: string, homeHrefs: string[]) {
  if (pathname === href) return true;
  if (homeHrefs.includes(href)) return false;
  return pathname.startsWith(href);
}
