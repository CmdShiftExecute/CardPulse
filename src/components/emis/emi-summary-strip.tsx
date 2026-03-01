"use client";

import { useState, useEffect } from "react";
import { formatAmount } from "@/lib/utils";
import { Layers, TrendingDown, Clock } from "lucide-react";

interface EmiSummary {
  totalMonthlyBurden: number;
  activeCount: number;
  nextCompleting: { description: string; monthsRemaining: number; cardColor: string } | null;
  emisByCard: { cardName: string; cardColor: string; totalMonthly: number; count: number }[];
}

function EmiSummaryStrip() {
  const [data, setData] = useState<EmiSummary | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/emis");
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          const activeEmis = json.data;
          const totalMonthlyBurden = activeEmis.reduce(
            (sum: number, e: { monthlyAmount: number }) => sum + e.monthlyAmount, 0
          );
          const activeCount = activeEmis.length;

          // Find next completing EMI
          let nextCompleting = null;
          let minRemaining = Infinity;
          for (const e of activeEmis) {
            if (e.monthsRemaining < minRemaining && e.monthsRemaining > 0) {
              minRemaining = e.monthsRemaining;
              nextCompleting = {
                description: e.description,
                monthsRemaining: e.monthsRemaining,
                cardColor: e.cardColor || "#7EB89E",
              };
            }
          }

          // Group by card
          const cardMap: Record<string, { cardName: string; cardColor: string; totalMonthly: number; count: number }> = {};
          for (const e of activeEmis) {
            if (!cardMap[e.cardName]) {
              cardMap[e.cardName] = { cardName: e.cardName, cardColor: e.cardColor || "#7EB89E", totalMonthly: 0, count: 0 };
            }
            cardMap[e.cardName].totalMonthly += e.monthlyAmount;
            cardMap[e.cardName].count++;
          }

          setData({
            totalMonthlyBurden,
            activeCount,
            nextCompleting,
            emisByCard: Object.values(cardMap),
          });
        }
      } catch { /* ignore */ }
    }
    load();
  }, []);

  if (!data) return null;

  return (
    <div className="relative overflow-hidden rounded-card border border-border bg-surface-1">
      {/* Multi-color top accent — each segment represents a card's proportion */}
      <div className="flex h-1 w-full">
        {data.emisByCard.map((card, i) => {
          const width = data.totalMonthlyBurden > 0
            ? (card.totalMonthly / data.totalMonthlyBurden) * 100
            : 100 / data.emisByCard.length;
          return (
            <div
              key={i}
              className="h-full"
              style={{
                width: `${width}%`,
                backgroundColor: card.cardColor,
              }}
            />
          );
        })}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Total EMI burden */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-sand-400/10">
              <Layers size={18} className="text-sand-400" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Monthly EMI Burden</p>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-lg font-bold tabular-nums text-sand-400">
                  {formatAmount(data.totalMonthlyBurden)}
                </span>
                <span className="text-xs text-text-muted">
                  {data.activeCount} active EMI{data.activeCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Per-card orbs — visual breakdown */}
          <div className="flex items-center gap-3">
            {data.emisByCard.map((card, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div
                  className="h-3 w-3 rounded-full shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, ${card.cardColor}, ${card.cardColor}88)`,
                  }}
                  title={card.cardName}
                />
                <div className="text-xs">
                  <span className="text-text-muted">{card.count}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Next completing */}
          {data.nextCompleting && (
            <div className="flex items-center gap-2 rounded-input bg-surface-2/50 border border-border/40 px-3 py-2">
              <TrendingDown size={14} className="text-success shrink-0" />
              <div className="text-xs">
                <span className="text-text-secondary">{data.nextCompleting.description}</span>
                <span className="text-text-muted"> — </span>
                <span className="font-medium text-success flex items-center gap-1 inline-flex">
                  <Clock size={10} />
                  {data.nextCompleting.monthsRemaining} month{data.nextCompleting.monthsRemaining !== 1 ? "s" : ""} left
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { EmiSummaryStrip };
