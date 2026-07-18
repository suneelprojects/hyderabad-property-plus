import { cn } from "@/lib/utils";

/**
 * Empty / error states used by listings, search, filters.
 */

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[var(--radius)] border border-dashed border-[color:var(--border)] bg-white p-10 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-1 text-[color:var(--gold)]">{icon}</div>
      ) : null}
      <h3 className="font-serif text-xl font-semibold text-[color:var(--navy)]">
        {title}
      </h3>
      {description ? (
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this content. Please try again in a moment.",
  action,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[var(--radius)] border border-[color:var(--border)] bg-white p-10 text-center",
        className,
      )}
      role="alert"
    >
      <h3 className="font-serif text-xl font-semibold text-[color:var(--navy)]">
        {title}
      </h3>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
