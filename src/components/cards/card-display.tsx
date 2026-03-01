"use client";

import { cn, formatAmount, getCurrency } from "@/lib/utils";
import { getCycleInfo } from "@/lib/cycle-utils";
import { CreditCard, Calendar, Clock, Pencil, Power, AlertCircle, AlertTriangle, Check } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";

interface CardDisplayData {
  id: number;
  name: string;
  bank: string;
  lastFour: string | null;
  cycleStart: number;
  cycleEnd: number;
  statementDay: number;
  dueDay: number;
  creditLimit: number | null;
  color: string | null;
  isActive: number;
  aliases: string[];
  // Optional: cycle spend data (passed from cards page if available)
  cycleSpend?: number;
  emiMonthly?: number;
  prevCyclePaid?: boolean;
}

interface CardDisplayProps {
  card: CardDisplayData;
  onEdit: (id: number) => void;
  onToggleActive: (id: number, newStatus: number) => void;
}

function CardDisplay({ card, onEdit, onToggleActive }: CardDisplayProps) {
  const cycle = getCycleInfo(card);
  const cardColor = card.color || "#7EB89E";

  // Utilization calculations (if spend data is provided)
  const totalBurden = (card.cycleSpend || 0) + (card.emiMonthly || 0);
  const hasSpendData = card.cycleSpend !== undefined;
  const utilization =
    hasSpendData && card.creditLimit && card.creditLimit > 0
      ? (totalBurden / card.creditLimit) * 100
      : null;

  const isDanger = utilization !== null && utilization >= 100;
  const isWarning = utilization !== null && utilization >= 75 && utilization < 100;

  // Due date highlighting
  const dueSoon = cycle.daysUntilDue <= 5;
  const dueUrgent = cycle.daysUntilDue <= 2;

  // Show previous cycle due date if it's still upcoming (positive days)
  const showPrevDue = cycle.daysUntilPrevDue > 0;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-card border transition-all duration-150",
        card.isActive
          ? cn(
              "bg-surface-1",
              isDanger
                ? "border-danger/40 shadow-[0_0_12px_rgba(200,112,112,0.08)]"
                : isWarning
                  ? "border-warning/30"
                  : "border-border hover:border-border-hover"
            )
          : "border-border/50 bg-surface-1/50 opacity-60"
      )}
    >
      {/* Color accent bar */}
      <div
        className="h-1.5 w-full"
        style={{
          backgroundColor: isDanger
            ? "#C87070"
            : isWarning
              ? "#D4B878"
              : cardColor,
        }}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-[10px]"
              style={{ backgroundColor: `${cardColor}20` }}
            >
              <CreditCard size={20} style={{ color: cardColor }} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text-primary">
                {card.name}
              </h3>
              <p className="text-sm text-text-secondary">{card.bank}</p>
            </div>
          </div>

          {card.lastFour && (
            <span className="font-mono text-sm text-text-muted tabular-nums">
              ····{card.lastFour}
            </span>
          )}
        </div>

        {/* Previous cycle due date alert (if upcoming) */}
        {showPrevDue && (
          card.prevCyclePaid ? (
            <div className="mb-3 flex items-center gap-2 rounded-input px-3 py-2 border bg-success/5 border-success/15">
              <Check size={14} className="shrink-0 text-success" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-success">
                  Previous cycle paid
                </p>
                <p className="text-xs text-success/60">
                  {cycle.prevCycleDueDateStr}
                </p>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                "mb-3 flex items-center gap-2 rounded-input px-3 py-2 border",
                cycle.daysUntilPrevDue <= 3
                  ? "bg-danger/8 border-danger/20"
                  : "bg-warning/5 border-warning/15"
              )}
            >
              <AlertCircle
                size={14}
                className={cn(
                  "shrink-0",
                  cycle.daysUntilPrevDue <= 3 ? "text-danger" : "text-warning"
                )}
              />
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-xs font-medium",
                    cycle.daysUntilPrevDue <= 3 ? "text-danger" : "text-warning"
                  )}
                >
                  Previous cycle payment due
                </p>
                <p className="text-xs text-text-secondary">
                  {cycle.prevCycleDueDateStr}{" "}
                  <span
                    className={
                      cycle.daysUntilPrevDue <= 3
                        ? "text-danger/70"
                        : "text-text-muted"
                    }
                  >
                    ({cycle.daysUntilPrevDue}d)
                  </span>
                </p>
              </div>
            </div>
          )
        )}

        {/* Cycle info */}
        <div className="mb-4 rounded-input bg-surface-2/50 border border-border/50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={14} className="text-text-muted" />
            <span className="text-sm font-medium text-text-secondary">
              Cycle: {cycle.cycleRange}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Clock size={12} className="text-text-muted" />
              <div>
                <p className="text-xs text-text-muted">Statement</p>
                <p className="text-sm text-text-primary">
                  {cycle.statementDateStr}{" "}
                  <span className="text-text-muted">
                    ({cycle.daysUntilStatement}d)
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock
                size={12}
                className={cn(
                  dueUrgent
                    ? "text-danger"
                    : dueSoon
                      ? "text-danger"
                      : "text-text-muted"
                )}
              />
              <div>
                <p
                  className={cn(
                    "text-xs",
                    dueUrgent || dueSoon ? "text-danger font-medium" : "text-text-muted"
                  )}
                >
                  Payment Due
                </p>
                <p
                  className={cn(
                    "text-sm",
                    dueUrgent
                      ? "text-danger font-bold"
                      : dueSoon
                        ? "text-danger font-medium"
                        : "text-text-primary"
                  )}
                >
                  {cycle.dueDateStr}{" "}
                  <span
                    className={cn(
                      dueUrgent
                        ? "text-danger/70"
                        : dueSoon
                          ? "text-danger/70"
                          : "text-text-muted"
                    )}
                  >
                    ({cycle.daysUntilDue}d)
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Credit limit + utilization */}
        {card.creditLimit && card.creditLimit > 0 && (
          <div
            className={cn(
              "mb-4 rounded-input border p-3",
              isDanger
                ? "bg-danger/5 border-danger/15"
                : isWarning
                  ? "bg-warning/5 border-warning/10"
                  : "bg-surface-2/50 border-border/50"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-text-muted">Credit Limit</p>
              {utilization !== null && (
                <div className="flex items-center gap-1">
                  {isDanger && <AlertTriangle size={11} className="text-danger" />}
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
                    {utilization.toFixed(1)}% used
                  </span>
                </div>
              )}
            </div>
            <p className="font-mono text-sm font-semibold text-text-primary tabular-nums mb-2">
              {getCurrency()}{" "}
              {card.creditLimit.toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </p>

            {/* Utilization bar (if spend data available) */}
            {utilization !== null && (
              <>
                <ProgressBar
                  value={totalBurden}
                  max={card.creditLimit}
                  size="sm"
                />
                <div className="flex items-center justify-between mt-1.5">
                  <span
                    className={cn(
                      "text-[10px] font-mono tabular-nums",
                      isDanger
                        ? "text-danger/70"
                        : isWarning
                          ? "text-warning/70"
                          : "text-text-muted"
                    )}
                  >
                    Used: {formatAmount(totalBurden)}
                  </span>
                  <span className="text-[10px] font-mono tabular-nums text-success/70">
                    Avail: {formatAmount(Math.max(card.creditLimit - totalBurden, 0))}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          <button
            onClick={() => onEdit(card.id)}
            className="inline-flex items-center gap-1.5 rounded-button px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-all duration-150"
            aria-label={`Edit ${card.name}`}
          >
            <Pencil size={12} />
            Edit
          </button>
          <button
            onClick={() => onToggleActive(card.id, card.isActive ? 0 : 1)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-button px-2.5 py-1.5 text-xs font-medium transition-all duration-150",
              card.isActive
                ? "text-text-muted hover:text-danger hover:bg-danger/[0.06]"
                : "text-sage-400 hover:text-sage-300 hover:bg-sage-400/10"
            )}
            aria-label={card.isActive ? `Deactivate ${card.name}` : `Reactivate ${card.name}`}
          >
            <Power size={12} />
            {card.isActive ? "Deactivate" : "Reactivate"}
          </button>
        </div>
      </div>
    </div>
  );
}

export { CardDisplay, type CardDisplayData, type CardDisplayProps };
