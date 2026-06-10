type Props = {
  title: string;
  description?: string;
  children?: React.ReactNode;
};

export function DashboardPageHeader({ title, description, children }: Props) {
  return (
    <div className="dashboard-page-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-[var(--muted)]">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}
