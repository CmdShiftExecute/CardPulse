"use client";

import { useCallback, useEffect, useState } from "react";

/* ── Types ─────────────────────────────────────────────────────────── */

interface ThemeColors {
  /** 8 chart colors as hex strings for Recharts */
  chartColors: string[];
  /** Individual named colors as hex (for Recharts props, inline styles) */
  sage400: string;
  sage300: string;
  sage500: string;
  seafoam400: string;
  seafoam300: string;
  sand400: string;
  sand300: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  border: string;
  borderHover: string;
  surface1: string;
  surface2: string;
  surface3: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnAccent: string;
  base: string;
}

/* ── Fallback (Sage Dark) ──────────────────────────────────────────── */

const FALLBACK: ThemeColors = {
  chartColors: [
    "#7EB89E",
    "#6BB0A8",
    "#C4AA78",
    "#8B9DC3",
    "#B8A0C8",
    "#A8C0B0",
    "#C8B8A0",
    "#90A8B8",
  ],
  sage400: "#7EB89E",
  sage300: "#A3D4B8",
  sage500: "#5A9A7A",
  seafoam400: "#6BB0A8",
  seafoam300: "#8ECAC2",
  sand400: "#C4AA78",
  sand300: "#D8C49A",
  success: "#7DD3A8",
  warning: "#D4B878",
  danger: "#C87070",
  info: "#6BB0A8",
  border: "#2A3145",
  borderHover: "#3A4260",
  surface1: "#12161D",
  surface2: "#1A1F2B",
  surface3: "#222838",
  textPrimary: "#E4E2DE",
  textSecondary: "#8A90A0",
  textMuted: "#555C70",
  textOnAccent: "#0B0E13",
  base: "#0B0E13",
};

/* ── Helpers ───────────────────────────────────────────────────────── */

/** Convert "126 184 158" (CSS variable value) → "#7EB89E" (hex for Recharts). */
function rgbChannelsToHex(channels: string): string {
  const parts = channels.trim().split(/\s+/).map(Number);
  if (parts.length < 3 || parts.some(isNaN)) return "#000000";
  const [r, g, b] = parts;
  return (
    "#" +
    [r, g, b]
      .map((v) =>
        Math.max(0, Math.min(255, v))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
      .toUpperCase()
  );
}

/** Read a CSS variable's RGB channels from computed styles and return hex. */
function readVar(style: CSSStyleDeclaration, name: string): string {
  const raw = style.getPropertyValue(`--color-${name}`).trim();
  if (!raw) return "";
  return rgbChannelsToHex(raw);
}

/** Read all theme colors from computed CSS variables. */
function readAllColors(): ThemeColors {
  if (typeof window === "undefined") return FALLBACK;

  const style = getComputedStyle(document.documentElement);
  const get = (name: string, fallback: string): string =>
    readVar(style, name) || fallback;

  return {
    chartColors: [
      get("chart-1", FALLBACK.chartColors[0]),
      get("chart-2", FALLBACK.chartColors[1]),
      get("chart-3", FALLBACK.chartColors[2]),
      get("chart-4", FALLBACK.chartColors[3]),
      get("chart-5", FALLBACK.chartColors[4]),
      get("chart-6", FALLBACK.chartColors[5]),
      get("chart-7", FALLBACK.chartColors[6]),
      get("chart-8", FALLBACK.chartColors[7]),
    ],
    sage400: get("sage-400", FALLBACK.sage400),
    sage300: get("sage-300", FALLBACK.sage300),
    sage500: get("sage-500", FALLBACK.sage500),
    seafoam400: get("seafoam-400", FALLBACK.seafoam400),
    seafoam300: get("seafoam-300", FALLBACK.seafoam300),
    sand400: get("sand-400", FALLBACK.sand400),
    sand300: get("sand-300", FALLBACK.sand300),
    success: get("success", FALLBACK.success),
    warning: get("warning", FALLBACK.warning),
    danger: get("danger", FALLBACK.danger),
    info: get("info", FALLBACK.info),
    border: get("border", FALLBACK.border),
    borderHover: get("border-hover", FALLBACK.borderHover),
    surface1: get("surface-1", FALLBACK.surface1),
    surface2: get("surface-2", FALLBACK.surface2),
    surface3: get("surface-3", FALLBACK.surface3),
    textPrimary: get("text-primary", FALLBACK.textPrimary),
    textSecondary: get("text-secondary", FALLBACK.textSecondary),
    textMuted: get("text-muted", FALLBACK.textMuted),
    textOnAccent: get("text-on-accent", FALLBACK.textOnAccent),
    base: get("base", FALLBACK.base),
  };
}

/* ── Hook ──────────────────────────────────────────────────────────── */

/**
 * Returns current theme colors as hex strings. Automatically re-reads
 * when the theme changes (listens for `cp-theme-change` event dispatched
 * by ThemeProvider). Use for Recharts props and inline styles that need
 * hex color values instead of CSS classes.
 */
export function useThemeColors(): ThemeColors {
  const [colors, setColors] = useState<ThemeColors>(FALLBACK);

  const refresh = useCallback(() => {
    // Small delay to let the browser recompute styles after CSS var changes.
    requestAnimationFrame(() => setColors(readAllColors()));
  }, []);

  useEffect(() => {
    // Initial read.
    setColors(readAllColors());

    // Re-read when theme changes.
    window.addEventListener("cp-theme-change", refresh);
    return () => window.removeEventListener("cp-theme-change", refresh);
  }, [refresh]);

  return colors;
}
