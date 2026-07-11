import { BrandLogo } from "@/components/brand-logo";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginMfaForm } from "./ui";

type Props = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginMfaPage({ searchParams }: Props) {
  const sp = await searchParams;
  const nextPath = sp.next?.startsWith("/") ? sp.next : "/dashboard";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-16">
      <div className="flex justify-center">
        <BrandLogo variant="full" href="/" priority />
      </div>
      <h1 className="mt-4 text-center text-2xl font-bold">Check your email</h1>
      <p className="mt-2 text-center text-sm text-[var(--muted)]">
        Multi-factor authentication is on for{" "}
        <span className="font-medium text-[var(--foreground)]">{user.email}</span>
      </p>
      <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <LoginMfaForm nextPath={nextPath} initialError={sp.error} />
      </div>
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="text-[var(--muted)] hover:text-[var(--foreground)]">
          ← Back to sign in
        </Link>
      </p>
    </div>
  );
}
