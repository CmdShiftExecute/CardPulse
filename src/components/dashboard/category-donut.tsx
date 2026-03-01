"use client";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { formatAmount, cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Tag } from "lucide-react";

interface CategorySpend {
  categoryId: number;
  categoryName: string;
  total: number;
}

interface SubcategorySpend {
  categoryId: number;
  categoryName: string;
  subcategoryId: number;
  subcategoryName: string;
  total: number;
}

interface CategoryLabelLink {
  categoryId: number;
  categoryName: string;
  labelId: number;
  labelName: string;
  total: number;
}

interface CategoryDonutProps {
  data: CategorySpend[];
  subcategoryData?: SubcategorySpend[];
  categoryLabelLinks?: CategoryLabelLink[];
  monthTotal: number;
}

interface DonutEntry {
  id: number;
  name: string;
  value: number;
  color: string;
  percent: number;
}

function prepareData(data: CategorySpend[], monthTotal: number, chartColors: string[]): DonutEntry[] {
  if (data.length === 0) return [];

  const sorted = [...data].sort((a, b) => b.total - a.total);
  const top6 = sorted.slice(0, 6);
  const rest = sorted.slice(6);

  const entries: DonutEntry[] = top6.map((cat, i) => ({
    id: cat.categoryId,
    name: cat.categoryName,
    value: cat.total,
    color: chartColors[i],
    percent: monthTotal > 0 ? (cat.total / monthTotal) * 100 : 0,
  }));

  if (rest.length > 0) {
    const otherTotal = rest.reduce((sum, cat) => sum + cat.total, 0);
    entries.push({
      id: -1,
      name: "Other",
      value: otherTotal,
      color: chartColors[7],
      percent: monthTotal > 0 ? (otherTotal / monthTotal) * 100 : 0,
    });
  }

  return entries;
}

function prepareSubData(
  subs: SubcategorySpend[],
  categoryTotal: number,
  chartColors: string[]
): DonutEntry[] {
  if (subs.length === 0) return [];

  const sorted = [...subs].sort((a, b) => b.total - a.total);

  return sorted.map((sub, i) => ({
    id: sub.subcategoryId,
    name: sub.subcategoryName,
    value: sub.total,
    color: chartColors[i % chartColors.length],
    percent: categoryTotal > 0 ? (sub.total / categoryTotal) * 100 : 0,
  }));
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DonutEntry }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0].payload;

  return (
    <div className="rounded-input border border-border-hover bg-surface-3 px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2 mb-1">
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: entry.color }}
        />
        <span className="text-sm font-medium text-text-primary">
          {entry.name}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-sm font-semibold tabular-nums text-text-primary">
          {formatAmount(entry.value)}
        </span>
        <span className="text-xs text-text-muted">
          {entry.percent.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

function CategoryDonut({
  data,
  subcategoryData = [],
  categoryLabelLinks = [],
  monthTotal,
}: CategoryDonutProps) {
  const { chartColors } = useThemeColors();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [drillCategory, setDrillCategory] = useState<{
    id: number;
    name: string;
    total: number;
    color: string;
  } | null>(null);

  const entries = prepareData(data, monthTotal, chartColors);

  // Subcategory entries for drill-down
  const subEntries = drillCategory
    ? prepareSubData(
        subcategoryData.filter((s) => s.categoryId === drillCategory.id),
        drillCategory.total,
        chartColors
      )
    : [];

  // Labels linked to the drilled category
  const linkedLabels = drillCategory
    ? categoryLabelLinks
        .filter((cl) => cl.categoryId === drillCategory.id)
        .sort((a, b) => b.total - a.total)
    : [];

  const currentEntries = drillCategory ? subEntries : entries;
  const currentTotal = drillCategory ? drillCategory.total : monthTotal;

  function handleSliceClick(entry: DonutEntry) {
    if (drillCategory) return; // Don't drill further
    if (entry.id === -1) return; // Can't drill into "Other"

    setDrillCategory({
      id: entry.id,
      name: entry.name,
      total: entry.value,
      color: entry.color,
    });
    setActiveIndex(null);
  }

  function handleBack() {
    setDrillCategory(null);
    setActiveIndex(null);
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-card border border-border bg-surface-1 p-6 max-md:p-4">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Spend by Category
        </h3>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-16 w-16 rounded-full bg-surface-3 flex items-center justify-center mb-3">
            <div className="h-8 w-8 rounded-full border-2 border-dashed border-text-muted/30" />
          </div>
          <p className="text-sm text-text-muted">
            No transactions this month
          </p>
          <p className="text-xs text-text-muted/60 mt-1">
            Add expenses to see your spending breakdown
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-border bg-surface-1 p-6 max-md:p-4">
      {/* Header with back button */}
      <div className="flex items-center gap-2 mb-4">
        <AnimatePresence mode="wait">
          {drillCategory ? (
            <motion.div
              key="drill"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="flex items-center gap-2"
            >
              <button
                onClick={handleBack}
                className="flex items-center justify-center h-7 w-7 rounded-button bg-surface-3 hover:bg-surface-3/80 text-text-secondary hover:text-text-primary transition-all"
                aria-label="Back to categories"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: drillCategory.color }}
                />
                <h3 className="text-lg font-semibold text-text-primary">
                  {drillCategory.name}
                </h3>
                <span className="font-mono text-sm text-text-muted tabular-nums">
                  {formatAmount(drillCategory.total)}
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.h3
              key="main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-lg font-semibold text-text-primary"
            >
              Spend by Category
            </motion.h3>
          )}
        </AnimatePresence>
      </div>

      {!drillCategory && subcategoryData.length > 0 && (
        <p className="text-xs text-text-muted mb-3 -mt-2">
          Click a slice to see subcategory breakdown
        </p>
      )}

      <div className="flex items-start gap-6 max-md:flex-col max-md:items-center">
        {/* Donut chart */}
        <AnimatePresence mode="wait">
          <motion.div
            key={drillCategory ? `sub-${drillCategory.id}` : "main"}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="relative h-[200px] w-[200px] shrink-0"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={currentEntries}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onClick={(_, index) => handleSliceClick(currentEntries[index])}
                  animationBegin={0}
                  animationDuration={600}
                  animationEasing="ease-out"
                >
                  {currentEntries.map((entry, i) => (
                    <Cell
                      key={entry.name}
                      fill={entry.color}
                      opacity={activeIndex === null || activeIndex === i ? 1 : 0.4}
                      style={{
                        transition: "opacity 150ms ease",
                        cursor: drillCategory ? "default" : entry.id !== -1 ? "pointer" : "default",
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Center label */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              {activeIndex !== null && currentEntries[activeIndex] ? (
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <p className="font-mono text-sm font-bold tabular-nums text-text-primary">
                    {currentEntries[activeIndex].percent.toFixed(1)}%
                  </p>
                  <p className="text-[10px] text-text-muted max-w-[80px] truncate">
                    {currentEntries[activeIndex].name}
                  </p>
                </motion.div>
              ) : (
                <div className="text-center">
                  <p className="font-mono text-sm font-bold tabular-nums text-text-primary">
                    {formatAmount(currentTotal)}
                  </p>
                  <p className="text-[10px] text-text-muted">
                    {drillCategory ? "subtotal" : "total"}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Legend + Labels */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={drillCategory ? `legend-sub-${drillCategory.id}` : "legend-main"}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-col gap-1.5">
                {currentEntries.map((entry, i) => (
                  <motion.div
                    key={entry.name}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={cn(
                      "flex items-center justify-between rounded-input px-3 py-1.5 transition-all duration-150",
                      activeIndex === i
                        ? "bg-surface-2 border border-border-hover"
                        : "bg-transparent border border-transparent hover:bg-surface-2/50",
                      !drillCategory && entry.id !== -1 && "cursor-pointer"
                    )}
                    onMouseEnter={() => setActiveIndex(i)}
                    onMouseLeave={() => setActiveIndex(null)}
                    onClick={() => !drillCategory && handleSliceClick(entry)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-sm text-text-secondary truncate">
                        {entry.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="font-mono text-sm font-medium tabular-nums text-text-primary">
                        {formatAmount(entry.value)}
                      </span>
                      <span className="font-mono text-xs tabular-nums text-text-muted w-12 text-right">
                        {entry.percent.toFixed(1)}%
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Connected labels (shown in drill-down mode) */}
              {drillCategory && linkedLabels.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border/50">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Tag size={12} className="text-text-muted" />
                    <span className="text-xs text-text-muted font-medium">
                      Labels in {drillCategory.name}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {linkedLabels.map((link) => (
                      <span
                        key={link.labelId}
                        className="inline-flex items-center gap-1.5 rounded-full bg-sand-400/10 border border-sand-400/15 px-2.5 py-1 text-xs text-sand-300"
                      >
                        {link.labelName}
                        <span className="font-mono text-[10px] tabular-nums text-sand-400/70">
                          {formatAmount(link.total)}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export { CategoryDonut, type CategoryDonutProps };
