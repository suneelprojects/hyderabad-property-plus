import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * HRC button system — mirrors the live site's `.btn` scale.
 *
 * Variants:
 *  - default / primary  → navy fill, white text
 *  - gold               → gold fill, navy text (primary CTA on hero + cards)
 *  - outline            → transparent, navy border
 *  - hero-outline       → transparent, white border (over hero imagery)
 *  - ghost / link       → shadcn defaults, retuned
 *  - secondary / destructive → shadcn defaults preserved
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] font-semibold cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[var(--shadow-soft)] hover:bg-[var(--navy-2)]",
        gold:
          "bg-[var(--gold)] text-[var(--navy)] shadow-[var(--shadow-soft)] hover:bg-[var(--gold-2)] hover:text-white",
        outline:
          "border border-[var(--navy)] bg-transparent text-[var(--navy)] hover:bg-[var(--navy)] hover:text-white",
        "hero-outline":
          "border border-white/80 bg-[rgba(6,20,45,0.35)] text-white shadow-[0_2px_14px_rgba(6,20,45,0.35)] backdrop-blur-sm hover:bg-white hover:text-[var(--navy)] focus-visible:ring-white/70",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[var(--mist)]/70",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        ghost: "hover:bg-[var(--mist)] hover:text-[var(--navy)]",
        link: "text-[var(--navy)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 text-sm [&_svg]:size-4",
        sm: "h-9 px-4 text-xs [&_svg]:size-3.5",
        lg: "h-12 px-7 text-[15px] [&_svg]:size-[18px]",
        xl: "h-14 px-8 text-base [&_svg]:size-5",
        icon: "h-11 w-11 [&_svg]:size-4",
        pill: "h-11 px-6 rounded-full text-sm [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
