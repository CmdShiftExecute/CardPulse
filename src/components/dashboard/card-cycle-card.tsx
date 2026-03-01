"use client";

import { CreditCard, Calendar, Clock, FileText, Layers, AlertCircle, AlertTriangle, Check } from "lucide-react";
import { formatAmount, cn } from "@/lib/utils";
import { getCycleInfo } from "@/lib/cycle-utils";
import { ProgressBar } from "@/components/ui/progress-bar";
import { motion } from "framer-motion";

interface CyclePaymentStatus {
  id: number;
  isPaid: boolean;
  amount: number;
  paidAt: string | null;
}

interface CardCycleData {
  cardId: number;
  cardName: string;
  bank: string;
  lastFour: string | null;
  color: string | null;
  creditLimit: number | null;
  cycleStart: number;
  cycleEnd: number;
  statementDay: number;
  dueDay: number;
  cycleSpend: number;
  emiMonthly: number;
  transactionCount: number;
  currentCyclePayment?: CyclePaymentStatus | null;
  prevCyclePayment?: CyclePaymentStatus | null;
}

interface CardCycleCardProps {
  card: CardCycleData;
  index: number;
}

function CardCycleCard({ card, index }: CardCycleCardProps) {
  const cardColor = card.color || "#7EB89E";
  const cycle = getCycleInfo(card);
  const totalCycleBurden = card.cycleSpend + card.emiMonthly;
  const utilization =
    card.creditLimit && card.creditLimit > 0
      ? (totalCycleBurden / card.creditLimit) * 100
      : null;

  // Highlight thresholds
  const isDanger = utilization !== null && utilization >= 100;
  const isWarning = utilization !== null && utilization >= 75 && utilization < 100;
  const dueSoon = cycle.daysUntilDue <= 5;
  const dueUrgent = cycle.daysUntilDue <= 2;
  const statementSoon = cycle.daysUntilStatement <= 3;

  // Show previous cycle due date if it's still upcoming
  const showPrevDue = cycle.daysUntilPrevDue > 0;
  const prevCyclePaid = card.prevCyclePayment?.isPaid ?? false;
  const currentCyclePaid = card.currentCyclePayment?.isPaid ?? false;

  // Border glow for critical states
  const borderClass = isDanger
    ? "border-danger/40 shadow-[0_0_12px_rgba(200,112,112,0.08)]"
    : isWarning
      ? "border-warning/30"
      : "border-border hover:border-border-hover";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className={cn(
        "relative overflow-hidden rounded-card border bg-surface-1 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/10 transition-all duration-200",
        borderClass
      )}
    >
      {/* Card color accent — turns red/gold at high utilization */}
      <div
        className="h-1 w-full"
        style={{
          backgroundColor: isDanger
            ? "#C87070"
            : isWarning
              ? "#D4B878"
              : cardColor,
        }}
      />

      <div className="p-5 max-md:p-4">
        {/* Card header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-[10px]"
              style={{ backgroundColor: `${cardColor}18` }}
            >
              <CreditCard size={18} style={{ color: cardColor }} />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-text-primary truncate">
                {card.cardName}
              </h4>
              <p className="text-xs text-text-muted">{card.bank}</p>
            </div>
          </div>
          {card.lastFour && (
            <span className="font-mono text-xs text-text-muted tabular-nums">
              ····{card.lastFour}
            </span>
          )}
        </div>

        {/* Previous cycle due alert (if upcoming) */}
        {showPrevDue && (
          prevCyclePaid ? (
            <div className="mb-3 flex items-center gap-2 rounded-input px-3 py-1.5 border bg-success/5 border-success/15">
              <Check size={12} className="shrink-0 text-success" />
              <p className="text-[11px] text-success font-medium">
                Prev cycle paid
              </p>
            </div>
          ) : (
            <div
              className={cn(
                "mb-3 flex items-center gap-2 rounded-input px-3 py-1.5 border",
                cycle.daysUntilPrevDue <= 3
                  ? "bg-danger/8 border-danger/20"
                  : "bg-warning/5 border-warning/15"
              )}
            >
              <AlertCircle
                size={12}
                className={cn(
                  "shrink-0",
                  cycle.daysUntilPrevDue <= 3 ? "text-danger" : "text-warning"
                )}
              />
              <p
                className={cn(
                  "text-[11px]",
                  cycle.daysUntilPrevDue <= 3 ? "text-danger" : "text-warning"
                )}
              >
                Prev cycle due {cycle.prevCycleDueDateStr}{" "}
                <span className={cycle.daysUntilPrevDue <= 3 ? "text-danger/70" : "text-text-muted"}>
                  ({cycle.daysUntilPrevDue}d)
                </span>
              </p>
            </div>
          )
        )}

        {/* Cycle spend — the hero number */}
        <div className="mb-4">
          <p className="text-xs text-text-muted mb-1">Cycle Spend</p>
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                "font-mono text-xl font-bold tabular-nums",
                isDanger ? "text-danger" : ""
              )}
              style={!isDanger ? { color: cardColor } : undefined}
            >
              {formatAmount(card.cycleSpend)}
            </span>
            <span className="text-xs text-text-muted">
              {card.transactionCount} txn{card.transactionCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* EMI breakdown (if any) */}
        {card.emiMonthly > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-input bg-sand-400/5 border border-sand-400/10 px-3 py-2">
            <Layers size={14} className="text-sand-400 shrink-0" />
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="text-xs text-text-muted">EMI:</span>
              <span className="font-mono text-sm font-medium tabular-nums text-sand-400">
                {formatAmount(card.emiMonthly)}
              </span>
            </div>
          </div>
        )}

        {/* Estimated bill (shown when there are EMIs or when utilization is high) */}
        {(card.emiMonthly > 0 || isDanger || isWarning) && card.creditLimit && (
          <div
            className={cn(
              "mb-4 rounded-input px-3 py-2 border",
              isDanger
                ? "bg-danger/5 border-danger/15"
                : isWarning
                  ? "bg-warning/5 border-warning/10"
                  : "bg-surface-2/50 border-border/50"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Est. Bill</span>
              <span
                className={cn(
                  "font-mono text-sm font-semibold tabular-nums",
                  isDanger
                    ? "text-danger"
                    : isWarning
                      ? "text-warning"
                      : "text-text-primary"
                )}
              >
                {formatAmount(totalCycleBurden)}
              </span>
            </div>
          </div>
        )}

        {/* Utilization bar */}
        {utilization !== null && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-text-muted">Utilization</span>
                {isDanger && (
                  <AlertTriangle size={11} className="text-danger" />
                )}
              </div>
              <span
                className={cn(
                  "font-mono text-xs font-semibold tabular-nums",
                  isDanger
                    ? "text-danger"
                    : isWarning
                      ? "text-warning"
                      : "text-success"
                )}
              >
                {utilization.toFixed(1)}%
              </span>
            </div>
            <ProgressBar
              value={totalCycleBurden}
              max={card.creditLimit || 1}
              size="sm"
            />
            <div className="flex items-center justify-between mt-1">
              <span
                className={cn(
                  "text-[10px] font-mono tabular-nums",
                  isDanger
                    ? "text-danger/60"
                    : isWarning
                      ? "text-warning/60"
                      : "text-text-muted/60"
                )}
              >
                {formatAmount(totalCycleBurden)}
              </span>
              <span className="text-[10px] text-text-muted/60 font-mono tabular-nums">
                {formatAmount(card.creditLimit || 0)}
              </span>
            </div>
          </div>
        )}

        {/* Cycle info footer */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/50">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Calendar size={10} className="text-text-muted" />
              <span className="text-[10px] text-text-muted">Cycle</span>
            </div>
            <p className="text-xs text-text-secondary font-medium">
              {cycle.cycleRange}
            </p>
          </div>
          <div className="text-center border-x border-border/30">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <FileText size={10} className={statementSoon ? "text-warning" : "text-text-muted"} />
              <span className={cn("text-[10px]", statementSoon ? "text-warning" : "text-text-muted")}>
                Statement
              </span>
            </div>
            <p
              className={cn(
                "text-xs font-medium tabular-nums font-mono",
                statementSoon ? "text-warning" : "text-text-secondary"
              )}
            >
              {cycle.statementDateStr}
            </p>
            <p
              className={cn(
                "text-[10px] font-mono tabular-nums",
                statementSoon ? "text-warning/70" : "text-text-muted"
              )}
            >
              {cycle.daysUntilStatement}d
            </p>
          </div>
          <div className="text-center">
            {currentCyclePaid ? (
              <>
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Check size={10} className="text-success" />
                  <span className="text-[10px] text-success font-medium">Paid</span>
                </div>
                <p className="text-xs font-medium tabular-nums font-mono text-success/70">
                  {cycle.dueDateStr}
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Clock
                    size={10}
                    className={cn(
                      dueUrgent ? "text-danger" : dueSoon ? "text-danger" : "text-text-muted"
                    )}
                  />
                  <span
                    className={cn(
                      "text-[10px]",
                      dueUrgent ? "text-danger font-semibold" : dueSoon ? "text-danger" : "text-text-muted"
                    )}
                  >
                    Payment Due
                  </span>
                </div>
                <p
                  className={cn(
                    "text-xs font-medium tabular-nums font-mono",
                    dueUrgent
                      ? "text-danger font-bold"
                      : dueSoon
                        ? "text-danger"
                        : "text-text-secondary"
                  )}
                >
                  {cycle.dueDateStr}
                </p>
                <p
                  className={cn(
                    "text-[10px] font-mono tabular-nums",
                    dueUrgent
                      ? "text-danger font-semibold"
                      : dueSoon
                        ? "text-danger/70"
                        : "text-text-muted"
                  )}
                >
                  {cycle.daysUntilDue}d
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export { CardCycleCard, type CardCycleCardProps, type CardCycleData };
