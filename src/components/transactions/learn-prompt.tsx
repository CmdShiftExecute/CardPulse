"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Lightbulb, X, Loader2 } from "lucide-react";

interface LearnPromptProps {
  keyword: string;
  categoryId: number;
  subcategoryId: number;
  labelIds: number[];
  onDismiss: () => void;
  onSaved: () => void;
}

function LearnPrompt({
  keyword,
  categoryId,
  subcategoryId,
  labelIds,
  onDismiss,
  onSaved,
}: LearnPromptProps) {
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword,
          categoryId,
          subcategoryId,
          labelIds,
        }),
      });
      const json = await res.json();
      if (json.success) {
        onSaved();
      }
    } catch {
      // Silently fail — learning is best-effort
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-input border border-sage-400/30 bg-sage-400/5 px-3 py-2">
      <Lightbulb size={16} className="shrink-0 text-sage-400" />
      <p className="flex-1 text-sm text-text-secondary">
        Remember{" "}
        <span className="font-medium text-sage-300">&ldquo;{keyword}&rdquo;</span>{" "}
        for next time?
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "rounded-[6px] px-2.5 py-1 text-xs font-medium",
            "bg-sage-400/15 text-sage-300 hover:bg-sage-400/25",
            "transition-all duration-150",
            "disabled:opacity-50"
          )}
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : "Yes"}
        </button>
        <button
          onClick={onDismiss}
          className="rounded-[6px] p-1 text-text-muted hover:text-text-primary hover:bg-surface-3 transition-colors"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export { LearnPrompt, type LearnPromptProps };
