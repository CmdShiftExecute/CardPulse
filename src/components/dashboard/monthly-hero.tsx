"use client";

import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn, formatAmount, getCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { CountUp } from "@/components/ui/count-up";

interface CardMonthSpend {
  cardId: number;
  cardName: string;
  lastFour: string | null;
  color: string | null;
  total: number;
  transactionCount: number;
}

interface MonthlyHeroProps {
  monthTotal: number;
  prevMonthTotal: number;
  percentChange: number;
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  cardSpend: CardMonthSpend[];
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function MonthlyHero({
  monthTotal,
  prevMonthTotal,
  percentChange,
  year,
  month,
  onPrevMonth,
  onNextMonth,
  cardSpend,
}: MonthlyHeroProps) {
  const isCurrentMonth =
    year === new Date().getFullYear() && month === new Date().getMonth() + 1;
  const isIncrease = percentChange > 0;
  const isDecrease = percentChange < 0;
  const absChange = Math.abs(percentChange);

  const totalTxnCount = cardSpend.reduce((s, c) => s + c.transactionCount, 0);
  const cardTotal = cardSpend.reduce((s, c) => s + c.total, 0);
  const cashOther = monthTotal - cardTotal;

  // Grid columns based on card count
  const gridCols =
    cardSpend.length <= 1
      ? ""
      : cardSpend.length === 2
        ? "grid grid-cols-2 max-w-[500px] mx-auto"
        : cardSpend.length === 3
          ? "grid grid-cols-3"
          : cardSpend.length === 4
            ? "grid grid-cols-2 sm:grid-cols-4"
            : "grid grid-cols-3 lg:grid-cols-5";

  return (
    <div className="relative overflow-hidden rounded-card border border-border bg-surface-1">
      {/* Subtle gradient accent at the top */}
      <div
        className="absolute inset-x-0 top-0 h-[1px]"
        style={{
          background: "linear-gradient(90deg, transparent, #7EB89E, #6BB0A8, transparent)",
        }}
      />

      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[200px] w-[400px] -translate-x-1/2 -translate-y-1/2 opacity-[0.04] blur-[80px]"
        style={{ background: "radial-gradient(ellipse, #7EB89E, transparent)" }}
      />

      <div className="relative p-6 max-md:p-4">
        {/* Month navigator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onPrevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-button text-text-muted hover:text-text-primary hover:bg-surface-3 transition-all duration-150"
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>

            <AnimatePresence mode="wait">
              <motion.div
                key={`${year}-${month}`}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-lg font-semibold text-text-primary">
                  {MONTH_NAMES[month - 1]}
                  <span className="ml-2 text-text-muted font-normal">{year}</span>
                </h2>
              </motion.div>
            </AnimatePresence>

            <button
              onClick={onNextMonth}
              disabled={isCurrentMonth}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-button transition-all duration-150",
                isCurrentMonth
                  ? "text-text-muted/30 cursor-not-allowed"
                  : "text-text-muted hover:text-text-primary hover:bg-surface-3"
              )}
              aria-label="Next month"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Percentage change badge */}
          {prevMonthTotal > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
                isIncrease && "bg-danger/[0.08] text-danger",
                isDecrease && "bg-success/10 text-success",
                !isIncrease && !isDecrease && "bg-surface-3 text-text-muted"
              )}
            >
              {isIncrease && <TrendingUp size={14} />}
              {isDecrease && <TrendingDown size={14} />}
              {!isIncrease && !isDecrease && <Minus size={14} />}
              <span>
                {isIncrease ? "+" : ""}
                {absChange.toFixed(1)}%
              </span>
              <span className="text-text-muted/70">vs last month</span>
            </motion.div>
          )}
        </div>

        {/* Per-card spend breakdown */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${year}-${month}-cards`}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {cardSpend.length === 0 ? (
              /* No transactions this month */
              <div className="flex flex-col items-center text-center py-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-medium text-text-muted">{getCurrency()}</span>
                  <span className="font-mono text-3xl font-bold tabular-nums text-text-primary tracking-tight">
                    0.00
                  </span>
                </div>
                <p className="mt-2 text-xs text-text-muted">No transactions this month</p>
              </div>
            ) : cardSpend.length === 1 ? (
              /* Single card — centered, larger */
              <div className="flex flex-col items-center text-center py-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: cardSpend[0].color || "#7EB89E" }}
                  />
                  <span className="text-xs font-medium text-text-secondary">
                    {cardSpend[0].cardName.replace(" Card", "")}
                  </span>
                  {cardSpend[0].lastFour && (
                    <span className="font-mono text-[10px] text-text-muted tabular-nums">
                      ··{cardSpend[0].lastFour}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-medium text-text-muted">{getCurrency()}</span>
                  <CountUp
                    value={cardSpend[0].total}
                    decimals={2}
                    duration={900}
                    className="font-mono text-3xl font-bold tabular-nums text-text-primary tracking-tight"
                  />
                </div>
                <p className="mt-1 text-[10px] text-text-muted">
                  {cardSpend[0].transactionCount} transaction{cardSpend[0].transactionCount !== 1 ? "s" : ""}
                </p>
              </div>
            ) : (
              /* Multiple cards — grid layout */
              <div className="py-2">
                <div className={cn("gap-4", gridCols)}>
                  {cardSpend.map((card, i) => (
                    <motion.div
                      key={card.cardId}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.08, duration: 0.3 }}
                      className="text-center py-2"
                    >
                      <div className="flex items-center justify-center gap-1.5 mb-1.5">
                        <div
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: card.color || "#7EB89E" }}
                        />
                        <span className="text-[11px] font-medium text-text-secondary truncate max-w-[120px]">
                          {card.cardName.replace(" Card", "")}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-center gap-0.5">
                        <span className="text-[10px] font-medium text-text-muted">{getCurrency()}</span>
                        <CountUp
                          value={card.total}
                          decimals={2}
                          duration={900}
                          className="font-mono text-xl font-bold tabular-nums text-text-primary tracking-tight"
                        />
                      </div>
                      <p className="text-[10px] text-text-muted mt-0.5">
                        {card.transactionCount} txn{card.transactionCount !== 1 ? "s" : ""}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* Total line */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-center gap-3 mt-3 pt-3 border-t border-border/30"
                >
                  <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium">
                    Total
                  </span>
                  <span className="font-mono text-base font-semibold tabular-nums text-text-primary">
                    {formatAmount(monthTotal)}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    {totalTxnCount} transaction{totalTxnCount !== 1 ? "s" : ""}
                    {cashOther > 0.01 && (
                      <span> · incl. {formatAmount(cashOther)} cash/other</span>
                    )}
                  </span>
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export { MonthlyHero, type MonthlyHeroProps };
