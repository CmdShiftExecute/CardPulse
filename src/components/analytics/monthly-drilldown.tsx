"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { formatAmount, cn } from "@/lib/utils";
import { ChevronRight, ChevronLeft, Layers, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Types ──────────────────────────────────── */

interface SubcategoryRow {
  subcategoryId: number;
  subcategoryName: string;
  total: number;
}

interface CategoryDrilldown {
  categoryId: number;
  categoryName: string;
  total: number;
  percent: number;
  subcategories: SubcategoryRow[];
}

interface LabelDrilldown {
  labelId: number;
  labelName: string;
  total: number;
  percent: number;
  transactionCount: number;
}

interface CategoryLabelLink {
  categoryId: number;
  categoryName: string;
  labelId: number;
  labelName: string;
  total: number;
}

interface MonthlyDrilldownProps {
  data: CategoryDrilldown[];
  labelData?: LabelDrilldown[];
  categoryLabelLinks?: CategoryLabelLink[];
  monthTotal: number;
  monthLabel: string;
}

/* ── Shared types ───────────────────────────── */

interface DonutEntry {
  name: string;
  value: number;
  color: string;
  percent: number;
  id: number;
}

interface CatDonutEntry extends DonutEntry {
  subs: SubcategoryRow[];
}

interface LabelDonutEntry extends DonutEntry {
  count: number;
}

/* ── Tooltip ────────────────────────────────── */

interface SharedTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DonutEntry & { count?: number } }>;
}

function SharedTooltip({ active, payload }: SharedTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0].payload;
  return (
    <div className="rounded-input border border-border-hover bg-surface-3 px-3 py-2 shadow-lg z-50">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
        <span className="text-sm font-medium text-text-primary">{entry.name}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-sm font-semibold tabular-nums text-text-primary">
          {formatAmount(entry.value)}
        </span>
        <span className="text-xs text-text-muted">{entry.percent.toFixed(1)}%</span>
      </div>
      {entry.count !== undefined && (
        <p className="text-[11px] text-text-muted mt-0.5">
          {entry.count} txn{entry.count !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

/* ── Horizontal bar (proportional fill) ─────── */

function HBar({ percent, color }: { percent: number; color: string }) {
  return (
    <div className="h-1 w-full rounded-full bg-surface-3 overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(percent, 100)}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
}

/* ── Category Breakdown Card ────────────────── */

function CategoryCard({
  data,
  monthTotal,
  monthLabel,
  chartColors,
}: {
  data: CategoryDrilldown[];
  monthTotal: number;
  monthLabel: string;
  chartColors: string[];
}) {
  const [selected, setSelected] = useState<CatDonutEntry | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const entries: CatDonutEntry[] = data.map((cat, i) => ({
    name: cat.categoryName,
    value: cat.total,
    color: chartColors[i % chartColors.length],
    percent: cat.percent,
    id: cat.categoryId,
    subs: cat.subcategories,
  }));

  const isSubView = selected !== null;
  const subEntries = isSubView
    ? selected.subs.map((sub, i) => ({
        name: sub.subcategoryName,
        value: sub.total,
        color: chartColors[i % chartColors.length],
        percent: selected.value > 0 ? (sub.total / selected.value) * 100 : 0,
      }))
    : [];

  const displayEntries = isSubView ? subEntries : entries;
  const displayTotal = isSubView ? selected.value : monthTotal;

  return (
    <div className="rounded-card border border-border bg-surface-1 p-5 max-md:p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <Layers size={16} className="text-sage-400 shrink-0" />
          <AnimatePresence mode="wait">
            {isSubView ? (
              <motion.div
                key="sub"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="flex items-center gap-1.5 min-w-0"
              >
                <button
                  onClick={() => setSelected(null)}
                  className="text-xs text-seafoam-400 hover:text-seafoam-300 transition-colors flex items-center gap-0.5"
                >
                  <ChevronLeft size={12} />
                  Back
                </button>
                <span className="text-sm font-semibold text-text-primary truncate">
                  {selected.name}
                </span>
              </motion.div>
            ) : (
              <motion.h3
                key="main"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="text-sm font-semibold text-text-primary"
              >
                By Category
              </motion.h3>
            )}
          </AnimatePresence>
        </div>
        <span className="text-[10px] text-text-muted shrink-0">{monthLabel}</span>
      </div>

      {/* Donut */}
      <div className="relative h-[190px] w-[190px] mx-auto shrink-0 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={displayEntries}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={88}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
              onMouseEnter={(_, i) => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              onClick={(_, i) => {
                if (!isSubView && entries[i]) {
                  setSelected(entries[i]);
                  setHoverIdx(null);
                }
              }}
              animationBegin={0}
              animationDuration={500}
              animationEasing="ease-out"
              style={{ cursor: isSubView ? "default" : "pointer" }}
            >
              {displayEntries.map((entry, i) => (
                <Cell
                  key={entry.name}
                  fill={entry.color}
                  opacity={hoverIdx === null || hoverIdx === i ? 1 : 0.35}
                  style={{ transition: "opacity 150ms ease" }}
                />
              ))}
            </Pie>
            <Tooltip content={<SharedTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-mono text-sm font-bold tabular-nums text-text-primary">
            {formatAmount(displayTotal)}
          </p>
          <p className="text-[9px] text-text-muted">
            {isSubView ? selected.name : "Total"}
          </p>
        </div>
      </div>

      {/* Legend list */}
      <div className="flex-1 min-h-0 overflow-y-auto max-h-[320px] scrollbar-thin pr-1">
        <div className="flex flex-col gap-0.5">
          {displayEntries.map((entry, i) => {
            const maxVal = displayEntries[0]?.value || 1;
            const barPercent = (entry.value / maxVal) * 100;
            return (
              <motion.div
                key={entry.name}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className={cn(
                  "rounded-input px-2.5 py-2 transition-all duration-150",
                  hoverIdx === i
                    ? "bg-surface-2"
                    : "bg-transparent hover:bg-surface-2/40",
                  !isSubView && "cursor-pointer"
                )}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                onClick={() => {
                  if (!isSubView && entries[i]) {
                    setSelected(entries[i]);
                    setHoverIdx(null);
                  }
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-xs text-text-secondary truncate">
                      {entry.name}
                    </span>
                    {!isSubView && (
                      <ChevronRight size={10} className="text-text-muted/30 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="font-mono text-xs font-medium tabular-nums text-text-primary">
                      {formatAmount(entry.value)}
                    </span>
                    <span className="font-mono text-[10px] tabular-nums text-text-muted w-11 text-right">
                      {entry.percent.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <HBar percent={barPercent} color={entry.color} />
              </motion.div>
            );
          })}
        </div>
      </div>

      {!isSubView && entries.length > 0 && (
        <p className="text-[10px] text-text-muted/50 text-center mt-3">
          Click a category to see subcategories
        </p>
      )}
    </div>
  );
}

/* ── Label Breakdown Card ───────────────────── */

function LabelCard({
  data,
  categoryLabelLinks,
  monthLabel,
  labelColors,
}: {
  data: LabelDrilldown[];
  categoryLabelLinks: CategoryLabelLink[];
  monthLabel: string;
  labelColors: string[];
}) {
  const [selectedLabel, setSelectedLabel] = useState<number | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const entries: LabelDonutEntry[] = data.map((label, i) => ({
    name: label.labelName,
    value: label.total,
    color: labelColors[i % labelColors.length],
    percent: label.percent,
    id: label.labelId,
    count: label.transactionCount,
  }));

  const selectedEntry = selectedLabel !== null
    ? entries.find((e) => e.id === selectedLabel)
    : null;

  const linkedCategories = selectedLabel !== null
    ? categoryLabelLinks
        .filter((cl) => cl.labelId === selectedLabel)
        .sort((a, b) => b.total - a.total)
    : [];

  if (data.length === 0) {
    return (
      <div className="rounded-card border border-border bg-surface-1 p-5 max-md:p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Tag size={16} className="text-sand-400" />
          <h3 className="text-sm font-semibold text-text-primary">By Label</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center flex-1">
          <div className="h-12 w-12 rounded-full bg-surface-3 flex items-center justify-center mb-2">
            <Tag size={20} className="text-text-muted/30" />
          </div>
          <p className="text-xs text-text-muted">No labeled transactions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-border bg-surface-1 p-5 max-md:p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Tag size={16} className="text-sand-400" />
          <h3 className="text-sm font-semibold text-text-primary">By Label</h3>
        </div>
        <span className="text-[10px] text-text-muted shrink-0">{monthLabel}</span>
      </div>

      {/* Donut */}
      <div className="relative h-[190px] w-[190px] mx-auto shrink-0 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={entries}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={88}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
              onMouseEnter={(_, i) => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              onClick={(_, i) => {
                const entry = entries[i];
                if (entry) {
                  setSelectedLabel(
                    selectedLabel === entry.id ? null : entry.id
                  );
                }
              }}
              animationBegin={0}
              animationDuration={500}
              animationEasing="ease-out"
              style={{ cursor: "pointer" }}
            >
              {entries.map((entry, i) => (
                <Cell
                  key={entry.name}
                  fill={entry.color}
                  opacity={
                    selectedLabel !== null
                      ? entry.id === selectedLabel ? 1 : 0.25
                      : hoverIdx === null || hoverIdx === i ? 1 : 0.35
                  }
                  style={{ transition: "opacity 150ms ease" }}
                />
              ))}
            </Pie>
            <Tooltip content={<SharedTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {selectedEntry ? (
            <motion.div
              key={`sel-${selectedEntry.id}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <p className="font-mono text-sm font-bold tabular-nums text-text-primary">
                {formatAmount(selectedEntry.value)}
              </p>
              <p className="text-[9px] text-text-muted max-w-[70px] truncate">
                {selectedEntry.name}
              </p>
            </motion.div>
          ) : (
            <div className="text-center">
              <p className="font-mono text-sm font-bold tabular-nums text-text-primary">
                {entries.length}
              </p>
              <p className="text-[9px] text-text-muted">labels</p>
            </div>
          )}
        </div>
      </div>

      {/* Legend list */}
      <div className="flex-1 min-h-0 overflow-y-auto max-h-[320px] scrollbar-thin pr-1">
        <div className="flex flex-col gap-0.5">
          {entries.map((entry, i) => {
            const maxVal = entries[0]?.value || 1;
            const barPercent = (entry.value / maxVal) * 100;
            return (
              <motion.div
                key={entry.name}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className={cn(
                  "rounded-input px-2.5 py-2 transition-all duration-150 cursor-pointer",
                  selectedLabel === entry.id
                    ? "bg-surface-2 border border-sand-400/30"
                    : hoverIdx === i
                      ? "bg-surface-2 border border-transparent"
                      : "bg-transparent border border-transparent hover:bg-surface-2/40"
                )}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                onClick={() => {
                  setSelectedLabel(
                    selectedLabel === entry.id ? null : entry.id
                  );
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-xs text-text-secondary truncate">
                      {entry.name}
                    </span>
                    <span className="text-[9px] text-text-muted shrink-0">
                      ({entry.count})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="font-mono text-xs font-medium tabular-nums text-text-primary">
                      {formatAmount(entry.value)}
                    </span>
                    <span className="font-mono text-[10px] tabular-nums text-text-muted w-11 text-right">
                      {entry.percent.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <HBar percent={barPercent} color={entry.color} />
              </motion.div>
            );
          })}
        </div>

        {/* Category connections for selected label */}
        {selectedLabel !== null && linkedCategories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3 pt-3 border-t border-border/50"
          >
            <p className="text-[10px] text-text-muted font-medium mb-2">
              Categories using &ldquo;{selectedEntry?.name}&rdquo;
            </p>
            <div className="flex flex-col gap-1">
              {linkedCategories.map((link) => (
                <div
                  key={`${link.categoryId}-${link.labelId}`}
                  className="flex items-center justify-between px-2 py-1"
                >
                  <span className="text-[11px] text-seafoam-300">
                    {link.categoryName}
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-text-muted">
                    {formatAmount(link.total)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {data.length > 0 && (
        <p className="text-[10px] text-text-muted/50 text-center mt-3">
          Click a label to see category connections
        </p>
      )}
    </div>
  );
}

/* ── Main Component ─────────────────────────── */

function MonthlyDrilldown({
  data,
  labelData = [],
  categoryLabelLinks = [],
  monthTotal,
  monthLabel,
}: MonthlyDrilldownProps) {
  const colors = useThemeColors();
  const labelColors = [
    colors.chartColors[2], colors.chartColors[4], colors.chartColors[1], colors.chartColors[3],
    colors.chartColors[0], colors.chartColors[6], colors.chartColors[5], colors.chartColors[7],
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <CategoryCard
        data={data}
        monthTotal={monthTotal}
        monthLabel={monthLabel}
        chartColors={colors.chartColors}
      />
      <LabelCard
        data={labelData}
        categoryLabelLinks={categoryLabelLinks}
        monthLabel={monthLabel}
        labelColors={labelColors}
      />
    </div>
  );
}

export { MonthlyDrilldown };
