"use client";

import { cn, formatAmount } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import { Pencil, Trash2 } from "lucide-react";

interface TransactionRowData {
  id: number;
  amount: number;
  description: string;
  merchant: string | null;
  transactionDate: string;
  categoryId: number | null;
  subcategoryId: number | null;
  cardId: number | null;
  categoryName: string | null;
  subcategoryName: string | null;
  cardName: string | null;
  cardColor: string | null;
  labels: { id: number; name: string }[];
  notes: string | null;
}

interface TransactionRowProps {
  transaction: TransactionRowData;
  selected: boolean;
  onSelect: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function TransactionRow({
  transaction,
  selected,
  onSelect,
  onEdit,
  onDelete,
}: TransactionRowProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-border px-4 py-3",
        "transition-all duration-150",
        "hover:border-border-hover hover:bg-surface-2",
        selected && "border-sage-400/30 bg-sage-400/5"
      )}
    >
      {/* Desktop layout */}
      <div className="hidden sm:flex items-center gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(transaction.id)}
          className="h-4 w-4 shrink-0 rounded border-border bg-surface-2 text-sage-400 focus:ring-sage-glow accent-sage-400"
          aria-label={`Select transaction ${transaction.id}`}
        />
        <div className="w-24 shrink-0 text-sm text-text-secondary">
          {formatDate(transaction.transactionDate)}
        </div>
        <div className="flex flex-1 flex-col gap-1 min-w-0">
          <p className="truncate text-sm font-medium text-text-primary">
            {transaction.description}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {transaction.categoryName && (
              <Badge variant="category">
                {transaction.categoryName}
                {transaction.subcategoryName &&
                  ` > ${transaction.subcategoryName}`}
              </Badge>
            )}
            {transaction.cardName && (
              <Badge variant="card">{transaction.cardName}</Badge>
            )}
            {transaction.labels
              .filter(
                (l) =>
                  l.name !== transaction.cardName &&
                  l.name !== "Credit Card Purchase"
              )
              .slice(0, 3)
              .map((label) => (
                <Chip key={label.id} className="text-[11px] px-2 py-0.5">
                  {label.name}
                </Chip>
              ))}
          </div>
        </div>
        <div className="w-28 shrink-0 text-right font-mono text-sm font-semibold tabular-nums text-text-primary">
          {formatAmount(transaction.amount)}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => onEdit(transaction.id)}
            className="rounded-button p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-3 transition-colors"
            aria-label="Edit transaction"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(transaction.id)}
            className="rounded-button p-1.5 text-text-muted hover:text-danger hover:bg-danger/[0.06] transition-colors"
            aria-label="Delete transaction"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="flex sm:hidden flex-col gap-2">
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(transaction.id)}
            className="mt-1 h-4 w-4 shrink-0 rounded border-border bg-surface-2 text-sage-400 focus:ring-sage-glow accent-sage-400"
            aria-label={`Select transaction ${transaction.id}`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium text-text-primary">
                {transaction.description}
              </p>
              <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-text-primary">
                {formatAmount(transaction.amount)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs text-text-secondary">
                {formatDate(transaction.transactionDate)}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEdit(transaction.id)}
                  className="rounded-button p-1 text-text-muted hover:text-text-primary hover:bg-surface-3 transition-colors"
                  aria-label="Edit transaction"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => onDelete(transaction.id)}
                  className="rounded-button p-1 text-text-muted hover:text-danger hover:bg-danger/[0.06] transition-colors"
                  aria-label="Delete transaction"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 pl-6">
          {transaction.categoryName && (
            <Badge variant="category">
              {transaction.categoryName}
              {transaction.subcategoryName &&
                ` > ${transaction.subcategoryName}`}
            </Badge>
          )}
          {transaction.cardName && (
            <Badge variant="card">{transaction.cardName}</Badge>
          )}
          {transaction.labels
            .filter(
              (l) =>
                l.name !== transaction.cardName &&
                l.name !== "Credit Card Purchase"
            )
            .slice(0, 3)
            .map((label) => (
              <Chip key={label.id} className="text-[11px] px-2 py-0.5">
                {label.name}
              </Chip>
            ))}
        </div>
      </div>
    </div>
  );
}

export { TransactionRow, type TransactionRowData, type TransactionRowProps };
