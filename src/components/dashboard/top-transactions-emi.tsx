"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowUpRight, Layers, TrendingDown, Clock, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatAmount } from "@/lib/utils";

interface TopTransaction {
  id: number;
  amount: number;
  description: string;
  merchant: string | null;
  transactionDate: string;
  categoryName: string | null;
  cardName: string | null;
  cardColor: string | null;
}

interface EmiData {
  id: number;
  description: string;
  monthlyAmount: number;
  totalMonths: number;
  monthsRemaining: number;
  monthsPaid: number;
  progress: number;
  cardName: string;
  cardColor: string | null;
  cardLastFour: string | null;
  isActive: number;
}

interface TopTransactionsEmiProps {
  initialMonth: number;
  initialYear: number;
}

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function TopTransactionsEmi({ initialMonth, initialYear }: TopTransactionsEmiProps) {
  const [period, setPeriod] = useState({ month: initialMonth, year: initialYear });
  const selectedMonth = period.month;
  const selectedYear = period.year;
  const [isAllTime, setIsAllTime] = useState(false);
  const [topTransactions, setTopTransactions] = useState<TopTransaction[]>([]);
  const [txnLoading, setTxnLoading] = useState(true);
  const userOverrode = useRef(false);

  const [emiData, setEmiData] = useState<EmiData[]>([]);
  const [showAllTxns, setShowAllTxns] = useState(false);

  // Sync with parent month when user hasn't manually overridden
  useEffect(() => {
    if (!userOverrode.current) {
      setPeriod({ month: initialMonth, year: initialYear });
    }
  }, [initialMonth, initialYear]);

  // Fetch top transactions
  const fetchTopTxns = useCallback(async () => {
    setTxnLoading(true);
    try {
      const url = isAllTime
        ? "/api/transactions/top?all=true"
        : `/api/transactions/top?year=${selectedYear}&month=${selectedMonth}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setTopTransactions(json.data);
      }
    } catch { /* non-critical */ }
    finally {
      setTxnLoading(false);
    }
  }, [selectedMonth, selectedYear, isAllTime]);

  useEffect(() => {
    fetchTopTxns();
  }, [fetchTopTxns]);

  // Load EMIs
  useEffect(() => {
    async function loadEmis() {
      try {
        const res = await fetch("/api/emis");
        const json = await res.json();
        if (json.success) {
          setEmiData(json.data);
        }
      } catch { /* non-critical */ }
    }
    loadEmis();
  }, []);

  function handlePrevMonth() {
    userOverrode.current = true;
    setIsAllTime(false);
    setPeriod((p) => p.month === 1
      ? { year: p.year - 1, month: 12 }
      : { year: p.year, month: p.month - 1 }
    );
  }

  function handleNextMonth() {
    const now = new Date();
    const isCurrentMonth =
      selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1;
    if (isCurrentMonth) return;

    userOverrode.current = true;
    setIsAllTime(false);
    setPeriod((p) => p.month === 12
      ? { year: p.year + 1, month: 1 }
      : { year: p.year, month: p.month + 1 }
    );
  }

  function handleToggleAll() {
    userOverrode.current = true;
    setIsAllTime((prev) => !prev);
  }

  const now = new Date();
  const isCurrentMonth =
    selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1;

  const totalEmiBurden = emiData.reduce((sum, e) => sum + e.monthlyAmount, 0);
  const activeCount = emiData.length;
  const totalPaid = emiData.reduce((sum, e) => sum + e.monthsPaid, 0);
  const totalRemaining = emiData.reduce((sum, e) => sum + e.monthsRemaining, 0);

  let nextCompleting: EmiData | null = null;
  let minRemaining = Infinity;
  for (const e of emiData) {
    if (e.monthsRemaining < minRemaining && e.monthsRemaining > 0) {
      minRemaining = e.monthsRemaining;
      nextCompleting = e;
    }
  }

  const visibleTxns = showAllTxns ? topTransactions : topTransactions.slice(0, 5);

  function fmtDate(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.3 }}
      className="rounded-card border border-border bg-surface-1 overflow-hidden"
    >
      {/* Top Transactions Section */}
      <div className="p-6 max-md:p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ArrowUpRight size={16} className="text-sand-400" />
            <h3 className="text-sm font-semibold text-text-primary">Top Transactions</h3>
          </div>

          {/* Month picker */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevMonth}
              disabled={isAllTime}
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded transition-all duration-150",
                isAllTime
                  ? "text-text-muted/20 cursor-not-allowed"
                  : "text-text-muted hover:text-text-primary hover:bg-surface-3"
              )}
              aria-label="Previous month"
            >
              <ChevronLeft size={12} />
            </button>

            <span className={cn(
              "text-[11px] font-medium tabular-nums min-w-[70px] text-center",
              isAllTime ? "text-text-muted/40" : "text-text-secondary"
            )}>
              {SHORT_MONTHS[selectedMonth - 1]} {selectedYear}
            </span>

            <button
              onClick={handleNextMonth}
              disabled={isAllTime || isCurrentMonth}
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded transition-all duration-150",
                (isAllTime || isCurrentMonth)
                  ? "text-text-muted/20 cursor-not-allowed"
                  : "text-text-muted hover:text-text-primary hover:bg-surface-3"
              )}
              aria-label="Next month"
            >
              <ChevronRight size={12} />
            </button>

            <button
              onClick={handleToggleAll}
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium transition-all duration-150 ml-1",
                isAllTime
                  ? "bg-sage-400/15 text-sage-300"
                  : "bg-surface-3/50 text-text-muted hover:text-text-secondary hover:bg-surface-3"
              )}
            >
              All
            </button>
          </div>
        </div>

        {/* Subtitle when in All mode */}
        {isAllTime && (
          <p className="text-[10px] text-text-muted mb-2 -mt-1">Across all months</p>
        )}

        {txnLoading ? (
          <div className="flex justify-center py-6">
            <div className="h-4 w-4 rounded-full border-2 border-border-hover border-t-sage-400 animate-spin" />
          </div>
        ) : topTransactions.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-4">No transactions{!isAllTime ? " this month" : ""}</p>
        ) : (
          <>
            <div className="flex flex-col">
              <AnimatePresence initial={false}>
                {visibleTxns.map((txn, i) => (
                  <motion.div
                    key={txn.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      "flex items-center gap-3 py-2",
                      i < visibleTxns.length - 1 && "border-b border-border/30"
                    )}
                  >
                    {/* Rank number */}
                    <span className="font-mono text-[10px] text-text-muted tabular-nums w-4 text-right shrink-0">
                      {i + 1}
                    </span>

                    {/* Card color dot */}
                    {txn.cardColor && (
                      <div
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: txn.cardColor }}
                      />
                    )}

                    {/* Description + meta */}
                    <div className="min-w-0 flex-1">
                      <span className="text-xs text-text-secondary font-medium truncate block">
                        {txn.merchant || txn.description}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-text-muted">
                          {fmtDate(txn.transactionDate)}
                        </span>
                        {txn.categoryName && (
                          <>
                            <span className="text-text-muted/30 text-[8px]">&#x25CF;</span>
                            <span className="text-[10px] text-text-muted truncate max-w-[100px]">
                              {txn.categoryName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <span className="font-mono text-xs font-semibold tabular-nums text-text-primary shrink-0">
                      {formatAmount(txn.amount)}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Show more/less toggle */}
            {topTransactions.length > 5 && (
              <button
                onClick={() => setShowAllTxns(!showAllTxns)}
                className="flex items-center gap-1 mt-2 mx-auto text-[10px] font-medium text-text-muted hover:text-text-secondary transition-colors"
              >
                {showAllTxns ? (
                  <>
                    Show less <ChevronUp size={10} />
                  </>
                ) : (
                  <>
                    Show all {topTransactions.length} <ChevronDown size={10} />
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>

      {/* Divider */}
      {emiData.length > 0 && (
        <div className="border-t border-border/50" />
      )}

      {/* EMI Status Section */}
      {emiData.length > 0 && (
        <div className="p-6 max-md:p-4">
          <div className="flex items-center gap-2 mb-3">
            <Layers size={16} className="text-sand-400" />
            <h3 className="text-sm font-semibold text-text-primary">EMI Status</h3>
          </div>

          {/* EMI Overview Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-input bg-surface-2/60 border border-border/30 px-3 py-2">
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Monthly Burden</p>
              <p className="font-mono text-sm font-bold tabular-nums text-sand-400 mt-0.5">
                {formatAmount(totalEmiBurden)}
              </p>
            </div>
            <div className="rounded-input bg-surface-2/60 border border-border/30 px-3 py-2">
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Active EMIs</p>
              <p className="text-sm font-bold text-text-primary mt-0.5">
                {activeCount}
              </p>
            </div>
            <div className="rounded-input bg-surface-2/60 border border-border/30 px-3 py-2">
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Installments</p>
              <p className="text-sm font-bold text-text-primary mt-0.5">
                <span className="text-success">{totalPaid}</span>
                <span className="text-text-muted"> / </span>
                <span>{totalPaid + totalRemaining}</span>
              </p>
            </div>
          </div>

          {/* Individual EMI rows */}
          <div className="flex flex-col gap-2">
            {emiData.map((emi) => (
              <div
                key={emi.id}
                className="flex items-center gap-3 rounded-input bg-surface-2/30 border border-border/20 px-3 py-2"
              >
                <div
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: emi.cardColor || "#7EB89E" }}
                />
                <div className="min-w-0 flex-1">
                  <span className="text-xs text-text-secondary font-medium truncate block">
                    {emi.description}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-text-muted">
                      {emi.cardName.replace(" Card", "")}
                    </span>
                    {emi.cardLastFour && (
                      <span className="font-mono text-[9px] text-text-muted tabular-nums">
                        ··{emi.cardLastFour}
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-16 shrink-0">
                  <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${emi.progress}%`,
                        backgroundColor: emi.progress >= 75 ? "#7DD3A8" : emi.cardColor || "#7EB89E",
                      }}
                    />
                  </div>
                  <p className="text-[9px] text-text-muted mt-0.5 text-center tabular-nums">
                    {emi.monthsPaid}/{emi.totalMonths}
                  </p>
                </div>
                <span className="font-mono text-xs font-semibold tabular-nums text-sand-400 shrink-0">
                  {formatAmount(emi.monthlyAmount)}
                </span>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Clock size={10} className="text-text-muted" />
                  <span className="text-[10px] text-text-muted font-medium tabular-nums">
                    {emi.monthsRemaining}mo
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Next completing highlight */}
          {nextCompleting && (
            <div className="flex items-center gap-2 mt-3 rounded-input bg-success/5 border border-success/10 px-3 py-2">
              <TrendingDown size={12} className="text-success shrink-0" />
              <span className="text-[11px] text-text-secondary">
                <span className="font-medium text-success">{nextCompleting.description}</span>
                {" "}completes in{" "}
                <span className="font-mono font-medium text-success tabular-nums">
                  {nextCompleting.monthsRemaining}
                </span>
                {" "}month{nextCompleting.monthsRemaining !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export { TopTransactionsEmi, type TopTransactionsEmiProps };
