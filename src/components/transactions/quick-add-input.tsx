"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, Loader2 } from "lucide-react";
import type { ParsedTransaction } from "@/types";

interface QuickAddInputProps {
  onParsed: (result: ParsedTransaction) => void;
  className?: string;
}

function QuickAddInput({ onParsed, className }: QuickAddInputProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      const json = await res.json();

      if (json.success && json.data) {
        onParsed(json.data);
        setText("");
      } else {
        setError(json.error || "Failed to parse input");
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder='e.g. "enoc 200 fab card yesterday"'
          className={cn(
            "w-full rounded-input bg-surface-2 border border-border px-4 py-3 pr-12 text-base text-text-primary",
            "placeholder:text-text-muted",
            "focus:outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-glow",
            "transition-all duration-150 ease-in-out",
            error && "border-danger"
          )}
          disabled={loading}
          aria-label="Quick add transaction"
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !text.trim()}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 rounded-[6px] p-1.5",
            "text-text-muted hover:text-sage-400 hover:bg-sage-400/10",
            "transition-all duration-150",
            "disabled:opacity-40 disabled:pointer-events-none"
          )}
          aria-label="Parse and add"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <ArrowRight size={18} />
          )}
        </button>
      </div>
      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}
    </div>
  );
}

export { QuickAddInput, type QuickAddInputProps };
