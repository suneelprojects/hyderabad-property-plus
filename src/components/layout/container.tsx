import { cn } from "@/lib/utils";

/**
 * Site container — max 1200px, responsive gutters. Matches the live
 * `.hrc-container` rule.
 */
export function Container({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}) {
  const Component = Tag as "div";
  return (
    <Component className={cn("hrc-container", className)}>{children}</Component>
  );
}
