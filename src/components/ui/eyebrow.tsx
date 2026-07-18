import { cn } from "@/lib/utils";

/**
 * Small caps eyebrow label used throughout the live site (hero, sections).
 */
export function Eyebrow({
  children,
  className,
  variant = "gold",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "gold" | "navy";
}) {
  return (
    <span
      className={cn(
        "inline-block text-xs font-semibold uppercase tracking-[0.18em]",
        variant === "gold"
          ? "text-[color:var(--gold)]"
          : "text-[color:var(--navy)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
