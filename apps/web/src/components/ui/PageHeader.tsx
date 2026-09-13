export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
      <div>
        {eyebrow && (
          <p className="text-xs font-medium uppercase tracking-wide text-signal-dark">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 font-display text-3xl">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-slate">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
