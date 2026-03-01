"use client";

import { useState, useEffect, useCallback } from "react";
import { formatAmount, cn } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Target, TrendingUp, TrendingDown, AlertTriangle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface BudgetItem {
  id: number;
  categoryId: number;
  categoryName: string;
  subcategoryId: number | null;
  subcategoryName: string | null;
  amount: number;
  spent: number;
  remaining: number;
  percent: number;
}

interface BudgetVsActualProps {
  year: number;
  month: number;
  monthLabel: string;
}

function getBarColor(percent: number): string {
  if (percent >= 100) return "text-danger";
  if (percent >= 75) return "text-warning";
  return "text-success";
}

function getBarBg(percent: number): string {
  if (percent >= 100) return "bg-danger/10";
  if (percent >= 75) return "bg-warning/10";
  return "bg-success/10";
}

function BudgetVsActual({ year, month, monthLabel }: BudgetVsActualProps) {
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/budgets?year=${year}&month=${month}`);
      const json = await res.json();
      if (json.success) {
        setBudgets(json.data);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="rounded-card border border-border bg-surface-1 p-6 flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-sage-400" />
      </div>
    );
  }

  if (budgets.length === 0) {
    return (
      <div className="rounded-card border border-border bg-surface-1 p-6 text-center">
        <div className="flex flex-col items-center py-8">
          <div className="h-14 w-14 rounded-full bg-surface-3 flex items-center justify-center mb-3">
            <Target size={24} className="text-text-muted/40" />
          </div>
          <p className="text-sm text-text-muted">No budgets set for {monthLabel}</p>
          <p className="text-xs text-text-muted/70 mt-1">Set budgets on the Budgets page to see tracking here</p>
        </div>
      </div>
    );
  }

  // Sort: over budget first, then by percent desc
  const sorted = [...budgets].sort((a, b) => b.percent - a.percent);

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const overallPercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const overCount = budgets.filter((b) => b.percent >= 100).length;

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <div className="rounded-card border border-border bg-surface-1 p-6 max-md:p-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-text-primary">Budget vs Actual</h3>
          {overCount > 0 && (
            <div className="flex items-center gap-1.5 text-danger">
              <AlertTriangle size={14} />
              <span className="text-xs font-medium">{overCount} over budget</span>
            </div>
          )}
        </div>

        {/* Overall progress */}
        <div className="rounded-input border border-border/50 bg-surface-2/30 p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-secondary">Total Budget Utilization</span>
            <span className={cn(
              "font-mono text-sm font-bold tabular-nums",
              getBarColor(overallPercent)
            )}>
              {overallPercent}%
            </span>
          </div>
          <ProgressBar value={totalSpent} max={totalBudget || 1} size="lg" />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-text-muted">
              {formatAmount(totalSpent)} spent
            </span>
            <span className="text-xs text-text-muted">
              of {formatAmount(totalBudget)}
            </span>
          </div>
        </div>

        {/* Individual budget bars */}
        <div className="space-y-4">
          {sorted.map((budget, i) => {
            const statusColor = getBarColor(budget.percent);
            const bgColor = getBarBg(budget.percent);
            const isOver = budget.percent >= 100;

            return (
              <motion.div
                key={budget.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  "rounded-input border border-border/40 p-4",
                  bgColor
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isOver ? (
                      <TrendingUp size={14} className="text-danger" />
                    ) : budget.percent >= 75 ? (
                      <TrendingUp size={14} className="text-warning" />
                    ) : (
                      <TrendingDown size={14} className="text-success" />
                    )}
                    <span className="text-sm font-medium text-text-primary">
                      {budget.categoryName}
                      {budget.subcategoryName && (
                        <span className="text-text-muted font-normal"> / {budget.subcategoryName}</span>
                      )}
                    </span>
                  </div>
                  <span className={cn("font-mono text-xs font-semibold tabular-nums", statusColor)}>
                    {budget.percent}%
                  </span>
                </div>

                <ProgressBar value={budget.spent} max={budget.amount || 1} size="sm" />

                <div className="flex items-center justify-between mt-2">
                  <span className="font-mono text-xs tabular-nums text-text-secondary">
                    {formatAmount(budget.spent)}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-text-muted">
                    / {formatAmount(budget.amount)}
                  </span>
                </div>

                {budget.remaining < 0 && (
                  <p className="text-[10px] text-danger mt-1 font-medium">
                    Over by {formatAmount(Math.abs(budget.remaining))}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { BudgetVsActual };
