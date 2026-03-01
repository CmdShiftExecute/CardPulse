/** @deprecated Use useThemeColors() from @/hooks/use-theme-colors instead — adapts to current theme */
export const COLORS = {
  base: "#0B0E13",
  surface1: "#12161D",
  surface2: "#1A1F2B",
  surface3: "#222838",
  border: "#2A3145",
  borderHover: "#3A4260",

  sage400: "#7EB89E",
  sage300: "#A3D4B8",
  sage200: "#C8E8D4",
  sage500: "#5A9A7A",
  sageGlow: "#7EB89E14",

  seafoam400: "#6BB0A8",
  seafoam300: "#8ECAC2",
  seafoam200: "#B4DED8",

  sand400: "#C4AA78",
  sand300: "#D8C49A",
  sand200: "#E8DCC0",

  success: "#7DD3A8",
  warning: "#D4B878",
  danger: "#C87070",
  info: "#6BB0A8",

  textPrimary: "#E4E2DE",
  textSecondary: "#8A90A0",
  textMuted: "#555C70",
  textOnAccent: "#0B0E13",
} as const;

/** @deprecated Use useThemeColors().chartColors from @/hooks/use-theme-colors instead — adapts to current theme */
export const CHART_COLORS = [
  "#7EB89E",
  "#6BB0A8",
  "#C4AA78",
  "#8B9DC3",
  "#B8A0C8",
  "#A8C0B0",
  "#C8B8A0",
  "#90A8B8",
] as const;

/** @deprecated Use getCurrency() from @/lib/format instead — reads from DB settings */
export const CURRENCY = "AED" as const;

