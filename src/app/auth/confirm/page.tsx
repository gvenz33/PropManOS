import { BrandLogo } from "@/components/brand-logo";
import Link from "next/link";
import { ConfirmEmailForm } from "./ui";

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function ConfirmEmailPage({ searchParams }: Props) {
  const sp = await searchParams;
  const nextPath = sp.next?.startsWith("/") ? sp.next : "/dashboard";

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-16">
      <div className="flex justify-center">
        <BrandLogo variant="icon" href="/" />
      </div>
      <h1 className="mt-4 text-center text-2xl font-bold">Confirm your email</h1>
      <p className="mt-2 text-center text-sm text-[var(--muted)]">
        We&apos;re verifying your confirmation link.
      </p>
      <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <ConfirmEmailForm nextPath={nextPath} />
      </div>
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="text-[var(--muted)] hover:text-[var(--foreground)]">
          ← Back to sign in
        </Link>
      </p>
    </div>
  );
}
