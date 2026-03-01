"use client";

import { useRef, useState, useCallback, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface PinInputProps {
  length?: number;
  onComplete: (pin: string) => void;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

function PinInput({
  length = 4,
  onComplete,
  disabled = false,
  error = false,
  className,
}: PinInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const focusInput = useCallback((index: number) => {
    inputRefs.current[index]?.focus();
  }, []);

  function handleChange(index: number, value: string) {
    if (disabled) return;

    const digit = value.replace(/\D/g, "").slice(-1);
    const newValues = [...values];
    newValues[index] = digit;
    setValues(newValues);

    if (digit && index < length - 1) {
      focusInput(index + 1);
    }

    if (digit && index === length - 1) {
      const pin = newValues.join("");
      if (pin.length === length) {
        onComplete(pin);
      }
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (disabled) return;

    if (e.key === "Backspace") {
      e.preventDefault();
      const newValues = [...values];

      if (values[index]) {
        newValues[index] = "";
        setValues(newValues);
      } else if (index > 0) {
        newValues[index - 1] = "";
        setValues(newValues);
        focusInput(index - 1);
      }
    }

    if (e.key === "ArrowLeft" && index > 0) {
      focusInput(index - 1);
    }
    if (e.key === "ArrowRight" && index < length - 1) {
      focusInput(index + 1);
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    if (disabled) return;

    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    const newValues = Array(length).fill("");
    paste.split("").forEach((char, i) => {
      newValues[i] = char;
    });
    setValues(newValues);

    if (paste.length === length) {
      onComplete(paste);
    } else {
      focusInput(Math.min(paste.length, length - 1));
    }
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {Array.from({ length }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "relative flex h-14 w-11 items-center justify-center rounded-input border-2 transition-all duration-150",
            values[index]
              ? error
                ? "border-danger bg-danger/10"
                : "border-sage-400 bg-sage-400/10"
              : "border-border bg-surface-2",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <input
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={values[index]}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className="absolute inset-0 h-full w-full bg-transparent text-center text-xl font-bold text-transparent caret-transparent focus:outline-none"
            aria-label={`PIN digit ${index + 1}`}
          />
          <div
            className={cn(
              "h-3 w-3 rounded-full transition-all duration-200",
              values[index]
                ? error
                  ? "bg-danger scale-100"
                  : "bg-sage-400 scale-100"
                : "bg-text-muted/30 scale-75"
            )}
          />
        </div>
      ))}
    </div>
  );
}

export { PinInput, type PinInputProps };
