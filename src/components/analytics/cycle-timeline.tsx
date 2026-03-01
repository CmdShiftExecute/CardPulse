"use client";

import { useState } from "react";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { formatAmount, cn } from "@/lib/utils";
import {
  CreditCard,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowRight,
  Check,
} from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { motion, AnimatePresence } from "framer-motion";

interface CycleTimelineEvent {
  type: "expense" | "emi";
  cardId: number;
  cardName: string;
  cardColor: string;
  amount: number;
  description: string;
  date: string;
  categoryName: string | null;
}

interface CyclePeriod {
  start: string;
  end: string;
  expenses: number;
  emiTotal: number;
  total: number;
  events: CycleTimelineEvent[];
  paymentDueDate: string;
  isPaid?: boolean;
}

interface CycleForecast {
  cardId: number;
  cardName: string;
  cardColor: string;
  bank: string;
  lastFour: string | null;
  creditLimit: number | null;
  previousCycle: CyclePeriod;
  currentCycle: CyclePeriod;
  nextCycle: {
    start: string;
    end: string;
    emiTotal: number;
    paymentDueDate: string;
  };
  statementDay: number;
  dueDay: number;
}

interface CycleTimelineProps {
  data: CycleForecast[];
}

/* ── Helpers ────────────────────────────────────────── */

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getDayNum(dateStr: string): number {
  return new Date(dateStr + "T00:00:00").getDate();
}

function getDaysInRange(start: string, end: string): number {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  return Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}

function getOrbSize(amount: number, maxAmount: number): number {
  if (maxAmount === 0) return 20;
  const minSize = 14;
  const maxSize = 44;
  const ratio = Math.sqrt(amount / maxAmount); // sqrt scale for better distribution
  return Math.round(minSize + ratio * (maxSize - minSize));
}

/* ── Neon-tinted orb color from card base color ─────── */
function getNeonColor(hex: string, intensity: number = 0.3): string {
  // Brighten the card color slightly for a subtle neon feel
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.min(255, Math.round(r + (255 - r) * intensity));
  const ng = Math.min(255, Math.round(g + (255 - g) * intensity));
  const nb = Math.min(255, Math.round(b + (255 - b) * intensity));
  return `#${nr.toString(16).padStart(2, "0")}${ng.toString(16).padStart(2, "0")}${nb.toString(16).padStart(2, "0")}`;
}

/* ── Date axis gridlines generator ──────────────────── */
function generateDateMarkers(start: string, end: string): { day: number; label: string; position: number }[] {
  const totalDays = getDaysInRange(start, end);
  const startDay = getDayNum(start);
  const markers: { day: number; label: string; position: number }[] = [];

  // Show ~5-7 markers evenly distributed
  const interval = Math.max(1, Math.ceil(totalDays / 7));
  for (let i = 0; i < totalDays; i += interval) {
    const d = new Date(start + "T00:00:00");
    d.setDate(d.getDate() + i);
    const dayNum = d.getDate();
    const position = i / (totalDays - 1);
    markers.push({
      day: dayNum,
      label: dayNum === startDay ? formatShortDate(start).split(" ")[0] + " " + dayNum : String(dayNum),
      position,
    });
  }

  // Always include the last day
  const lastDay = getDayNum(end);
  if (markers.length === 0 || markers[markers.length - 1].day !== lastDay) {
    markers.push({ day: lastDay, label: String(lastDay), position: 1 });
  }

  return markers;
}

/* ── Cycle Summary Card ─────────────────────────────── */
function CycleSummaryBox({
  label,
  icon: Icon,
  iconColor,
  dateRange,
  expenses,
  emiTotal,
  total,
  variant,
  creditLimit,
  paymentDueDate,
  currentCycleDueDate,
  isPaid,
}: {
  label: string;
  icon: React.ElementType;
  iconColor: string;
  dateRange: string;
  expenses?: number;
  emiTotal: number;
  total?: number;
  variant: "previous" | "current" | "next";
  creditLimit: number | null;
  paymentDueDate: string;
  currentCycleDueDate?: string;
  isPaid?: boolean;
}) {
  const isPrev = variant === "previous";
  const isNext = variant === "next";

  // Calculate days until current cycle due date (for Next Cycle card)
  const currentCycleDueDays = currentCycleDueDate ? (() => {
    const now = new Date();
    const due = new Date(currentCycleDueDate + "T00:00:00");
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  })() : null;

  return (
    <div
      className={cn(
        "rounded-input p-4 flex-1 min-w-0",
        isPrev && "border border-border/40 bg-surface-2/15 opacity-80",
        variant === "current" && "border border-sage-400/30 bg-surface-2/40",
        isNext && "border border-border/40 border-dashed bg-surface-2/10 opacity-70"
      )}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} style={{ color: iconColor }} />
        <span className="text-xs font-medium" style={{ color: iconColor }}>{label}</span>
      </div>

      {/* Current cycle due date alert — shown prominently on Next Cycle card */}
      {isNext && currentCycleDueDate && (
        <div className={cn(
          "flex items-center gap-1.5 rounded-[6px] px-2 py-1.5 mb-2",
          currentCycleDueDays !== null && currentCycleDueDays <= 5
            ? "bg-danger/[0.07]"
            : "bg-warning/[0.07]"
        )}>
          <Clock size={10} className={cn(
            currentCycleDueDays !== null && currentCycleDueDays <= 5
              ? "text-danger"
              : "text-warning"
          )} />
          <span className={cn(
            "text-[10px] font-medium",
            currentCycleDueDays !== null && currentCycleDueDays <= 5
              ? "text-danger"
              : "text-warning"
          )}>
            Payment Due:
          </span>
          <span className={cn(
            "font-mono text-[11px] font-bold tabular-nums",
            currentCycleDueDays !== null && currentCycleDueDays <= 5
              ? "text-danger"
              : "text-warning"
          )}>
            {formatShortDate(currentCycleDueDate)}
          </span>
          {currentCycleDueDays !== null && currentCycleDueDays > 0 && (
            <span className={cn(
              "font-mono text-[10px] tabular-nums",
              currentCycleDueDays <= 5 ? "text-danger" : "text-warning"
            )}>
              ({currentCycleDueDays}d)
            </span>
          )}
        </div>
      )}

      <p className="text-[10px] text-text-muted mb-2">{dateRange}</p>
      <div className="space-y-1.5">
        {expenses !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-text-muted">Expenses</span>
            <span className="font-mono text-xs font-semibold tabular-nums text-text-primary">
              {formatAmount(expenses)}
            </span>
          </div>
        )}
        {emiTotal > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-sand-400 flex items-center gap-1">
              <Layers size={9} /> EMIs
            </span>
            <span className="font-mono text-xs font-semibold tabular-nums text-sand-400">
              {formatAmount(emiTotal)}
            </span>
          </div>
        )}
        {isNext && emiTotal === 0 && (
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-text-muted">EMIs</span>
            <span className="font-mono text-xs tabular-nums text-text-muted">None</span>
          </div>
        )}
        {total !== undefined && (
          <div className="border-t border-border/20 pt-1.5 flex items-center justify-between">
            <span className="text-[11px] font-medium text-text-secondary">Total</span>
            <span className={cn(
              "font-mono text-sm font-bold tabular-nums",
              isPrev ? "text-text-secondary" : "text-text-primary"
            )}>
              {formatAmount(total)}
            </span>
          </div>
        )}
        {isNext && (
          <div className="border-t border-border/20 pt-1.5 flex items-center justify-between">
            <span className="text-[11px] font-medium text-text-secondary">Confirmed</span>
            <span className="font-mono text-sm font-bold tabular-nums text-seafoam-400">
              {formatAmount(emiTotal)}
            </span>
          </div>
        )}
      </div>
      {/* Payment due date — for Previous & Current cards */}
      {!isNext && (
        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/15">
          {isPaid ? (
            <>
              <Check size={10} className="text-success shrink-0" />
              <span className="text-[10px] text-success font-medium">Paid</span>
              <span className="text-[10px] font-mono tabular-nums text-success/60">
                {formatShortDate(paymentDueDate)}
              </span>
            </>
          ) : (
            <>
              <Clock size={10} className="text-text-muted shrink-0" />
              <span className="text-[10px] text-text-muted">Due:</span>
              <span className={cn(
                "text-[10px] font-mono tabular-nums font-medium",
                isPrev ? "text-text-muted" : "text-text-secondary"
              )}>
                {formatShortDate(paymentDueDate)}
              </span>
              {!isPrev && (() => {
                const now = new Date();
                const due = new Date(paymentDueDate + "T00:00:00");
                const days = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                if (days > 0) {
                  return (
                    <span className={cn(
                      "text-[10px] font-mono tabular-nums",
                      days <= 5 ? "text-danger" : days <= 14 ? "text-warning" : "text-text-muted"
                    )}>
                      ({days}d)
                    </span>
                  );
                }
                return null;
              })()}
            </>
          )}
        </div>
      )}
      {/* Next cycle's own due date — shown smaller, below the current cycle due alert */}
      {isNext && (
        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/15">
          <Clock size={10} className="text-text-muted/50 shrink-0" />
          <span className="text-[10px] text-text-muted/60">Next due:</span>
          <span className="text-[10px] font-mono tabular-nums text-text-muted/60">
            {formatShortDate(paymentDueDate)}
          </span>
        </div>
      )}
      {variant === "current" && creditLimit && creditLimit > 0 && total !== undefined && (
        <div className="mt-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-text-muted">Utilization</span>
            <span className={cn(
              "font-mono text-[10px] font-medium tabular-nums",
              (total / creditLimit) * 100 >= 100 ? "text-danger" :
                (total / creditLimit) * 100 >= 75 ? "text-warning" : "text-success"
            )}>{((total / creditLimit) * 100).toFixed(1)}%</span>
          </div>
          <ProgressBar value={total} max={creditLimit} size="sm" />
        </div>
      )}
    </div>
  );
}

/* ── Timeline Graph with Date Axis ──────────────────── */
function TimelineGraph({
  events,
  cycleStart,
  cycleEnd,
  cardColor,
}: {
  events: CycleTimelineEvent[];
  cycleStart: string;
  cycleEnd: string;
  cardColor: string;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const expenses = events.filter((e) => e.type === "expense");
  const emiEvents = events.filter((e) => e.type === "emi");
  const allAmounts = events.map((e) => e.amount);
  const maxAmount = allAmounts.length > 0 ? Math.max(...allAmounts) : 1;
  const markers = generateDateMarkers(cycleStart, cycleEnd);
  const neon = getNeonColor(cardColor, 0.25);
  const neonBright = getNeonColor(cardColor, 0.45);

  // Position an event on the x-axis based on its date
  function getXPosition(dateStr: string): number {
    const s = new Date(cycleStart + "T00:00:00").getTime();
    const e = new Date(cycleEnd + "T00:00:00").getTime();
    const d = new Date(dateStr + "T00:00:00").getTime();
    if (e === s) return 0.5;
    return Math.max(0, Math.min(1, (d - s) / (e - s)));
  }

  if (expenses.length === 0 && emiEvents.length === 0) {
    return (
      <p className="text-xs text-text-muted text-center py-6">
        No charges in this cycle
      </p>
    );
  }

  return (
    <div className="pt-4 space-y-4">
      {/* Expenses timeline */}
      {expenses.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-text-muted mb-3 uppercase tracking-wider">
            Expenses ({expenses.length})
          </p>
          {/* Graph area */}
          <div className="relative" style={{ height: 80, marginBottom: 28 }}>
            {/* Dotted date gridlines */}
            {markers.map((m, i) => (
              <div
                key={`grid-${i}`}
                className="absolute top-0 bottom-0"
                style={{ left: `${m.position * 100}%` }}
              >
                <div
                  className="h-full border-l border-dashed"
                  style={{ borderColor: "rgba(42, 49, 69, 0.6)" }}
                />
              </div>
            ))}

            {/* Baseline */}
            <div
              className="absolute bottom-0 left-0 right-0 h-px"
              style={{ backgroundColor: "rgba(42, 49, 69, 0.8)" }}
            />

            {/* Orbs positioned on date axis */}
            {expenses.map((event, i) => {
              const x = getXPosition(event.date);
              const size = getOrbSize(event.amount, maxAmount);
              const isHovered = hoveredIdx === i;
              return (
                <div
                  key={`orb-${i}`}
                  className="absolute"
                  style={{
                    left: `${x * 100}%`,
                    bottom: 0,
                    transform: "translateX(-50%)",
                  }}
                >
                  {/* Orb */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.025, type: "spring", stiffness: 300, damping: 20 }}
                    className="cursor-default relative"
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    <div
                      className="rounded-full transition-all duration-200"
                      style={{
                        width: size,
                        height: size,
                        background: `radial-gradient(circle at 35% 35%, ${neonBright}ee, ${neon}88, ${cardColor}55)`,
                        boxShadow: isHovered
                          ? `0 0 16px ${neon}80, 0 0 4px ${neon}40`
                          : `0 2px 6px ${cardColor}25, 0 0 8px ${neon}15`,
                        transform: isHovered ? "scale(1.15)" : "scale(1)",
                      }}
                    />
                    {/* Tooltip — positioned above, uses fixed strategy to avoid clipping */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.12 }}
                          className="absolute z-50 pointer-events-none"
                          style={{
                            bottom: size + 8,
                            left: "50%",
                            transform: "translateX(-50%)",
                          }}
                        >
                          <div className="rounded-[8px] border border-border-hover bg-surface-3 px-3 py-2 shadow-xl whitespace-nowrap backdrop-blur-sm">
                            <p className="text-[11px] font-semibold text-text-primary">{event.description}</p>
                            <p className="font-mono text-[11px] tabular-nums text-sage-300 mt-0.5">
                              {formatAmount(event.amount)}
                            </p>
                            <p className="text-[10px] text-text-muted mt-0.5">
                              {formatShortDate(event.date)}
                              {event.categoryName && (
                                <span className="text-text-muted/60"> · {event.categoryName}</span>
                              )}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              );
            })}
          </div>

          {/* Date axis labels */}
          <div className="relative h-4">
            {markers.map((m, i) => (
              <span
                key={`label-${i}`}
                className="absolute text-[9px] text-text-muted/70 font-mono tabular-nums"
                style={{
                  left: `${m.position * 100}%`,
                  transform: "translateX(-50%)",
                }}
              >
                {m.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* EMI section separator */}
      {expenses.length > 0 && emiEvents.length > 0 && (
        <div className="flex items-center gap-3 pt-1">
          <div className="flex-1 h-px bg-border/40" />
          <span className="text-[10px] text-sand-400/60 uppercase tracking-wider font-medium">EMIs</span>
          <div className="flex-1 h-px bg-border/40" />
        </div>
      )}

      {/* EMI orbs (simple row, not date-positioned since they're monthly) */}
      {emiEvents.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          {emiEvents.map((event, i) => {
            const size = getOrbSize(event.amount, maxAmount);
            return (
              <div key={`emi-${i}`} className="group relative flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: (expenses.length + i) * 0.03 }}
                >
                  <div
                    className="rounded-[8px] transition-all duration-200 border-2 border-dashed hover:scale-110 cursor-default"
                    style={{
                      width: size,
                      height: size,
                      background: "linear-gradient(135deg, rgba(196,170,120,0.2), rgba(196,170,120,0.08))",
                      borderColor: "rgba(196,170,120,0.35)",
                    }}
                  />
                </motion.div>
                {/* Tooltip */}
                <div className="pointer-events-none absolute z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  style={{ bottom: size + 8, left: "50%", transform: "translateX(-50%)" }}
                >
                  <div className="rounded-[8px] border border-border-hover bg-surface-3 px-3 py-2 shadow-xl whitespace-nowrap backdrop-blur-sm">
                    <p className="text-[11px] font-semibold text-sand-300">{event.description}</p>
                    <p className="font-mono text-[11px] tabular-nums text-sand-400">{formatAmount(event.amount)}/mo</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Card Component ─────────────────────────────────── */
function CycleTimelineCard({ card }: { card: CycleForecast }) {
  const [expanded, setExpanded] = useState(false);
  const colors = useThemeColors();
  const color = card.cardColor;

  const expenses = card.currentCycle.events.filter((e) => e.type === "expense");
  const emiEvents = card.currentCycle.events.filter((e) => e.type === "emi");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-card border border-border bg-surface-1 overflow-hidden"
    >
      {/* Card color bar */}
      <div className="h-1 w-full" style={{ backgroundColor: color }} />

      <div className="p-5 max-md:p-4">
        {/* Card header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-[10px]"
              style={{ backgroundColor: `${color}18` }}
            >
              <CreditCard size={20} style={{ color }} />
            </div>
            <div>
              <h4 className="text-base font-semibold text-text-primary">{card.cardName}</h4>
              <p className="text-xs text-text-muted">{card.bank}</p>
            </div>
          </div>
          {card.lastFour && (
            <span className="font-mono text-xs text-text-muted tabular-nums">····{card.lastFour}</span>
          )}
        </div>

        {/* ── Three-column cycle comparison ──────────────── */}
        <div className="flex gap-3 mb-5 max-md:flex-col">
          <CycleSummaryBox
            label="Previous Cycle"
            icon={Clock}
            iconColor={colors.textSecondary}
            dateRange={`${formatShortDate(card.previousCycle.start)} — ${formatShortDate(card.previousCycle.end)}`}
            expenses={card.previousCycle.expenses}
            emiTotal={card.previousCycle.emiTotal}
            total={card.previousCycle.total}
            variant="previous"
            creditLimit={card.creditLimit}
            paymentDueDate={card.previousCycle.paymentDueDate}
            isPaid={card.previousCycle.isPaid}
          />
          <div className="hidden md:flex items-center text-text-muted/30">
            <ArrowRight size={14} />
          </div>
          <CycleSummaryBox
            label="Current Cycle"
            icon={Calendar}
            iconColor={colors.sage400}
            dateRange={`${formatShortDate(card.currentCycle.start)} — ${formatShortDate(card.currentCycle.end)}`}
            expenses={card.currentCycle.expenses}
            emiTotal={card.currentCycle.emiTotal}
            total={card.currentCycle.total}
            variant="current"
            creditLimit={card.creditLimit}
            paymentDueDate={card.currentCycle.paymentDueDate}
            isPaid={card.currentCycle.isPaid}
          />
          <div className="hidden md:flex items-center text-text-muted/30">
            <ArrowRight size={14} />
          </div>
          <CycleSummaryBox
            label="Next Cycle"
            icon={Layers}
            iconColor={colors.seafoam400}
            dateRange={`${formatShortDate(card.nextCycle.start)} — ${formatShortDate(card.nextCycle.end)}`}
            emiTotal={card.nextCycle.emiTotal}
            variant="next"
            creditLimit={card.creditLimit}
            paymentDueDate={card.nextCycle.paymentDueDate}
            currentCycleDueDate={card.currentCycle.paymentDueDate}
          />
        </div>

        {/* ── Expandable Timeline ───────────────────────── */}
        <button
          onClick={() => setExpanded((p) => !p)}
          className="flex items-center gap-2 w-full rounded-input bg-surface-2/30 border border-border/40 px-3 py-2.5 hover:bg-surface-2/60 transition-all duration-150"
        >
          <span className="text-xs font-medium text-text-secondary flex-1 text-left">
            Cycle Timeline — {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
            {emiEvents.length > 0 ? ` + ${emiEvents.length} EMI${emiEvents.length !== 1 ? "s" : ""}` : ""}
          </span>
          {expanded ? (
            <ChevronUp size={14} className="text-text-muted" />
          ) : (
            <ChevronDown size={14} className="text-text-muted" />
          )}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-visible"
            >
              <TimelineGraph
                events={card.currentCycle.events}
                cycleStart={card.currentCycle.start}
                cycleEnd={card.currentCycle.end}
                cardColor={color}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ── Main Export ─────────────────────────────────────── */
function CycleTimeline({ data }: CycleTimelineProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-card border border-border bg-surface-1 p-6 text-center">
        <p className="text-sm text-text-muted">No active cards to show cycle data</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((card) => (
        <CycleTimelineCard key={card.cardId} card={card} />
      ))}
    </div>
  );
}

export { CycleTimeline };
