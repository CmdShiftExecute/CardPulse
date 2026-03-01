"use client";

import { TrendingUp, ShieldCheck, AlertTriangle } from "lucide-react";
import { formatAmount, cn } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/progress-bar";
import { motion } from "framer-motion";

interface CardCreditInfo {
  cardId: number;
  cardName: string;
  lastFour: string | null;
  color: string | null;
  creditLimit: number | null;
  cycleSpend: number;
  emiMonthly: number;
}

interface CreditOverviewProps {
  cards: CardCreditInfo[];
}

function CreditOverview({ cards }: CreditOverviewProps) {
  // Only include cards with credit limits
  const cardsWithLimits = cards.filter((c) => c.creditLimit && c.creditLimit > 0);
  if (cardsWithLimits.length === 0) return null;

  const totalCredit = cardsWithLimits.reduce((sum, c) => sum + (c.creditLimit || 0), 0);
  const totalUsed = cardsWithLimits.reduce(
    (sum, c) => sum + c.cycleSpend + c.emiMonthly,
    0
  );
  const totalAvailable = Math.max(totalCredit - totalUsed, 0);
  const totalUtilization = totalCredit > 0 ? (totalUsed / totalCredit) * 100 : 0;

  const isHighUtil = totalUtilization >= 75;
  const isDanger = totalUtilization >= 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.3 }}
      className="rounded-card border border-border bg-surface-1 overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 max-md:px-4 max-md:pt-4">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck size={18} className="text-text-muted" />
          <h3 className="text-lg font-semibold text-text-primary">
            Credit Overview
          </h3>
        </div>

        {/* Aggregated numbers */}
        <div className="grid grid-cols-3 gap-4 mb-4 max-sm:grid-cols-1 max-sm:gap-3">
          {/* Total Credit */}
          <div className="rounded-input bg-surface-2/50 border border-border/50 p-3">
            <p className="text-xs text-text-muted mb-1">Total Credit Limit</p>
            <p className="font-mono text-lg font-bold tabular-nums text-text-primary">
              {formatAmount(totalCredit)}
            </p>
          </div>

          {/* Total Used */}
          <div
            className={cn(
              "rounded-input border p-3",
              isDanger
                ? "bg-danger/5 border-danger/20"
                : isHighUtil
                  ? "bg-warning/5 border-warning/20"
                  : "bg-surface-2/50 border-border/50"
            )}
          >
            <p className="text-xs text-text-muted mb-1">Total Used (Cycle)</p>
            <p
              className={cn(
                "font-mono text-lg font-bold tabular-nums",
                isDanger
                  ? "text-danger"
                  : isHighUtil
                    ? "text-warning"
                    : "text-sand-400"
              )}
            >
              {formatAmount(totalUsed)}
            </p>
          </div>

          {/* Available */}
          <div className="rounded-input bg-surface-2/50 border border-border/50 p-3">
            <p className="text-xs text-text-muted mb-1">Available Credit</p>
            <p className="font-mono text-lg font-bold tabular-nums text-success">
              {formatAmount(totalAvailable)}
            </p>
          </div>
        </div>

        {/* Overall utilization bar */}
        <div className="mb-1">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <TrendingUp size={12} className="text-text-muted" />
              <span className="text-xs text-text-muted">Overall Utilization</span>
            </div>
            <span
              className={cn(
                "font-mono text-xs font-semibold tabular-nums",
                isDanger
                  ? "text-danger"
                  : isHighUtil
                    ? "text-warning"
                    : "text-success"
              )}
            >
              {totalUtilization.toFixed(1)}%
            </span>
          </div>
          <ProgressBar value={totalUsed} max={totalCredit} size="md" />
        </div>
      </div>

      {/* Per-card breakdown */}
      <div className="border-t border-border/50 px-5 py-4 max-md:px-4">
        <p className="text-xs text-text-muted mb-3 uppercase tracking-wider font-medium">
          Per-Card Breakdown
        </p>
        <div className="flex flex-col gap-3">
          {cardsWithLimits.map((card, i) => {
            const cardColor = card.color || "#7EB89E";
            const used = card.cycleSpend + card.emiMonthly;
            const limit = card.creditLimit || 1;
            const util = (used / limit) * 100;
            const cardDanger = util >= 100;
            const cardWarn = util >= 75;

            return (
              <motion.div
                key={card.cardId}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="flex items-center gap-3"
              >
                {/* Card color dot */}
                <div
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cardColor }}
                />

                {/* Card info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-secondary font-medium truncate">
                      {card.cardName}
                      {card.lastFour && (
                        <span className="text-text-muted ml-1">····{card.lastFour}</span>
                      )}
                    </span>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span
                        className={cn(
                          "font-mono text-xs tabular-nums font-medium",
                          cardDanger
                            ? "text-danger"
                            : cardWarn
                              ? "text-warning"
                              : "text-text-secondary"
                        )}
                      >
                        {formatAmount(used)}
                      </span>
                      <span className="text-[10px] text-text-muted">/</span>
                      <span className="font-mono text-[10px] tabular-nums text-text-muted">
                        {formatAmount(limit)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <ProgressBar value={used} max={limit} size="sm" />
                    </div>
                    <span
                      className={cn(
                        "font-mono text-[10px] tabular-nums font-medium w-10 text-right",
                        cardDanger
                          ? "text-danger"
                          : cardWarn
                            ? "text-warning"
                            : "text-text-muted"
                      )}
                    >
                      {util.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Warning banner if overall utilization is high */}
      {isHighUtil && (
        <div
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 border-t max-md:px-4",
            isDanger
              ? "bg-danger/5 border-danger/15"
              : "bg-warning/5 border-warning/15"
          )}
        >
          <AlertTriangle
            size={14}
            className={isDanger ? "text-danger" : "text-warning"}
          />
          <p
            className={cn(
              "text-xs font-medium",
              isDanger ? "text-danger" : "text-warning"
            )}
          >
            {isDanger
              ? "Credit utilization exceeds 100% — review your spending immediately"
              : "Credit utilization above 75% — consider reducing non-essential spending"}
          </p>
        </div>
      )}
    </motion.div>
  );
}

export { CreditOverview, type CreditOverviewProps, type CardCreditInfo };
