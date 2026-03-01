"use client";

import { useState, useEffect } from "react";
import { formatAmount } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Zap, X, Loader2, PartyPopper } from "lucide-react";

interface PendingEmi {
  id: number;
  description: string;
  monthlyAmount: number;
  cardName: string;
  monthsRemaining: number;
}

interface EmiGeneratePromptProps {
  onGenerated?: () => void;
}

function EmiGeneratePrompt({ onGenerated }: EmiGeneratePromptProps) {
  const [pending, setPending] = useState<PendingEmi[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [celebrationEmis, setCelebrationEmis] = useState<string[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/emis/generate");
        const json = await res.json();
        if (json.success) setPending(json.data);
      } catch { /* ignore */ }
      setLoading(false);
    }
    check();
  }, []);

  if (loading || dismissed || pending.length === 0) return null;

  const totalAmount = pending.reduce((sum, e) => sum + e.monthlyAmount, 0);
  const now = new Date();
  const monthName = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/emis/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emiIds: pending.map((e) => e.id) }),
      });
      const json = await res.json();
      if (json.success) {
        if (json.data.completed && json.data.completed.length > 0) {
          setCelebrationEmis(json.data.completed);
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 5000);
        }
        setPending([]);
        onGenerated?.();
      }
    } catch { /* ignore */ }
    setGenerating(false);
  }

  return (
    <>
      {/* Main prompt */}
      <div className="relative overflow-hidden rounded-card border border-sage-400/20 bg-gradient-to-r from-sage-400/5 to-seafoam-400/5">
        {/* Gradient accent line */}
        <div className="h-0.5 w-full bg-gradient-to-r from-sage-400 via-seafoam-400 to-sage-400" />

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-sage-400/10">
                <Zap size={18} className="text-sage-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-text-primary">
                  Generate EMI Transactions for {monthName}
                </h4>
                <p className="text-xs text-text-secondary mt-0.5">
                  {pending.length} installment{pending.length !== 1 ? "s" : ""} pending ·{" "}
                  <span className="font-mono text-sand-400 tabular-nums">
                    {formatAmount(totalAmount)}
                  </span>{" "}
                  total
                </p>
              </div>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="rounded-button p-1 text-text-muted hover:text-text-primary hover:bg-surface-3 transition-colors"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>

          {/* EMI list */}
          <div className="mt-3 flex flex-col gap-1.5">
            {pending.map((emi) => (
              <div
                key={emi.id}
                className="flex items-center justify-between rounded-input bg-surface-2/40 px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-1.5 w-1.5 rounded-full bg-sage-400 shrink-0" />
                  <span className="text-sm text-text-primary truncate">
                    {emi.description}
                  </span>
                  <span className="text-xs text-text-muted shrink-0">
                    {emi.cardName}
                  </span>
                </div>
                <span className="font-mono text-sm font-medium text-text-primary tabular-nums shrink-0 ml-3">
                  {formatAmount(emi.monthlyAmount)}
                </span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <><Loader2 size={14} className="animate-spin" />Generating...</>
              ) : (
                <>Generate {pending.length} Transaction{pending.length !== 1 ? "s" : ""}</>
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDismissed(true)} disabled={generating}>
              Later
            </Button>
          </div>
        </div>
      </div>

      {/* Celebration toast */}
      {showCelebration && celebrationEmis.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="rounded-card border border-success/30 bg-surface-2 p-4 shadow-lg max-w-sm">
            <div className="flex items-start gap-3">
              <PartyPopper size={24} className="text-success shrink-0" />
              <div>
                <p className="text-sm font-semibold text-text-primary">EMI Completed!</p>
                {celebrationEmis.map((name) => (
                  <p key={name} className="text-xs text-text-secondary mt-0.5">
                    {name} — all installments paid
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export { EmiGeneratePrompt, type EmiGeneratePromptProps };
