export default function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-ink-soft mt-1 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}
