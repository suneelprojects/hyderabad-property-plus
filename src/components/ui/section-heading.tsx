import { cn } from "@/lib/utils";
import { Eyebrow } from "./eyebrow";

/**
 * SectionHeading — eyebrow + Playfair title + optional muted subtitle.
 * Matches the "section header" pattern used on Featured Locations, Projects,
 * Reviews, etc.
 */
export interface SectionHeadingProps {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  as?: "h1" | "h2" | "h3";
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
  as: Tag = "h2",
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3",
        align === "center" ? "items-center text-center" : "items-start",
        className,
      )}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <Tag className="font-serif text-3xl font-semibold leading-tight tracking-tight text-[color:var(--navy)] md:text-4xl lg:text-[2.5rem]">
        {title}
      </Tag>
      {subtitle ? (
        <p
          className={cn(
            "max-w-2xl text-[15px] leading-relaxed text-muted-foreground",
            align === "center" ? "mx-auto" : "",
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
