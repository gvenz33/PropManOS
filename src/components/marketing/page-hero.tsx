type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
};

export function PageHero({ eyebrow, title, description, children }: Props) {
  return (
    <section className="marketing-page-hero border-b border-[var(--border)]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        {eyebrow ? (
          <p className="text-sm font-semibold uppercase tracking-widest text-[var(--brand-blue)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-lg text-[var(--muted)]">{description}</p>
        ) : null}
        {children}
      </div>
    </section>
  );
}
