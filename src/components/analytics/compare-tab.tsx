"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { formatAmount, getCurrency, cn } from "@/lib/utils";
import { niceYDomain, formatYAxis } from "@/lib/chart-utils";
import { InsightCardRow } from "./insight-card";
import { motion, AnimatePresence } from "framer-motion";
import { SkeletonChart, SkeletonCard } from "@/components/ui/skeleton";

/* ── Types ──────────────────────────────────── */

interface MonthSummary {
  year: number;
  month: number;
  label: string;
  total: number;
  txnCount: number;
  avgTxn: number;
}

interface SubcategoryComparisonRow {
  subcategoryId: number;
  subcategoryName: string;
  month1Total: number;
  month2Total: number;
  delta: number;
  percentChange: number;
}

interface CategoryComparisonRow {
  categoryId: number;
  categoryName: string;
  month1Total: number;
  month2Total: number;
  delta: number;
  percentChange: number;
  subcategories: SubcategoryComparisonRow[];
}

interface LabelComparisonRow {
  labelId: number;
  labelName: string;
  month1Total: number;
  month2Total: number;
  delta: number;
  percentChange: number;
}

interface CompareData {
  month1: MonthSummary;
  month2: MonthSummary;
  categoryComparison: CategoryComparisonRow[];
  labelComparison: LabelComparisonRow[];
}

/* ── Helpers ─────────────────────────────────── */

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatPct(pct: number | null | undefined): string {
  if (pct == null) return "N/A";
  if (!isFinite(pct)) return "New";
  if (pct === 0) return "0%";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

/* ── Month Picker ────────────────────────────── */

function MonthPicker({
  year,
  month,
  onChange,
  label,
}: {
  year: number;
  month: number;
  onChange: (y: number, m: number) => void;
  label: string;
}) {
  const handlePrev = () => {
    if (month === 1) onChange(year - 1, 12);
    else onChange(year, month - 1);
  };
  const handleNext = () => {
    const now = new Date();
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
    if (isCurrentMonth) return;
    if (month === 12) onChange(year + 1, 1);
    else onChange(year, month + 1);
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrev}
          className="flex h-7 w-7 items-center justify-center rounded-button text-text-muted hover:text-text-primary hover:bg-surface-3 transition-all"
          aria-label="Previous month"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-text-primary min-w-[120px] text-center">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <button
          onClick={handleNext}
          className="flex h-7 w-7 items-center justify-center rounded-button text-text-muted hover:text-text-primary hover:bg-surface-3 transition-all"
          aria-label="Next month"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

/* ── Delta Table ─────────────────────────────── */

function DeltaTable({
  rows,
  month1Label,
  month2Label,
  expandable,
}: {
  rows: (CategoryComparisonRow | LabelComparisonRow)[];
  month1Label: string;
  month2Label: string;
  expandable?: boolean;
}) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Totals
  const totalM1 = rows.reduce((s, r) => s + r.month1Total, 0);
  const totalM2 = rows.reduce((s, r) => s + r.month2Total, 0);
  const totalDelta = totalM2 - totalM1;
  const totalPct = totalM1 > 0 ? ((totalM2 - totalM1) / totalM1) * 100 : 0;

  return (
    <div className="rounded-card border border-border bg-surface-1 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_repeat(4,minmax(80px,1fr))] gap-2 px-4 py-2.5 bg-surface-2/50 border-b border-border text-[11px] font-medium text-text-muted">
        <span>Item</span>
        <span className="text-right">{month2Label}</span>
        <span className="text-right">{month1Label}</span>
        <span className="text-right">Delta ({getCurrency()})</span>
        <span className="text-right">% Change</span>
      </div>

      {/* Total row */}
      <div className="grid grid-cols-[1fr_repeat(4,minmax(80px,1fr))] gap-2 px-4 py-2.5 border-b border-border bg-surface-2/30">
        <span className="text-xs font-bold text-text-primary">Total Spending</span>
        <span className="font-mono text-xs font-semibold tabular-nums text-text-primary text-right">{formatAmount(totalM2)}</span>
        <span className="font-mono text-xs tabular-nums text-text-secondary text-right">{formatAmount(totalM1)}</span>
        <span className={cn("font-mono text-xs font-medium tabular-nums text-right", totalDelta > 0 ? "text-danger" : totalDelta < 0 ? "text-success" : "text-text-muted")}>
          {totalDelta > 0 ? "+" : ""}{formatAmount(totalDelta)}
        </span>
        <span className={cn("text-xs font-medium text-right", totalDelta > 0 ? "text-danger" : totalDelta < 0 ? "text-success" : "text-text-muted")}>
          {formatPct(totalPct)}
        </span>
      </div>

      {/* Data rows */}
      {rows.map((row) => {
        const id = "categoryId" in row ? row.categoryId : row.labelId;
        const name = "categoryName" in row ? row.categoryName : row.labelName;
        const hasSubs = expandable && "subcategories" in row && row.subcategories.length > 0;
        const isExpanded = expanded.has(id);

        return (
          <div key={id}>
            <div
              className={cn(
                "grid grid-cols-[1fr_repeat(4,minmax(80px,1fr))] gap-2 px-4 py-2 border-b border-border/50 hover:bg-surface-2/30 transition-colors",
                hasSubs && "cursor-pointer"
              )}
              onClick={() => hasSubs && toggle(id)}
            >
              <span className="text-xs font-medium text-text-primary flex items-center gap-1.5 truncate">
                {hasSubs && (
                  <ChevronRight
                    size={12}
                    className={cn("shrink-0 transition-transform", isExpanded && "rotate-90")}
                  />
                )}
                {name}
              </span>
              <span className="font-mono text-xs tabular-nums text-text-primary text-right">{formatAmount(row.month2Total)}</span>
              <span className="font-mono text-xs tabular-nums text-text-secondary text-right">{formatAmount(row.month1Total)}</span>
              <span className={cn("font-mono text-xs tabular-nums text-right", row.delta > 0 ? "text-danger" : row.delta < 0 ? "text-success" : "text-text-muted")}>
                {row.delta > 0 ? "+" : ""}{formatAmount(row.delta)}
              </span>
              <span className={cn("text-xs text-right", row.delta > 0 ? "text-danger" : row.delta < 0 ? "text-success" : "text-text-muted")}>
                {formatPct(row.percentChange)}
              </span>
            </div>

            {/* Subcategory expansion */}
            <AnimatePresence>
              {isExpanded && hasSubs && "subcategories" in row && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {row.subcategories.map((sub) => (
                    <div
                      key={sub.subcategoryId}
                      className="grid grid-cols-[1fr_repeat(4,minmax(80px,1fr))] gap-2 px-4 py-1.5 border-b border-border/30 bg-surface-2/20"
                    >
                      <span className="text-[11px] text-text-secondary pl-6 truncate">{sub.subcategoryName}</span>
                      <span className="font-mono text-[11px] tabular-nums text-text-secondary text-right">{formatAmount(sub.month2Total)}</span>
                      <span className="font-mono text-[11px] tabular-nums text-text-muted text-right">{formatAmount(sub.month1Total)}</span>
                      <span className={cn("font-mono text-[11px] tabular-nums text-right", sub.delta > 0 ? "text-danger" : sub.delta < 0 ? "text-success" : "text-text-muted")}>
                        {sub.delta > 0 ? "+" : ""}{formatAmount(sub.delta)}
                      </span>
                      <span className={cn("text-[11px] text-right", sub.delta > 0 ? "text-danger" : sub.delta < 0 ? "text-success" : "text-text-muted")}>
                        {formatPct(sub.percentChange)}
                      </span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/* ── Horizontal Change Bar Chart ─────────────── */

function HorizontalChangeChart({ data }: { data: LabelComparisonRow[] }) {
  const colors = useThemeColors();
  const filtered = data.filter((d) => d.delta !== 0);
  if (filtered.length === 0) {
    return (
      <div className="rounded-card border border-border bg-surface-1 p-6 text-center">
        <p className="text-sm text-text-muted">No label changes between these months</p>
      </div>
    );
  }

  const maxAbsDelta = Math.max(...filtered.map((d) => Math.abs(d.delta)));

  return (
    <div className="rounded-card border border-border bg-surface-1 p-5 max-md:p-4">
      <h4 className="text-base font-semibold text-text-primary mb-1">Label Spending Change</h4>
      <p className="text-xs text-text-muted mb-4">
        Absolute change in spending for each label between the two selected months.
      </p>

      <div className="flex flex-col gap-1.5">
        {filtered.map((item, i) => {
          const pct = maxAbsDelta > 0 ? (Math.abs(item.delta) / maxAbsDelta) * 100 : 0;
          const isIncrease = item.delta > 0;
          const barColor = isIncrease ? colors.danger : colors.success;

          return (
            <motion.div
              key={item.labelId}
              initial={{ opacity: 0, x: isIncrease ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03, duration: 0.3 }}
              className="flex items-center gap-3"
            >
              <span className="text-xs text-text-secondary w-[120px] shrink-0 text-right truncate">
                {item.labelName}
              </span>
              <div className="flex-1 h-5 relative">
                <motion.div
                  className="h-full rounded"
                  style={{ backgroundColor: barColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(pct, 2)}%` }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.03 }}
                />
              </div>
              <span className={cn(
                "font-mono text-[11px] tabular-nums w-[80px] shrink-0",
                isIncrease ? "text-danger" : "text-success"
              )}>
                {isIncrease ? "+" : ""}{formatAmount(item.delta)}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Category Bar Chart Tooltip ──────────────── */

function CompareBarTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; dataKey: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-input border border-border-hover bg-surface-3 px-3 py-2.5 shadow-lg min-w-[150px] z-50">
      <p className="text-xs font-medium text-text-primary mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-[10px] text-text-secondary">{entry.name}</span>
          </div>
          <span className="font-mono text-[10px] font-medium tabular-nums text-text-primary">
            {formatAmount(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Main Component ──────────────────────────── */

export function CompareTab() {
  const colors = useThemeColors();
  const now = new Date();
  // Default: compare previous month vs current month
  let defaultM1 = now.getMonth(); // prev month (0-indexed → use as 1-indexed for display)
  let defaultY1 = now.getFullYear();
  if (defaultM1 === 0) { defaultM1 = 12; defaultY1--; }

  const [y1, setY1] = useState(defaultY1);
  const [m1, setM1] = useState(defaultM1);
  const [y2, setY2] = useState(now.getFullYear());
  const [m2, setM2] = useState(now.getMonth() + 1);

  const [data, setData] = useState<CompareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics/compare?year1=${y1}&month1=${m1}&year2=${y2}&month2=${m2}`);
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.error || "Failed to load comparison");
    } catch {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }, [y1, m1, y2, m2]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) {
    return (
      <div className="flex flex-col gap-6">
        <SkeletonCard />
        <SkeletonChart />
        <SkeletonCard />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-danger">{error}</p>
        <button onClick={fetchData} className="mt-3 text-sm text-seafoam-400 hover:text-seafoam-300 transition-colors">
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  /* ── Prepare bar chart data ──────────────────── */
  const barData = data.categoryComparison.map((cat) => ({
    name: cat.categoryName.length > 14 ? cat.categoryName.slice(0, 12) + "..." : cat.categoryName,
    fullName: cat.categoryName,
    [data.month1.label]: cat.month1Total,
    [data.month2.label]: cat.month2Total,
  }));

  const maxBarVal = Math.max(
    ...data.categoryComparison.flatMap((c) => [c.month1Total, c.month2Total])
  );
  const barDomain = niceYDomain(maxBarVal);

  const totalDelta = data.month2.total - data.month1.total;
  const txnDelta = data.month2.txnCount - data.month1.txnCount;

  return (
    <div className="flex flex-col gap-6">
      {/* Month pickers */}
      <div className="flex items-center justify-center gap-8 flex-wrap">
        <MonthPicker
          year={y1}
          month={m1}
          onChange={(y, m) => { setY1(y); setM1(m); }}
          label="Previous"
        />
        <span className="text-text-muted text-sm font-medium">vs</span>
        <MonthPicker
          year={y2}
          month={m2}
          onChange={(y, m) => { setY2(y); setM2(m); }}
          label="Current"
        />
      </div>

      {/* Insight cards */}
      <InsightCardRow
        cards={[
          {
            title: "Spending Change",
            value: `${totalDelta > 0 ? "+" : ""}${formatAmount(totalDelta)}`,
            subtitle: `${formatPct(data.month1.total > 0 ? (totalDelta / data.month1.total) * 100 : 0)} vs ${data.month1.label}`,
            icon: totalDelta > 0 ? ArrowUpRight : totalDelta < 0 ? ArrowDownRight : Minus,
            valueColor: totalDelta > 0 ? colors.danger : totalDelta < 0 ? colors.success : undefined,
          },
          {
            title: "Transaction Count",
            value: `${txnDelta > 0 ? "+" : ""}${txnDelta} txns`,
            subtitle: `${data.month2.txnCount} vs ${data.month1.txnCount} transactions`,
            icon: totalDelta > 0 ? ArrowUpRight : ArrowDownRight,
          },
          {
            title: "Average per Transaction",
            value: formatAmount(data.month2.avgTxn),
            subtitle: `vs ${formatAmount(data.month1.avgTxn)} in ${data.month1.label}`,
            icon: ArrowUpRight,
          },
        ]}
      />

      {/* Category Comparison Bar Chart */}
      <div className="rounded-card border border-border bg-surface-1 p-5 max-md:p-4">
        <h4 className="text-base font-semibold text-text-primary mb-1">Category Comparison</h4>
        <p className="text-xs text-text-muted mb-4">
          Comparing {data.month2.label} with {data.month1.label}
        </p>

        <div className="w-full" style={{ aspectRatio: "2.5 / 1", minHeight: 220, maxHeight: 380 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke={colors.border} strokeOpacity={0.5} vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: colors.textMuted, fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={50}
              />
              <YAxis
                tick={{ fill: colors.textMuted, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                domain={barDomain}
                tickFormatter={formatYAxis}
                width={56}
              />
              <Tooltip content={<CompareBarTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                formatter={(value: string) => <span className="text-text-secondary">{value}</span>}
              />
              <Bar
                dataKey={data.month1.label}
                fill={colors.sage400}
                radius={[4, 4, 0, 0]}
                animationDuration={600}
              />
              <Bar
                dataKey={data.month2.label}
                fill={colors.chartColors[3]}
                radius={[4, 4, 0, 0]}
                animationDuration={600}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Delta Table */}
      <DeltaTable
        rows={data.categoryComparison}
        month1Label={data.month1.label}
        month2Label={data.month2.label}
        expandable
      />

      {/* Label Spending Change */}
      <HorizontalChangeChart data={data.labelComparison} />

      {/* Label Delta Table */}
      <DeltaTable
        rows={data.labelComparison}
        month1Label={data.month1.label}
        month2Label={data.month2.label}
      />
    </div>
  );
}
