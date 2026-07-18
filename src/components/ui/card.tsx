import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * HRC Card — white surface, --radius (14px), --shadow-soft, hover lifts to
 * --shadow-lift. Matches the project/location card styling on the live site.
 */

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "group/card overflow-hidden rounded-[var(--radius)] border border-[color:var(--border)] bg-card text-card-foreground shadow-[var(--shadow-soft)] transition-shadow duration-300 hover:shadow-[var(--shadow-lift)]",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref as unknown as React.Ref<HTMLHeadingElement>}
    className={cn(
      "font-serif text-xl font-semibold leading-tight tracking-tight text-[color:var(--navy)]",
      className,
    )}
    {...(props as React.HTMLAttributes<HTMLHeadingElement>)}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref as unknown as React.Ref<HTMLParagraphElement>}
    className={cn("text-sm leading-relaxed text-muted-foreground", className)}
    {...(props as React.HTMLAttributes<HTMLParagraphElement>)}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center gap-3 p-6 pt-0 text-sm text-muted-foreground",
      className,
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

/**
 * Media slot for project/location cards — 4:3 image with subtle zoom on hover.
 */
const CardMedia = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { ratio?: string }
>(({ className, ratio = "4 / 3", style, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative w-full overflow-hidden bg-[color:var(--mist)] [&>img]:h-full [&>img]:w-full [&>img]:object-cover [&>img]:transition-transform [&>img]:duration-[600ms] group-hover/card:[&>img]:scale-[1.04]",
      className,
    )}
    style={{ aspectRatio: ratio, ...style }}
    {...props}
  />
));
CardMedia.displayName = "CardMedia";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardMedia,
};
