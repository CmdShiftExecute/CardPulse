"use client";

import { formatAmount, cn } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Edit3, Trash2, Target, TrendingDown, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface BudgetCardData {
  id: number;
  categoryId: number;
  categoryName: string;
  subcategoryId: number | null;
  subcategoryName: string | null;
  month: number;
  year: number;
  amount: number;
  spent: number;
  remaining: number;
  percent: number;
}

interface BudgetCardProps {
  budget: BudgetCardData;
  index: number;
  onEdit: (budget: BudgetCardData) => void;
  onDelete: (id: number) => void;
}

function getStatusInfo(percent: number): {
  label: string;
  color: string;
  icon: React.ElementType;
} {
  if (percent >= 100) {
    return { label: "Over Budget", color: "text-danger", icon: TrendingUp };
  }
  if (percent >= 75) {
    return { label: "Approaching", color: "text-warning", icon: TrendingUp };
  }
  return { label: "On Track", color: "text-success", icon: TrendingDown };
}

function BudgetCard({ budget, index, onEdit, onDelete }: BudgetCardProps) {
  const status = getStatusInfo(budget.percent);
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className="rounded-card border border-border bg-surface-1 p-5 max-md:p-4 hover:border-border-hover hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/10 transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-sage-400/10">
            <Target size={20} className="text-sage-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text-primary">
              {budget.categoryName}
            </h4>
            {budget.subcategoryName && (
              <p className="text-xs text-text-muted">{budget.subcategoryName}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(budget)}
            className="rounded-button p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-3 transition-colors"
            aria-label="Edit budget"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={() => onDelete(budget.id)}
            className="rounded-button p-1.5 text-text-muted hover:text-danger hover:bg-danger/[0.08] transition-colors"
            aria-label="Delete budget"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Amounts */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Budget</p>
          <p className="font-mono text-sm font-semibold tabular-nums text-text-primary">
            {formatAmount(budget.amount)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Spent</p>
          <p className={cn(
            "font-mono text-sm font-semibold tabular-nums",
            budget.percent >= 100 ? "text-danger" : "text-text-primary"
          )}>
            {formatAmount(budget.spent)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">
            {budget.remaining >= 0 ? "Remaining" : "Over by"}
          </p>
          <p className={cn(
            "font-mono text-sm font-semibold tabular-nums",
            budget.remaining >= 0 ? "text-success" : "text-danger"
          )}>
            {formatAmount(Math.abs(budget.remaining))}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <ProgressBar value={budget.spent} max={budget.amount} size="md" />

      {/* Status footer */}
      <div className="flex items-center justify-between mt-3">
        <div className={cn("flex items-center gap-1.5", status.color)}>
          <StatusIcon size={12} />
          <span className="text-xs font-medium">{status.label}</span>
        </div>
        <span className={cn("font-mono text-xs font-semibold tabular-nums", status.color)}>
          {budget.percent}%
        </span>
      </div>
    </motion.div>
  );
}

export { BudgetCard, type BudgetCardData };
