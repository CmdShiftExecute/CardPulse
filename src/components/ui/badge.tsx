import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type BadgeVariant = "category" | "label" | "card";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  category: "bg-sage-400/15 text-sage-300",
  label: "bg-sand-400/15 text-sand-300",
  card: "bg-seafoam-400/15 text-seafoam-300",
};

function Badge({ className, variant = "category", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge, type BadgeProps, type BadgeVariant };
