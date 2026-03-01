"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
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
        <div className="relative">
          <select
            ref={ref}
            id={id}
            className={cn(
              "w-full appearance-none rounded-input bg-surface-2 border border-border px-3 py-2 pr-9 text-base text-text-primary",
              "focus:outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-glow",
              "transition-all duration-150 ease-in-out",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error && "border-danger focus:border-danger focus:ring-[#C8707015]",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" className="text-text-muted">
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
            size={16}
          />
        </div>
        {error && (
          <p className="text-xs text-danger">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
export { Select, type SelectProps, type SelectOption };
