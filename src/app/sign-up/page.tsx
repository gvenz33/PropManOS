import { BrandLogo } from "@/components/brand-logo";
import Link from "next/link";
import { SignUpForm } from "./ui";

type Props = { searchParams: Promise<{ role?: string }> };

export default async function SignUpPage({ searchParams }: Props) {
  const sp = await searchParams;
  const defaultRole = sp.role === "tenant" ? "tenant" : "owner";

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-16">
      <div className="flex justify-center">
        <BrandLogo variant="icon" href="/" />
      </div>
      <h1 className="mt-4 text-center text-2xl font-bold">Create your account</h1>
      <p className="mt-2 text-center text-sm text-[var(--muted)]">
        Use the same email your landlord invited you with so leases connect automatically.
      </p>
      <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <SignUpForm defaultRole={defaultRole} />
      </div>
      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[var(--accent)] hover:underline">
          Sign in
        </Link>
      </p>
      <p className="mt-4 text-center text-sm">
        <Link href="/" className="text-[var(--muted)] hover:text-[var(--foreground)]">
          ← Back home
        </Link>
      </p>
    </div>
  );
}
