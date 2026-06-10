import Link from "next/link";
import { BRAND } from "@/lib/brand";

export function CtaBand() {
  return (
    <section className="marketing-cta-band">
      <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-20">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          See for yourself
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
          Set up your first property in minutes. {BRAND.name} is refreshingly simple — rent,
          maintenance, and documents in one place.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[var(--brand-navy)] shadow-lg transition hover:bg-white/95"
          >
            Start as a landlord
          </Link>
          <Link
            href="/sign-up?role=tenant"
            className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            I&apos;m a tenant
          </Link>
        </div>
      </div>
    </section>
  );
}
