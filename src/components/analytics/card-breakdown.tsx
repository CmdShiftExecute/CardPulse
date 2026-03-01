"use client";

import { useState, useId } from "react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { formatAmount, cn } from "@/lib/utils";
import { niceYDomain, formatYAxis } from "@/lib/chart-utils";
import { ChartTooltip } from "./chart-tooltip";
import { motion } from "framer-motion";

interface CardMonthlySpend {
  cardId: number;
  cardName: string;
  color: string;
  months: { year: number; month: number; label: string; total: number }[];
}

interface CardBreakdownProps {
  data: CardMonthlySpend[];
}

interface CardBarTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CardBarTooltip({ active, payload, label }: CardBarTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const total = payload.reduce((s, p) => s + p.value, 0);

  return (
    <div className="rounded-input border border-border-hover bg-surface-3 px-3 py-2.5 shadow-lg min-w-[150px] z-50">
      <p className="text-xs font-medium text-text-primary mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-[10px] text-text-secondary truncate max-w-[100px]">
              {entry.name}
            </span>
          </div>
          <span className="font-mono text-[10px] font-medium tabular-nums text-text-primary">
            {formatAmount(entry.value)}
          </span>
        </div>
      ))}
      {payload.length > 1 && (
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

function CardBreakdown({ data }: CardBreakdownProps) {
  const colors = useThemeColors();
  const [selectedCard, setSelectedCard] = useState<string>("all");
  const gradientId = useId().replace(/:/g, "_");

  if (data.length === 0) {
    return (
      <div className="rounded-card border border-border bg-surface-1 p-6 text-center">
        <p className="text-sm text-text-muted">No card spending data available</p>
      </div>
    );
  }

  const selectedCardData = data.find((c) => String(c.cardId) === selectedCard);

  // Bar chart data (all cards)
  const months = data[0]?.months || [];
  const barData = months.map((m) => {
    const point: Record<string, string | number> = { label: m.label };
    for (const card of data) {
      const monthData = card.months.find(
        (cm) => cm.year === m.year && cm.month === m.month
      );
      point[card.cardName] = monthData?.total || 0;
    }
    return point;
  });

  // Area chart data (single card)
  const areaData = selectedCardData?.months.map((m) => ({
    label: m.label,
    total: m.total,
  })) || [];

  // Compute max for dynamic Y domain
  const maxBarVal = Math.max(
    ...data.flatMap((c) => c.months.map((m) => m.total)),
    1
  );
  const barDomain = niceYDomain(maxBarVal);

  const maxAreaVal = selectedCardData
    ? Math.max(...selectedCardData.months.map((m) => m.total), 1)
    : 0;
  const areaDomain = niceYDomain(maxAreaVal);

  const cardColor = selectedCardData?.color || colors.sage400;

  return (
    <div className="rounded-card border border-border bg-surface-1 p-5 max-md:p-4">
      <div className="flex items-start justify-between gap-3 mb-5">
        <h3 className="text-base font-semibold text-text-primary">Card-wise Spending</h3>
      </div>

      {/* Card selector pills */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <button
          onClick={() => setSelectedCard("all")}
          className={cn(
            "flex items-center gap-1.5 rounded-button px-3 py-1.5 text-xs font-medium transition-all duration-150 border",
            selectedCard === "all"
              ? "bg-sage-400/15 text-sage-300 border-sage-400/30"
              : "bg-transparent text-text-muted border-border hover:border-border-hover hover:text-text-secondary"
          )}
        >
          All Cards
        </button>
        {data.map((card) => {
          const isActive = String(card.cardId) === selectedCard;
          const totalSpend = card.months.reduce((s, m) => s + m.total, 0);
          return (
            <button
              key={card.cardId}
              onClick={() => setSelectedCard(String(card.cardId))}
              className={cn(
                "flex items-center gap-2 rounded-button px-3 py-1.5 text-xs font-medium transition-all duration-150 border",
                isActive
                  ? "border-opacity-30 text-text-primary"
                  : "bg-transparent text-text-muted border-border hover:border-border-hover hover:text-text-secondary"
              )}
              style={isActive ? { backgroundColor: `${card.color}20`, borderColor: `${card.color}50` } : {}}
            >
              <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: card.color }} />
              <span className="truncate max-w-[120px]">{card.cardName.replace(" Card", "")}</span>
              <span className="font-mono text-[10px] tabular-nums text-text-muted">
                {formatAmount(totalSpend)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Chart area */}
      <div className="w-full" style={{ aspectRatio: "2.5 / 1", minHeight: 220, maxHeight: 380 }}>
        {selectedCard === "all" ? (
          <motion.div key="bar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke={colors.border}
                  strokeOpacity={0.5}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: colors.textMuted, fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: colors.textMuted, fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  domain={barDomain}
                  tickFormatter={formatYAxis}
                  width={56}
                />
                <Tooltip content={<CardBarTooltip />} />
                {data.map((card) => (
                  <Bar
                    key={card.cardId}
                    dataKey={card.cardName}
                    fill={card.color}
                    radius={[4, 4, 0, 0]}
                    animationDuration={600}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        ) : (
          <motion.div key={`area-${selectedCard}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`cardGrad_${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={cardColor} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={cardColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke={colors.border}
                  strokeOpacity={0.5}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: colors.textMuted, fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: colors.textMuted, fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  domain={areaDomain}
                  tickFormatter={formatYAxis}
                  width={56}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  name={selectedCardData?.cardName || "Card"}
                  stroke={cardColor}
                  strokeWidth={2}
                  fill={`url(#cardGrad_${gradientId})`}
                  dot={false}
                  activeDot={{ r: 5, fill: cardColor, stroke: colors.surface1, strokeWidth: 2 }}
                  animationDuration={700}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export { CardBreakdown };
