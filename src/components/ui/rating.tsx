import { Star, StarHalf } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Star rating — supports half stars, gold accent.
 */
export interface RatingProps {
  value: number; // 0..5
  max?: number;
  size?: number;
  className?: string;
  showValue?: boolean;
  reviews?: number;
}

export function Rating({
  value,
  max = 5,
  size = 16,
  className,
  showValue = false,
  reviews,
}: RatingProps) {
  const safe = Math.max(0, Math.min(max, Number(value) || 0));
  const full = Math.floor(safe);
  const hasHalf = safe - full >= 0.25 && safe - full < 0.75;
  const filled = hasHalf ? full : Math.round(safe);
  const empty = max - full - (hasHalf ? 1 : 0);

  return (
    <div
      className={cn("inline-flex items-center gap-1.5", className)}
      aria-label={`Rated ${safe} out of ${max}`}
    >
      <div className="inline-flex items-center">
        {Array.from({ length: filled }).map((_, i) => (
          <Star
            key={`f-${i}`}
            width={size}
            height={size}
            className="fill-[color:var(--gold)] text-[color:var(--gold)]"
          />
        ))}
        {hasHalf ? (
          <StarHalf
            width={size}
            height={size}
            className="fill-[color:var(--gold)] text-[color:var(--gold)]"
          />
        ) : null}
        {Array.from({ length: Math.max(0, empty) }).map((_, i) => (
          <Star
            key={`e-${i}`}
            width={size}
            height={size}
            className="text-[color:var(--gold)]/35"
          />
        ))}
      </div>
      {showValue ? (
        <span className="text-sm font-semibold text-[color:var(--navy)]">
          {safe.toFixed(1)}
        </span>
      ) : null}
      {typeof reviews === "number" ? (
        <span className="text-xs text-muted-foreground">({reviews})</span>
      ) : null}
    </div>
  );
}
