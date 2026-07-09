import { BrandLogo } from "@/components/brand-logo";
import Link from "next/link";
import { ResetPasswordForm } from "./ui";

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-16">
      <div className="flex justify-center">
        <BrandLogo variant="full" href="/" priority />
      </div>
      <h1 className="mt-4 text-center text-2xl font-bold">Choose a new password</h1>
      <p className="mt-2 text-center text-sm text-[var(--muted)]">
        Enter a new password for your account.
      </p>
      <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <ResetPasswordForm />
      </div>
      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        <Link href="/login" className="font-medium text-[var(--accent)] hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
