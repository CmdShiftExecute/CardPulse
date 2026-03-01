"use client";

import { useState, useEffect, useCallback } from "react";
import { formatAmount, cn } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Target, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface BudgetItem {
  id: number;
  categoryName: string;
  subcategoryName: string | null;
  amount: number;
  spent: number;
  percent: number;
}

interface BudgetStripProps {
  year: number;
  month: number;
}

function BudgetStrip({ year, month }: BudgetStripProps) {
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBudgets = useCallback(async () => {
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
    fetchBudgets();
  }, [fetchBudgets]);

  if (loading || budgets.length === 0) return null;

  // Show top 4 budgets sorted by highest percent used
  const topBudgets = [...budgets]
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 4);

  const overBudgetCount = budgets.filter((b) => b.percent >= 100).length;
  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const overallPercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-card border border-border bg-surface-1 p-5 max-md:p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-sage-400" />
          <h3 className="text-sm font-semibold text-text-primary">Budget Tracking</h3>
          {overBudgetCount > 0 && (
            <span className="rounded-full bg-danger/[0.08] px-2 py-0.5 text-[10px] font-medium text-danger">
              {overBudgetCount} over
            </span>
          )}
        </div>
        <Link
          href="/budgets"
          className="flex items-center gap-1 text-xs text-text-muted hover:text-sage-300 transition-colors"
        >
          View all <ChevronRight size={12} />
        </Link>
      </div>

      {/* Overall bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-text-muted">Overall</span>
          <span className={cn(
            "font-mono text-xs font-semibold tabular-nums",
            overallPercent >= 100 ? "text-danger" : overallPercent >= 75 ? "text-warning" : "text-success"
          )}>
            {formatAmount(totalSpent)} / {formatAmount(totalBudget)}
          </span>
        </div>
        <ProgressBar value={totalSpent} max={totalBudget || 1} size="sm" />
      </div>

      {/* Top budgets */}
      <div className="space-y-3">
        {topBudgets.map((b) => (
          <div key={b.id}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-text-secondary truncate max-w-[180px]">
                {b.categoryName}
                {b.subcategoryName ? ` / ${b.subcategoryName}` : ""}
              </span>
              <span className={cn(
                "font-mono text-[10px] font-medium tabular-nums",
                b.percent >= 100 ? "text-danger" : b.percent >= 75 ? "text-warning" : "text-text-muted"
              )}>
                {b.percent}%
              </span>
            </div>
            <ProgressBar value={b.spent} max={b.amount || 1} size="sm" />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export { BudgetStrip };
