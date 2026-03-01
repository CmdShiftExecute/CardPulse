/**
 * Shared chart utilities for the analytics section.
 * Used by all Recharts-based components for consistent formatting and scaling.
 */

import { formatChartAxis } from "@/lib/format";

/**
 * Compute a "nice" Y-axis domain that uses the full chart height.
 * Returns [0, niceMax] where niceMax is a round number slightly above the data max.
 */
export function niceYDomain(maxValue: number): [number, number] {
  if (maxValue <= 0) return [0, 100];

  const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)));
  const normalized = maxValue / magnitude;

  let niceMax: number;
  if (normalized <= 1.2) niceMax = 1.2 * magnitude;
  else if (normalized <= 1.5) niceMax = 1.5 * magnitude;
  else if (normalized <= 2) niceMax = 2 * magnitude;
  else if (normalized <= 2.5) niceMax = 2.5 * magnitude;
  else if (normalized <= 3) niceMax = 3 * magnitude;
  else if (normalized <= 4) niceMax = 4 * magnitude;
  else if (normalized <= 5) niceMax = 5 * magnitude;
  else if (normalized <= 7.5) niceMax = 7.5 * magnitude;
  else niceMax = 10 * magnitude;

  return [0, niceMax];
}

/**
 * Format Y-axis tick values with currency prefix and compact notation.
 * e.g. 0 → "AED 0", 1500 → "AED 1.5k", 25000 → "AED 25k"
 * Uses dynamic currency from settings.
 */
export function formatYAxis(value: number): string {
  return formatChartAxis(value);
}

/**
 * Format a percent change for display.
 * Handles Infinity (new spending), -100% (stopped), and normal cases.
 */
export function formatPercentChange(pct: number | null | undefined): string {
  if (pct == null) return "N/A";
  if (!isFinite(pct)) return "New";
  if (pct === -100) return "-100%";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

/**
 * Compute the max value from an array of data points for Y-axis scaling.
 */
export function getMaxFromData(data: { total: number }[]): number {
  if (data.length === 0) return 0;
  return Math.max(...data.map((d) => d.total));
}
