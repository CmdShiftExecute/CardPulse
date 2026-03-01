"use client";

import Link from "next/link";
import { ArrowRight, ShoppingBag, Receipt } from "lucide-react";
import { formatAmount, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface RecentTransaction {
  id: number;
  amount: number;
  description: string;
  merchant: string | null;
  transactionDate: string;
  categoryName: string | null;
  subcategoryName: string | null;
  cardName: string | null;
  cardColor: string | null;
}

interface RecentTransactionsProps {
  data: RecentTransaction[];
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffTime = today.getTime() - target.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function RecentTransactions({ data }: RecentTransactionsProps) {
  return (
    <div className="rounded-card border border-border bg-surface-1 p-6 max-md:p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">
          Recent Transactions
        </h3>
        <Link
          href="/transactions"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-seafoam-400 hover:text-seafoam-300 transition-colors"
        >
          View all
          <ArrowRight size={14} />
        </Link>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-3 mb-3">
            <Receipt size={24} className="text-text-muted/40" />
          </div>
          <p className="text-sm text-text-muted">No transactions yet</p>
          <p className="text-xs text-text-muted/60 mt-1">
            Add your first expense to get started
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {data.map((tx, i) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={cn(
                "flex items-center justify-between py-3 gap-3",
                i < data.length - 1 && "border-b border-border/40"
              )}
            >
              {/* Left: icon + info */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Category color dot or card color dot */}
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-surface-2"
                >
                  {tx.cardColor ? (
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: tx.cardColor }}
                    />
                  ) : (
                    <ShoppingBag size={16} className="text-text-muted" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {tx.merchant || tx.description}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {tx.categoryName && (
                      <Badge variant="category" className="text-[10px] px-1.5 py-0">
                        {tx.categoryName}
                      </Badge>
                    )}
                    {tx.cardName && (
                      <span className="text-[10px] text-text-muted truncate">
                        {tx.cardName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: amount + date */}
              <div className="text-right shrink-0">
                <p className="font-mono text-sm font-semibold tabular-nums text-text-primary">
                  {formatAmount(tx.amount)}
                </p>
                <p className="text-[10px] text-text-muted mt-0.5">
                  {formatRelativeDate(tx.transactionDate)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export { RecentTransactions, type RecentTransactionsProps };
