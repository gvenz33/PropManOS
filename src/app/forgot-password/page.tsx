import { BrandLogo } from "@/components/brand-logo";
import Link from "next/link";
import { ForgotPasswordForm } from "./ui";

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-16">
      <div className="flex justify-center">
        <BrandLogo variant="full" href="/" priority />
      </div>
      <h1 className="mt-4 text-center text-2xl font-bold">Reset your password</h1>
      <p className="mt-2 text-center text-sm text-[var(--muted)]">
        Enter your account email and we&apos;ll send you a link to choose a new password.
      </p>
      <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <ForgotPasswordForm />
      </div>
      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        Remembered it?{" "}
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
