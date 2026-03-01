"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Clock, Check, CircleCheck, Loader2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatAmount } from "@/lib/utils";
import { getCycleInfo, diffDays } from "@/lib/cycle-utils";
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
  emiMonthly: number;
  transactionCount: number;
  currentCyclePayment: CyclePaymentStatus | null;
  prevCyclePayment: CyclePaymentStatus | null;
}

interface DueEvent {
  cardId: number;
  cardName: string;
  lastFour: string | null;
  color: string | null;
  estimatedBill: number;
  dueDate: Date;
  dueDateStr: string;
  daysUntil: number;
  isPreviousCycle: boolean;
  cycleStart: string;
  cycleEnd: string;
  isPaid: boolean;
  paymentId: number | null;
}

interface DueDateGroup {
  dateKey: string;
  dateStr: string;
  daysUntil: number;
  totalAmount: number;
  allPaid: boolean;
  events: DueEvent[];
}

interface PaymentDueSummaryProps {
  cards: CardCycleData[];
  onPaymentChange?: () => void;
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function CycleBadge({ isPreviousCycle }: { isPreviousCycle: boolean }) {
  if (isPreviousCycle) {
    return (
      <span className="inline-flex items-center text-[9px] font-medium text-sand-300 bg-sand-400/10 px-1.5 py-0.5 rounded-full">
        Last Cycle
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-[9px] font-medium text-seafoam-300 bg-seafoam-400/10 px-1.5 py-0.5 rounded-full">
      Current Cycle
    </span>
  );
}

function PaymentDueSummary({ cards, onPaymentChange }: PaymentDueSummaryProps) {
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  const [localPaidMap, setLocalPaidMap] = useState<Record<string, { isPaid: boolean; paymentId: number | null }>>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const dueGroups = useMemo(() => {
    const events: DueEvent[] = [];

    for (const card of cards) {
      const cycle = getCycleInfo(card as CardCycleConfig);
      const estimatedBill = card.cycleSpend + card.emiMonthly;

      // Previous cycle due date (if still upcoming)
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

        events.push({
          cardId: card.cardId,
          cardName: card.cardName,
          lastFour: card.lastFour,
          color: card.color,
          estimatedBill,
          dueDate: cycle.prevCycleDueDate,
          dueDateStr: cycle.prevCycleDueDateStr,
          daysUntil: cycle.daysUntilPrevDue,
          isPreviousCycle: true,
          cycleStart: fmtDate(prevStartDate),
          cycleEnd: fmtDate(prevCycleStartDate),
          isPaid,
          paymentId,
        });
      }

      // Current cycle due date (if in the future)
      if (cycle.daysUntilDue > 0) {
        const localKey = `${card.cardId}-curr`;
        const localOverride = localPaidMap[localKey];
        const isPaid = localOverride !== undefined ? localOverride.isPaid : (card.currentCyclePayment?.isPaid ?? false);
        const paymentId = localOverride !== undefined ? localOverride.paymentId : (card.currentCyclePayment?.id ?? null);

        events.push({
          cardId: card.cardId,
          cardName: card.cardName,
          lastFour: card.lastFour,
          color: card.color,
          estimatedBill,
          dueDate: cycle.dueDate,
          dueDateStr: cycle.dueDateStr,
          daysUntil: cycle.daysUntilDue,
          isPreviousCycle: false,
          cycleStart: fmtDate(cycle.cycleStartDate),
          cycleEnd: fmtDate(cycle.cycleEndDate),
          isPaid,
          paymentId,
        });
      }
    }

    // Group by due date
    const groupMap = new Map<string, DueDateGroup>();
    for (const evt of events) {
      const key = fmtDate(evt.dueDate);
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          dateKey: key,
          dateStr: evt.dueDateStr,
          daysUntil: evt.daysUntil,
          totalAmount: 0,
          allPaid: true,
          events: [],
        });
      }
      const group = groupMap.get(key)!;
      group.events.push(evt);
      group.totalAmount += evt.estimatedBill;
      if (!evt.isPaid) group.allPaid = false;
    }

    return Array.from(groupMap.values()).sort((a, b) => a.daysUntil - b.daysUntil);
  }, [cards, localPaidMap]);

  // Default: expand the hero (first) group
  useEffect(() => {
    if (dueGroups.length > 0 && expandedGroups.size === 0) {
      setExpandedGroups(new Set([dueGroups[0].dateKey]));
    }
  }, [dueGroups, expandedGroups.size]);

  const toggleGroup = useCallback((dateKey: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(dateKey)) {
        next.delete(dateKey);
      } else {
        next.add(dateKey);
      }
      return next;
    });
  }, []);

  const handleMarkPaid = useCallback(async (event: DueEvent) => {
    const localKey = `${event.cardId}-${event.isPreviousCycle ? "prev" : "curr"}`;
    setMarkingPaid(localKey);

    try {
      if (event.isPaid && event.paymentId) {
        const res = await fetch("/api/cycle-payments", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: event.paymentId, isPaid: false }),
        });
        if (res.ok) {
          setLocalPaidMap((prev) => ({ ...prev, [localKey]: { isPaid: false, paymentId: event.paymentId } }));
          onPaymentChange?.();
        }
      } else {
        const res = await fetch("/api/cycle-payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardId: event.cardId,
            cycleStart: event.cycleStart,
            cycleEnd: event.cycleEnd,
            dueDate: fmtDate(event.dueDate),
            amount: event.estimatedBill,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          const newId = json.data?.id ?? event.paymentId;
          setLocalPaidMap((prev) => ({ ...prev, [localKey]: { isPaid: true, paymentId: newId } }));
          onPaymentChange?.();
        }
      }
    } finally {
      setMarkingPaid(null);
    }
  }, [onPaymentChange]);

  function getUrgencyColor(daysUntil: number, isPaid: boolean): { text: string; bg: string; border: string } {
    if (isPaid) return { text: "text-success", bg: "bg-success/5", border: "border-success/20" };
    if (daysUntil <= 5) return { text: "text-danger", bg: "bg-danger/5", border: "border-danger/20" };
    if (daysUntil <= 14) return { text: "text-warning", bg: "bg-warning/5", border: "border-warning/20" };
    return { text: "text-sage-400", bg: "bg-sage-400/5", border: "border-sage-400/20" };
  }

  if (dueGroups.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="rounded-card border border-border bg-surface-1 p-6 max-md:p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-text-muted" />
          <h3 className="text-sm font-semibold text-text-primary">Upcoming Payments</h3>
        </div>
        <div className="flex flex-col items-center py-4 text-center">
          <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center mb-2">
            <CircleCheck size={20} className="text-success" />
          </div>
          <p className="text-sm text-text-secondary">All caught up!</p>
          <p className="text-xs text-text-muted mt-1">No upcoming payments</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.3 }}
      className="rounded-card border border-border bg-surface-1 overflow-hidden"
    >
      <div className="p-6 max-md:p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-text-muted" />
          <h3 className="text-sm font-semibold text-text-primary">Upcoming Payments</h3>
        </div>

        {/* Due date groups */}
        <div className="flex flex-col gap-2">
          {dueGroups.map((group, groupIdx) => {
            const isHero = groupIdx === 0;
            const isExpanded = expandedGroups.has(group.dateKey);
            const colors = getUrgencyColor(group.daysUntil, group.allPaid);

            return (
              <div
                key={group.dateKey}
                className={cn(
                  "rounded-input border overflow-hidden transition-colors duration-150",
                  colors.bg, colors.border
                )}
              >
                {/* Group header — clickable to expand/collapse */}
                <button
                  onClick={() => toggleGroup(group.dateKey)}
                  className="w-full flex items-center justify-between gap-3 p-3 hover:bg-surface-3/30 transition-colors duration-150"
                  aria-expanded={isExpanded}
                  aria-label={`${group.dateStr} payment group, ${group.events.length} card${group.events.length > 1 ? "s" : ""}`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* Date or Paid status */}
                    <span className={cn(
                      isHero ? "text-lg font-semibold" : "text-sm font-medium",
                      colors.text
                    )}>
                      {group.allPaid ? (
                        <span className="flex items-center gap-1.5">
                          <Check size={isHero ? 18 : 14} />
                          Paid
                        </span>
                      ) : (
                        group.dateStr
                      )}
                    </span>

                    {/* Countdown badge */}
                    {!group.allPaid && (
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border",
                        colors.bg, colors.text, colors.border
                      )}>
                        {group.daysUntil === 1 ? "tomorrow" : `${group.daysUntil}d`}
                      </span>
                    )}

                    {/* Card color dots (visible when collapsed) */}
                    {!isExpanded && (
                      <div className="flex items-center gap-1.5 ml-1">
                        {group.events.map((evt) => (
                          <div
                            key={`${evt.cardId}-${evt.isPreviousCycle}`}
                            className="flex items-center gap-1"
                          >
                            <div
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: evt.color || "#7EB89E" }}
                            />
                            <span className="text-[10px] text-text-muted truncate max-w-[120px]">
                              {evt.cardName.replace(" Card", "")}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Total amount */}
                    <span className={cn(
                      "font-mono tabular-nums tracking-tight",
                      isHero ? "text-xl font-bold" : "text-sm font-semibold",
                      group.allPaid ? "text-success/60" : colors.text
                    )}>
                      {formatAmount(group.totalAmount)}
                    </span>

                    {/* Chevron */}
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={isHero ? 18 : 14} className="text-text-muted" />
                    </motion.div>
                  </div>
                </button>

                {/* Expanded: individual card rows */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border/30 px-3 pb-3">
                        {group.events.map((evt, evtIdx) => {
                          const localKey = `${evt.cardId}-${evt.isPreviousCycle ? "prev" : "curr"}`;
                          const isLoading = markingPaid === localKey;

                          return (
                            <div
                              key={localKey}
                              className={cn(
                                "flex items-center gap-3 py-2.5",
                                evtIdx < group.events.length - 1 && "border-b border-border/20"
                              )}
                            >
                              {/* Card color dot */}
                              <div
                                className="h-3 w-3 rounded-full shrink-0"
                                style={{ backgroundColor: evt.color || "#7EB89E" }}
                              />

                              {/* Card info */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-sm text-text-primary font-medium">
                                    {evt.cardName}
                                  </span>
                                  {evt.lastFour && (
                                    <span className="font-mono text-[10px] text-text-muted tabular-nums">
                                      ····{evt.lastFour}
                                    </span>
                                  )}
                                  <CycleBadge isPreviousCycle={evt.isPreviousCycle} />
                                </div>
                              </div>

                              {/* Amount */}
                              <span className={cn(
                                "font-mono text-sm font-semibold tabular-nums shrink-0",
                                evt.isPaid ? "text-success/70" : colors.text
                              )}>
                                {formatAmount(evt.estimatedBill)}
                              </span>

                              {/* Mark Paid button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkPaid(evt);
                                }}
                                disabled={isLoading}
                                className={cn(
                                  "flex items-center gap-1 rounded-button px-2 py-1 text-[10px] font-medium transition-all duration-150 shrink-0",
                                  evt.isPaid
                                    ? "bg-success/10 text-success hover:bg-success/20"
                                    : "bg-surface-3/60 text-text-secondary hover:bg-surface-3 hover:text-text-primary"
                                )}
                                aria-label={evt.isPaid ? `Unmark ${evt.cardName} as paid` : `Mark ${evt.cardName} as paid`}
                              >
                                {isLoading ? (
                                  <Loader2 size={10} className="animate-spin" />
                                ) : evt.isPaid ? (
                                  <Check size={10} />
                                ) : null}
                                {evt.isPaid ? "Paid" : "Mark Paid"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Cycle Progress Section */}
        <CycleProgressSection cards={cards} />
      </div>
    </motion.div>
  );
}

function CycleProgressSection({ cards }: { cards: CardCycleData[] }) {
  const now = new Date();

  // Deduplicate cards (might have prev + current entries)
  const uniqueCards = cards.filter(
    (card, idx, arr) => arr.findIndex((c) => c.cardId === card.cardId) === idx
  );

  return (
    <div className="border-t border-border/30 mt-4 pt-4">
      <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-3">
        Cycle Progress
      </p>
      <div className="flex flex-col gap-3">
        {uniqueCards.map((card) => {
          const cycle = getCycleInfo(card as CardCycleConfig);
          const totalDays = Math.max(1, diffDays(cycle.cycleEndDate, cycle.cycleStartDate));
          const elapsed = diffDays(now, cycle.cycleStartDate);
          const percent = Math.min(Math.max((elapsed / totalDays) * 100, 0), 100);
          const dayNum = Math.min(Math.max(elapsed, 0), totalDays);

          const dueUrgency =
            cycle.daysUntilDue <= 5
              ? "text-danger"
              : cycle.daysUntilDue <= 14
                ? "text-warning"
                : "text-text-muted";

          return (
            <div key={card.cardId} className="space-y-1">
              {/* Card name row */}
              <div className="flex items-center gap-1.5">
                <div
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: card.color || "#7EB89E" }}
                />
                <span className="text-[11px] font-medium text-text-secondary truncate">
                  {card.cardName.replace(" Card", "")}
                </span>
                {card.lastFour && (
                  <span className="font-mono text-[9px] text-text-muted tabular-nums">
                    ····{card.lastFour}
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: card.color || "#7EB89E",
                    }}
                  />
                </div>
                <span className="font-mono text-[10px] tabular-nums text-text-muted shrink-0">
                  Day {dayNum}/{totalDays}
                </span>
              </div>

              {/* Statement + Due dates */}
              <div className="flex items-center gap-3 text-[10px]">
                <span className="text-text-muted">
                  Stmt: {cycle.statementDateStr}
                  {cycle.daysUntilStatement > 0 && (
                    <span className="ml-0.5">({cycle.daysUntilStatement}d)</span>
                  )}
                </span>
                <span className="text-text-muted/30">&#x25CF;</span>
                <span className={dueUrgency}>
                  Due: {cycle.dueDateStr}
                  {cycle.daysUntilDue > 0 && (
                    <span className="ml-0.5">({cycle.daysUntilDue}d)</span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { PaymentDueSummary, type PaymentDueSummaryProps, type CyclePaymentStatus };
