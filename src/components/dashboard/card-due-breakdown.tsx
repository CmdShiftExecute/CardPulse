"use client";

import { useState, useMemo, useCallback } from "react";
import { CreditCard, Check, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn, formatAmount } from "@/lib/utils";
import { getCycleInfo } from "@/lib/cycle-utils";
import type { CardCycleConfig } from "@/lib/cycle-utils";

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
  prevCycleSpend: number;
  emiMonthly: number;
  transactionCount: number;
  currentCyclePayment: CyclePaymentStatus | null;
  prevCyclePayment: CyclePaymentStatus | null;
}

interface CardDueRow {
  cardId: number;
  cardName: string;
  lastFour: string | null;
  color: string | null;
  estimatedBill: number;
  dueDateStr: string;
  daysUntil: number;
  isPreviousCycle: boolean;
  cycleStart: string;
  cycleEnd: string;
  dueDate: Date;
  isPaid: boolean;
  paymentId: number | null;
}

interface CardDueBreakdownProps {
  cards: CardCycleData[];
  onPaymentChange?: () => void;
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function CardDueBreakdown({ cards, onPaymentChange }: CardDueBreakdownProps) {
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  const [localPaidMap, setLocalPaidMap] = useState<Record<string, { isPaid: boolean; paymentId: number | null }>>({});

  const rows = useMemo(() => {
    const result: CardDueRow[] = [];

    for (const card of cards) {
      const cycle = getCycleInfo(card as CardCycleConfig);
      const currentEstimatedBill = card.cycleSpend + card.emiMonthly;
      const prevEstimatedBill = card.prevCycleSpend + card.emiMonthly;

      // Use the most imminent due date per card
      // Prefer prev cycle if still upcoming (it's more urgent)
      if (cycle.daysUntilPrevDue > 0) {
        const prevCycleStartDate = new Date(cycle.cycleStartDate);
        prevCycleStartDate.setDate(prevCycleStartDate.getDate() - 1);
        const prevStart = new Date(prevCycleStartDate);
        if (card.cycleEnd < card.cycleStart) {
          prevStart.setMonth(prevStart.getMonth() - 1);
        }
        const capDay = (day: number, y: number, m: number) => {
          const lastDay = new Date(y, m + 1, 0).getDate();
          return Math.min(day, lastDay);
        };
        const psd = capDay(card.cycleStart, prevStart.getFullYear(), prevStart.getMonth());
        const prevStartDate = new Date(prevStart.getFullYear(), prevStart.getMonth(), psd);

        const localKey = `${card.cardId}-prev`;
        const localOverride = localPaidMap[localKey];
        const isPaid = localOverride !== undefined ? localOverride.isPaid : (card.prevCyclePayment?.isPaid ?? false);
        const paymentId = localOverride !== undefined ? localOverride.paymentId : (card.prevCyclePayment?.id ?? null);

        result.push({
          cardId: card.cardId,
          cardName: card.cardName,
          lastFour: card.lastFour,
          color: card.color,
          estimatedBill: prevEstimatedBill,
          dueDateStr: cycle.prevCycleDueDateStr,
          daysUntil: cycle.daysUntilPrevDue,
          isPreviousCycle: true,
          cycleStart: fmtDate(prevStartDate),
          cycleEnd: fmtDate(prevCycleStartDate),
          dueDate: cycle.prevCycleDueDate,
          isPaid,
          paymentId,
        });
      }

      // Current cycle due date
      if (cycle.daysUntilDue > 0) {
        const localKey = `${card.cardId}-curr`;
        const localOverride = localPaidMap[localKey];
        const isPaid = localOverride !== undefined ? localOverride.isPaid : (card.currentCyclePayment?.isPaid ?? false);
        const paymentId = localOverride !== undefined ? localOverride.paymentId : (card.currentCyclePayment?.id ?? null);

        result.push({
          cardId: card.cardId,
          cardName: card.cardName,
          lastFour: card.lastFour,
          color: card.color,
          estimatedBill: currentEstimatedBill,
          dueDateStr: cycle.dueDateStr,
          daysUntil: cycle.daysUntilDue,
          isPreviousCycle: false,
          cycleStart: fmtDate(cycle.cycleStartDate),
          cycleEnd: fmtDate(cycle.cycleEndDate),
          dueDate: cycle.dueDate,
          isPaid,
          paymentId,
        });
      }
    }

    return result.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [cards, localPaidMap]);

  const handleMarkPaid = useCallback(async (row: CardDueRow) => {
    const localKey = `${row.cardId}-${row.isPreviousCycle ? "prev" : "curr"}`;
    setMarkingPaid(localKey);

    try {
      if (row.isPaid && row.paymentId) {
        const res = await fetch("/api/cycle-payments", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: row.paymentId, isPaid: false }),
        });
        if (res.ok) {
          setLocalPaidMap((prev) => ({ ...prev, [localKey]: { isPaid: false, paymentId: row.paymentId } }));
          onPaymentChange?.();
        }
      } else {
        const res = await fetch("/api/cycle-payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardId: row.cardId,
            cycleStart: row.cycleStart,
            cycleEnd: row.cycleEnd,
            dueDate: fmtDate(row.dueDate),
            amount: row.estimatedBill,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          const newId = json.data?.id ?? row.paymentId;
          setLocalPaidMap((prev) => ({ ...prev, [localKey]: { isPaid: true, paymentId: newId } }));
          onPaymentChange?.();
        }
      }
    } finally {
      setMarkingPaid(null);
    }
  }, [onPaymentChange]);

  if (rows.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="rounded-card border border-border bg-surface-1 p-6 max-md:p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <CreditCard size={16} className="text-text-muted" />
          <h3 className="text-sm font-semibold text-text-primary">Due by Card</h3>
        </div>
        <p className="text-sm text-text-muted text-center py-4">No upcoming card payments</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.3 }}
      className="rounded-card border border-border bg-surface-1 overflow-hidden"
    >
      <div className="p-6 max-md:p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <CreditCard size={16} className="text-text-muted" />
          <h3 className="text-sm font-semibold text-text-primary">Due by Card</h3>
        </div>

        {/* Card rows */}
        <div className="flex flex-col">
          {rows.map((row, i) => {
            const localKey = `${row.cardId}-${row.isPreviousCycle ? "prev" : "curr"}`;
            const isLoading = markingPaid === localKey;
            const isDanger = !row.isPaid && row.daysUntil <= 5;
            const isWarning = !row.isPaid && row.daysUntil <= 14;
            const textColor = row.isPaid
              ? "text-success"
              : isDanger
                ? "text-danger"
                : isWarning
                  ? "text-warning"
                  : "text-text-secondary";

            return (
              <motion.div
                key={localKey}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className={cn(
                  "flex items-center gap-3 py-2.5",
                  i < rows.length - 1 && "border-b border-border/40"
                )}
              >
                {/* Card color dot */}
                <div
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: row.color || "#7EB89E" }}
                />

                {/* Card info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-text-secondary font-medium truncate">
                      {row.cardName}
                    </span>
                    {row.lastFour && (
                      <span className="font-mono text-[10px] text-text-muted tabular-nums">
                        ····{row.lastFour}
                      </span>
                    )}
                    {row.isPreviousCycle ? (
                      <span className="text-[9px] font-medium text-sand-300 bg-sand-400/10 px-1.5 py-0.5 rounded-full">
                        Last Cycle
                      </span>
                    ) : (
                      <span className="text-[9px] font-medium text-seafoam-300 bg-seafoam-400/10 px-1.5 py-0.5 rounded-full">
                        Current Cycle
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <span className={cn(
                  "font-mono text-sm font-semibold tabular-nums shrink-0",
                  row.isPaid ? "text-success/60 line-through" : textColor
                )}>
                  {formatAmount(row.estimatedBill)}
                </span>

                {/* Due date */}
                <div className="flex items-center gap-1 shrink-0 min-w-[80px] justify-end">
                  {row.isPaid ? (
                    <span className="flex items-center gap-1 text-xs text-success font-medium">
                      <Check size={12} />
                      Paid
                    </span>
                  ) : (
                    <>
                      <span className={cn("text-xs font-medium", textColor)}>
                        {row.dueDateStr}
                      </span>
                      <span className={cn("text-[10px]", textColor)}>
                        ({row.daysUntil}d)
                      </span>
                    </>
                  )}
                </div>

                {/* Mark Paid toggle */}
                <button
                  onClick={() => handleMarkPaid(row)}
                  disabled={isLoading}
                  className={cn(
                    "flex items-center gap-0.5 rounded-button px-1.5 py-1 text-[9px] font-medium transition-all shrink-0",
                    row.isPaid
                      ? "bg-success/10 text-success hover:bg-success/20"
                      : "bg-surface-3/60 text-text-muted hover:text-text-secondary hover:bg-surface-3"
                  )}
                  aria-label={row.isPaid ? `Unmark ${row.cardName} as paid` : `Mark ${row.cardName} as paid`}
                >
                  {isLoading ? (
                    <Loader2 size={9} className="animate-spin" />
                  ) : row.isPaid ? (
                    <Check size={9} />
                  ) : null}
                  {row.isPaid ? "✓" : "Pay"}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

export { CardDueBreakdown, type CardDueBreakdownProps };
