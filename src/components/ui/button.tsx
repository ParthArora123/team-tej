import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[0_2px_8px_-2px_color-mix(in_oklab,var(--accent-gold)_20%,transparent)] hover:bg-primary/90 hover:shadow-[0_10px_30px_-10px_color-mix(in_oklab,var(--df-3)_40%,transparent)]",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background/40 backdrop-blur-md shadow-sm hover:bg-accent/60 hover:text-accent-foreground hover:border-primary/40",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent/40 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        premium:
          "text-primary-foreground shine-sweep bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)] hover:brightness-110 hover:-translate-y-0.5",
        gold:
          "text-black shine-sweep bg-[image:linear-gradient(135deg,var(--accent-gold),oklch(0.85_0.12_75))] shadow-[var(--shadow-gold)] hover:brightness-110 hover:-translate-y-0.5",
        glass:
          "text-foreground border border-white/15 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:border-white/25",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-full px-8 text-[13px]",
        xl: "h-12 rounded-full px-9 text-sm tracking-wide",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);


export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
