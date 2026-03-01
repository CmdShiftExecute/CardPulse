"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, type = "text", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          type={type}
          className={cn(
            "w-full rounded-input bg-surface-2 border border-border px-3 py-2 text-base text-text-primary",
            "placeholder:text-text-muted",
            "focus:outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-glow",
            "transition-all duration-150 ease-in-out",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-danger focus:border-danger focus:ring-[#C8707015]",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-danger">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input, type InputProps };
