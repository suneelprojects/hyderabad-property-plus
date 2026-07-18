import { cn } from "@/lib/utils";
import { Container } from "./container";

/**
 * Section — vertical rhythm + optional alt (ivory) background.
 */
export function Section({
  children,
  className,
  containerClassName,
  alt = false,
  id,
  as: Tag = "section",
}: {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  alt?: boolean;
  id?: string;
  as?: "section" | "div";
}) {
  const Component = Tag;
  return (
    <Component
      id={id}
      className={cn("hrc-section", alt && "hrc-section-alt", className)}
    >
      <Container className={containerClassName}>{children}</Container>
    </Component>
  );
}
