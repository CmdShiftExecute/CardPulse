"use client";

import { formatAmount } from "@/lib/utils";

interface ChartTooltipEntry {
  name: string;
  value: number;
  color: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  showTotal?: boolean;
}

export function ChartTooltip({ active, payload, label, showTotal }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const entries: ChartTooltipEntry[] = payload.filter((e) => e.value > 0);
  const total = entries.reduce((s, e) => s + e.value, 0);

  return (
    <div className="rounded-input border border-border-hover bg-surface-3 px-3 py-2.5 shadow-lg min-w-[140px] z-50">
      {label && (
        <p className="text-xs font-medium text-text-primary mb-1.5">{label}</p>
      )}
      {entries.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-[10px] text-text-secondary truncate max-w-[100px]">
              {entry.name === "total" ? "Total" : entry.name}
            </span>
          </div>
          <span className="font-mono text-[10px] font-medium tabular-nums text-text-primary">
            {formatAmount(entry.value)}
          </span>
        </div>
      ))}
      {showTotal && entries.length > 1 && (
        <div className="border-t border-border/30 pt-1 mt-1 flex items-center justify-between">
          <span className="text-[10px] font-medium text-text-secondary">Total</span>
          <span className="font-mono text-[10px] font-bold tabular-nums text-text-primary">
            {formatAmount(total)}
          </span>
        </div>
      )}
    </div>
  );
}
