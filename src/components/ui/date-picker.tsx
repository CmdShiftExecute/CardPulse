"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";

interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
}

const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, label, error, id, ...props }, ref) => {
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
          <input
            ref={ref}
            id={id}
            type="date"
            className={cn(
              "w-full rounded-input bg-surface-2 border border-border px-3 py-2 pr-10 text-base text-text-primary",
              "focus:outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-glow",
              "transition-all duration-150 ease-in-out",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "[color-scheme:dark]",
              error && "border-danger focus:border-danger focus:ring-[#C8707015]",
              className
            )}
            {...props}
          />
          <Calendar
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

DatePicker.displayName = "DatePicker";
export { DatePicker, type DatePickerProps };
