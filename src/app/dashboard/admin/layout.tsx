import { BrandLogo } from "@/components/brand-logo";
import { BRAND } from "@/lib/brand";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOutAction } from "../actions";

const links = [
  { href: "/dashboard/admin", label: "Overview" },
  { href: "/dashboard/admin/subscribers", label: "Subscribers" },
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
    <div className="min-h-full bg-[var(--background)]">
      <div className="border-b border-[var(--border)] bg-[var(--card)]">
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
        <nav className="mx-auto flex max-w-6xl flex-wrap gap-1 px-4 pb-3 sm:px-6">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--muted)] hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)]"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
