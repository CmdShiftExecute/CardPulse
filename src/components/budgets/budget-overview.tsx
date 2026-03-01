"use client";

import { formatAmount, cn } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Target, TrendingUp, Wallet, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  overBudgetCount: number;
  approachingCount: number;
  onTrackCount: number;
}

interface BudgetOverviewProps {
  summary: BudgetSummary;
}

function BudgetOverview({ summary }: BudgetOverviewProps) {
  const totalRemaining = summary.totalBudget - summary.totalSpent;
  const overallPercent = summary.totalBudget > 0
    ? Math.round((summary.totalSpent / summary.totalBudget) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-card border border-border bg-surface-1 p-6 max-md:p-4"
    >
      {/* Overall progress */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-sage-400/10">
          <Wallet size={22} className="text-sage-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-semibold text-text-primary">Overall Budget</h3>
            <span className={cn(
              "font-mono text-sm font-bold tabular-nums",
              overallPercent >= 100 ? "text-danger" : overallPercent >= 75 ? "text-warning" : "text-sage-400"
            )}>
              {overallPercent}%
            </span>
          </div>
          <ProgressBar value={summary.totalSpent} max={summary.totalBudget || 1} size="md" />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-input border border-border/50 bg-surface-2/30 p-3 text-center">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Total Budget</p>
          <p className="font-mono text-lg font-bold tabular-nums text-text-primary">
            {formatAmount(summary.totalBudget)}
          </p>
        </div>

        <div className="rounded-input border border-border/50 bg-surface-2/30 p-3 text-center">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Total Spent</p>
          <p className={cn(
            "font-mono text-lg font-bold tabular-nums",
            overallPercent >= 100 ? "text-danger" : "text-text-primary"
          )}>
            {formatAmount(summary.totalSpent)}
          </p>
        </div>

        <div className="rounded-input border border-border/50 bg-surface-2/30 p-3 text-center">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">
            {totalRemaining >= 0 ? "Remaining" : "Over Budget"}
          </p>
          <p className={cn(
            "font-mono text-lg font-bold tabular-nums",
            totalRemaining >= 0 ? "text-success" : "text-danger"
          )}>
            {formatAmount(Math.abs(totalRemaining))}
          </p>
        </div>

        <div className="rounded-input border border-border/50 bg-surface-2/30 p-3">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2 text-center">Status</p>
          <div className="flex flex-col gap-1">
            {summary.overBudgetCount > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle size={10} className="text-danger" />
                  <span className="text-[10px] text-danger">Over</span>
                </div>
                <span className="font-mono text-xs font-semibold tabular-nums text-danger">
                  {summary.overBudgetCount}
                </span>
              </div>
            )}
            {summary.approachingCount > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={10} className="text-warning" />
                  <span className="text-[10px] text-warning">Near</span>
                </div>
                <span className="font-mono text-xs font-semibold tabular-nums text-warning">
                  {summary.approachingCount}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Target size={10} className="text-success" />
                <span className="text-[10px] text-success">Good</span>
              </div>
              <span className="font-mono text-xs font-semibold tabular-nums text-success">
                {summary.onTrackCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export { BudgetOverview, type BudgetSummary };
