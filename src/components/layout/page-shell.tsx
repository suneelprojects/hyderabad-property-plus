import { cn } from "@/lib/utils";
import { Breadcrumbs, type Crumb } from "@/components/ui/breadcrumbs";
import { Container } from "./container";

/**
 * PageShell — wrapper used by inner routes (not the home page). Provides
 * breadcrumbs, page title, and optional subtitle above the main content.
 */
export function PageShell({
  breadcrumbs,
  title,
  subtitle,
  eyebrow,
  action,
  className,
  children,
}: {
  breadcrumbs?: Crumb[];
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  eyebrow?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="bg-[color:var(--ivory)] pt-[88px]">
        <Container className="pb-8 pt-10">
          {breadcrumbs?.length ? (
            <Breadcrumbs items={breadcrumbs} className="mb-4" />
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              {eyebrow ? (
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--gold)]">
                  {eyebrow}
                </span>
              ) : null}
              <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight text-[color:var(--navy)] md:text-4xl">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
                  {subtitle}
                </p>
              ) : null}
            </div>
            {action ? <div>{action}</div> : null}
          </div>
        </Container>
      </div>
      <main className={cn("py-10", className)}>
        <Container>{children}</Container>
      </main>
    </>
  );
}
