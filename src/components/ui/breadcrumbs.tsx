import { Link } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";

import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * HRC Breadcrumbs — navy links, gold chevron, matches live styling.
 * `href` omitted on the last crumb.
 */
export function Breadcrumbs({
  items,
  className,
  homeHref = "/",
}: {
  items: Crumb[];
  className?: string;
  homeHref?: string;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground",
        className,
      )}
    >
      <Link
        to={homeHref}
        className="inline-flex items-center gap-1 text-[color:var(--navy)] hover:text-[color:var(--gold-2)]"
      >
        <Home className="h-3.5 w-3.5" />
        <span className="sr-only">Home</span>
      </Link>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={`${item.label}-${i}`} className="inline-flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-[color:var(--gold)]" />
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="font-medium text-[color:var(--navy)] hover:text-[color:var(--gold-2)]"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-muted-foreground" aria-current={isLast ? "page" : undefined}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
