import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", {
  variants: {
    variant: {
      default: "bg-cream-200 text-ink-soft",
      free: "bg-emerald text-white",
      gold: "bg-gold-light text-gold border border-gold/30",
      success: "bg-emerald-light text-emerald",
      warn: "bg-amber-100 text-amber-800",
      danger: "bg-red-100 text-red-800",
    },
  },
  defaultVariants: { variant: "default" },
});

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
