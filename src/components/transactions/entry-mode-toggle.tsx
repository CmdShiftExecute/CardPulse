"use client";

import { cn } from "@/lib/utils";
import { Zap, PenLine } from "lucide-react";

type EntryMode = "quick" | "manual";

interface EntryModeToggleProps {
  mode: EntryMode;
  onChange: (mode: EntryMode) => void;
}

function EntryModeToggle({ mode, onChange }: EntryModeToggleProps) {
  return (
    <div className="inline-flex rounded-button border border-border bg-surface-1 p-1">
      <button
        onClick={() => onChange("quick")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-sm font-medium transition-all duration-150",
          mode === "quick"
            ? "bg-sage-400/15 text-sage-300"
            : "text-text-secondary hover:text-text-primary"
        )}
        aria-pressed={mode === "quick"}
        aria-label="Quick Add mode"
      >
        <Zap size={14} />
        Quick Add
      </button>
      <button
        onClick={() => onChange("manual")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-sm font-medium transition-all duration-150",
          mode === "manual"
            ? "bg-sage-400/15 text-sage-300"
            : "text-text-secondary hover:text-text-primary"
        )}
        aria-pressed={mode === "manual"}
        aria-label="Manual Entry mode"
      >
        <PenLine size={14} />
        Manual Entry
      </button>
    </div>
  );
}

export { EntryModeToggle, type EntryMode, type EntryModeToggleProps };
