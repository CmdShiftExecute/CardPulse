"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import type { HTMLAttributes } from "react";

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  onRemove?: () => void;
  removable?: boolean;
}

function Chip({ className, children, onRemove, removable = false, ...props }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-sand-400/15 px-2.5 py-1 text-xs font-medium text-sand-300",
        className
      )}
      {...props}
    >
      {children}
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="ml-0.5 rounded-full p-0.5 hover:bg-sand-400/25 transition-colors"
          aria-label="Remove"
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
}

export { Chip, type ChipProps };
