import Link from "next/link";
import { LoginForm } from "./ui";

type Props = { searchParams: Promise<{ next?: string; error?: string; missing?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  if (sp.missing === "env") {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-xl font-semibold">Configuration needed</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Add <code className="rounded bg-[var(--muted-bg)] px-1">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
          and{" "}
          <code className="rounded bg-[var(--muted-bg)] px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
          to <code className="rounded bg-[var(--muted-bg)] px-1">.env.local</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-16">
      <p className="text-center text-sm font-semibold text-[var(--accent)]">Prop Man OS</p>
      <h1 className="mt-2 text-center text-2xl font-bold">Sign in</h1>
      {sp.error ? (
        <p className="mt-2 text-center text-sm text-[var(--danger)]">
          Something went wrong. Try again or reset your password.
        </p>
      ) : null}
      <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <LoginForm nextPath={sp.next ?? "/dashboard"} />
      </div>
      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        New here?{" "}
        <Link href="/sign-up" className="font-medium text-[var(--accent)] hover:underline">
          Create an account
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
