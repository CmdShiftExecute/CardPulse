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
import { motion } from "framer-motion";
import { Tag } from "lucide-react";

interface LabelSpend {
  labelId: number;
  labelName: string;
  total: number;
  transactionCount: number;
}

interface CategoryLabelLink {
  categoryId: number;
  categoryName: string;
  labelId: number;
  labelName: string;
  total: number;
}

interface LabelDonutProps {
  data: LabelSpend[];
  categoryLabelLinks?: CategoryLabelLink[];
  monthTotal: number;
}

interface DonutEntry {
  id: number;
  name: string;
  value: number;
  color: string;
  percent: number;
  count: number;
}

function prepareData(
  data: LabelSpend[],
  monthTotal: number,
  labelColors: string[],
  chartColors: string[]
): DonutEntry[] {
  if (data.length === 0) return [];

  const sorted = [...data].sort((a, b) => b.total - a.total);
  const top7 = sorted.slice(0, 7);
  const rest = sorted.slice(7);

  const entries: DonutEntry[] = top7.map((label, i) => ({
    id: label.labelId,
    name: label.labelName,
    value: label.total,
    color: labelColors[i % labelColors.length],
    percent: monthTotal > 0 ? (label.total / monthTotal) * 100 : 0,
    count: label.transactionCount,
  }));

  if (rest.length > 0) {
    const otherTotal = rest.reduce((sum, l) => sum + l.total, 0);
    const otherCount = rest.reduce((sum, l) => sum + l.transactionCount, 0);
    entries.push({
      id: -1,
      name: `Other (${rest.length})`,
      value: otherTotal,
      color: chartColors[7],
      percent: monthTotal > 0 ? (otherTotal / monthTotal) * 100 : 0,
      count: otherCount,
    });
  }

  return entries;
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
      <p className="text-[11px] text-text-muted mt-0.5">
        {entry.count} transaction{entry.count !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

function LabelDonut({
  data,
  categoryLabelLinks = [],
  monthTotal,
}: LabelDonutProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<number | null>(null);
  const colors = useThemeColors();
  const labelColors = [
    colors.chartColors[2], colors.chartColors[4], colors.chartColors[1], colors.chartColors[3],
    colors.chartColors[0], colors.chartColors[6], colors.chartColors[5], colors.chartColors[7],
  ];

  const entries = prepareData(data, monthTotal, labelColors, colors.chartColors);

  // Categories linked to the selected label
  const linkedCategories = selectedLabel !== null
    ? categoryLabelLinks
        .filter((cl) => cl.labelId === selectedLabel)
        .sort((a, b) => b.total - a.total)
    : [];

  const selectedEntry = selectedLabel !== null
    ? entries.find((e) => e.id === selectedLabel)
    : null;

  if (entries.length === 0) {
    return (
      <div className="rounded-card border border-border bg-surface-1 p-6 max-md:p-4">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Spend by Label
        </h3>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-16 w-16 rounded-full bg-surface-3 flex items-center justify-center mb-3">
            <Tag size={24} className="text-text-muted/30" />
          </div>
          <p className="text-sm text-text-muted">
            No labeled transactions this month
          </p>
          <p className="text-xs text-text-muted/60 mt-1">
            Labels help track specific spending patterns
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-border bg-surface-1 p-6 max-md:p-4">
      <div className="flex items-center gap-2 mb-1">
        <Tag size={16} className="text-sand-400" />
        <h3 className="text-lg font-semibold text-text-primary">
          Spend by Label
        </h3>
      </div>
      <p className="text-xs text-text-muted mb-4">
        Click a label to see category connections
      </p>

      <div className="flex items-start gap-6 max-md:flex-col max-md:items-center">
        {/* Donut chart */}
        <div className="relative h-[200px] w-[200px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={entries}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                onClick={(_, index) => {
                  const entry = entries[index];
                  if (entry.id === -1) return;
                  setSelectedLabel(
                    selectedLabel === entry.id ? null : entry.id
                  );
                }}
                animationBegin={0}
                animationDuration={600}
                animationEasing="ease-out"
              >
                {entries.map((entry, i) => (
                  <Cell
                    key={entry.name}
                    fill={entry.color}
                    opacity={
                      selectedLabel !== null
                        ? entry.id === selectedLabel
                          ? 1
                          : 0.3
                        : activeIndex === null || activeIndex === i
                          ? 1
                          : 0.4
                    }
                    style={{
                      transition: "opacity 150ms ease",
                      cursor: entry.id !== -1 ? "pointer" : "default",
                    }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center label */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            {selectedEntry ? (
              <motion.div
                key={`selected-${selectedEntry.id}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <p className="font-mono text-sm font-bold tabular-nums text-text-primary">
                  {formatAmount(selectedEntry.value)}
                </p>
                <p className="text-[10px] text-text-muted max-w-[80px] truncate">
                  {selectedEntry.name}
                </p>
              </motion.div>
            ) : activeIndex !== null && entries[activeIndex] ? (
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <p className="font-mono text-sm font-bold tabular-nums text-text-primary">
                  {entries[activeIndex].percent.toFixed(1)}%
                </p>
                <p className="text-[10px] text-text-muted max-w-[80px] truncate">
                  {entries[activeIndex].name}
                </p>
              </motion.div>
            ) : (
              <div className="text-center">
                <p className="font-mono text-sm font-bold tabular-nums text-text-primary">
                  {entries.length}
                </p>
                <p className="text-[10px] text-text-muted">labels</p>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-1.5">
            {entries.map((entry, i) => (
              <motion.div
                key={entry.name}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  "flex items-center justify-between rounded-input px-3 py-1.5 transition-all duration-150",
                  selectedLabel === entry.id
                    ? "bg-surface-2 border border-sand-400/30"
                    : activeIndex === i
                      ? "bg-surface-2 border border-border-hover"
                      : "bg-transparent border border-transparent hover:bg-surface-2/50",
                  entry.id !== -1 && "cursor-pointer"
                )}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
                onClick={() => {
                  if (entry.id === -1) return;
                  setSelectedLabel(
                    selectedLabel === entry.id ? null : entry.id
                  );
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-text-secondary truncate">
                    {entry.name}
                  </span>
                  <span className="text-[10px] text-text-muted shrink-0">
                    ({entry.count})
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

          {/* Category connections for selected label */}
          {selectedLabel !== null && linkedCategories.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 pt-3 border-t border-border/50"
            >
              <p className="text-xs text-text-muted font-medium mb-2">
                Categories using &ldquo;{selectedEntry?.name}&rdquo;
              </p>
              <div className="flex flex-col gap-1">
                {linkedCategories.map((link) => (
                  <div
                    key={`${link.categoryId}-${link.labelId}`}
                    className="flex items-center justify-between px-2 py-1"
                  >
                    <span className="text-xs text-seafoam-300">
                      {link.categoryName}
                    </span>
                    <span className="font-mono text-xs tabular-nums text-text-muted">
                      {formatAmount(link.total)}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export { LabelDonut, type LabelDonutProps };
