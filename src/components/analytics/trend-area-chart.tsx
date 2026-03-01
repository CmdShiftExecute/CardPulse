"use client";

import { useMemo, useId } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { niceYDomain, formatYAxis } from "@/lib/chart-utils";
import { ChartTooltip } from "./chart-tooltip";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface DataPoint {
  label: string;
  total: number;
}

interface DropdownOption {
  value: string;
  label: string;
}

interface TrendAreaChartProps {
  data: DataPoint[];
  color: string;
  title: string;
  subtitle?: string;
  /** Dropdown options. First item is the "All" option. */
  dropdownOptions?: DropdownOption[];
  selectedOption?: string;
  onSelect?: (value: string) => void;
}

export function TrendAreaChart({
  data,
  color,
  title,
  subtitle,
  dropdownOptions,
  selectedOption,
  onSelect,
}: TrendAreaChartProps) {
  const colors = useThemeColors();
  const gradientId = useId().replace(/:/g, "_");

  const maxVal = useMemo(() => {
    if (data.length === 0) return 0;
    return Math.max(...data.map((d) => d.total));
  }, [data]);

  const domain = useMemo(() => niceYDomain(maxVal), [maxVal]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-card border border-border bg-surface-1 p-5 max-md:p-4"
    >
      {/* Header with title + dropdown */}
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="min-w-0">
          <h4 className="text-base font-semibold text-text-primary">{title}</h4>
          {subtitle && (
            <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
          )}
        </div>
        {dropdownOptions && dropdownOptions.length > 0 && (
          <select
            value={selectedOption}
            onChange={(e) => onSelect?.(e.target.value)}
            className={cn(
              "shrink-0 rounded-button border border-border bg-surface-2 px-3 py-1.5",
              "text-xs font-medium text-text-primary",
              "focus:outline-none focus:border-sage-400 focus:ring-1 focus:ring-sage-400/20",
              "hover:border-border-hover transition-all duration-150",
              "[color-scheme:dark] cursor-pointer max-w-[180px]"
            )}
          >
            {dropdownOptions.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-surface-2">
                {opt.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Chart */}
      <div
        className="w-full"
        style={{ aspectRatio: "2.8 / 1", minHeight: 220, maxHeight: 380 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
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
              domain={domain}
              tickFormatter={formatYAxis}
              width={56}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="total"
              name={title}
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{
                r: 5,
                fill: color,
                stroke: colors.surface1,
                strokeWidth: 2,
              }}
              animationDuration={700}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
