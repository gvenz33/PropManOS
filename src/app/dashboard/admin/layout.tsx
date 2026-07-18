import { BrandLogo } from "@/components/brand-logo";
import { BRAND } from "@/lib/brand";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOutAction } from "../actions";

const links = [
  { href: "/dashboard/admin", label: "Overview" },
  { href: "/dashboard/admin/subscribers", label: "Subscribers" },
  { href: "/dashboard/admin/documents", label: "Documents" },
  { href: "/dashboard/admin/tools", label: "Tools" },
  { href: "/dashboard/admin/settings", label: "Account" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-full min-h-dvh bg-[var(--background)]">
      <div className="app-top-chrome sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-4">
            <BrandLogo variant="icon" href="/dashboard/admin" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
                {BRAND.name} admin
              </p>
              <p className="font-semibold text-[var(--foreground)]">
                {profile.full_name || user.email}
              </p>
              <p className="text-xs text-[var(--muted)]">Site administration console</p>
            </div>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--muted-bg)]"
            >
              Sign out
            </button>
          </form>
        </div>
        <nav
          className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden"
          aria-label="Admin"
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="shrink-0 touch-manipulation rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--muted)] hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)]"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="app-bottom-chrome mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
