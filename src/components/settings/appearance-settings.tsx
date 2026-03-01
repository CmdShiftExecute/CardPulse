"use client";

import { useTheme, type ThemeName } from "@/components/providers/theme-provider";
import { Sun, Moon, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeOption {
  id: ThemeName;
  name: string;
  description: string;
  colors: { bg: string; accent: string; secondary: string };
}

const THEMES: ThemeOption[] = [
  {
    id: "sage",
    name: "Sage",
    description: "Calm green tones",
    colors: { bg: "#0B0E13", accent: "#7EB89E", secondary: "#6BB0A8" },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Deep navy & ice blue",
    colors: { bg: "#0A0F1A", accent: "#6BA3D6", secondary: "#8B9DC3" },
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    description: "Neon pink & cyan",
    colors: { bg: "#000000", accent: "#FF2D78", secondary: "#00F0FF" },
  },
  {
    id: "molten",
    name: "Molten",
    description: "Ember red & amber",
    colors: { bg: "#1A1210", accent: "#D4634A", secondary: "#D4A04A" },
  },
  {
    id: "mono",
    name: "Mono",
    description: "Pure grayscale",
    colors: { bg: "#000000", accent: "#AAAAAA", secondary: "#666666" },
  },
  {
    id: "terminal",
    name: "Terminal",
    description: "Matrix green",
    colors: { bg: "#0A0A0A", accent: "#33FF33", secondary: "#22AA22" },
  },
];

export function AppearanceSettings() {
  const { theme, mode, setTheme, setMode } = useTheme();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Appearance</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Choose a color theme and light or dark mode.
        </p>
      </div>

      {/* Color Mode */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-text-primary">Mode</label>
        <div className="flex gap-3">
          <button
            onClick={() => setMode("dark")}
            className={cn(
              "flex items-center gap-2 rounded-button border px-4 py-2.5 text-sm transition-all",
              mode === "dark"
                ? "border-sage-400 bg-sage-400/10 text-sage-300"
                : "border-border bg-surface-2 text-text-secondary hover:border-border-hover"
            )}
          >
            <Moon size={16} />
            Dark
          </button>
          <button
            onClick={() => setMode("light")}
            className={cn(
              "flex items-center gap-2 rounded-button border px-4 py-2.5 text-sm transition-all",
              mode === "light"
                ? "border-sage-400 bg-sage-400/10 text-sage-300"
                : "border-border bg-surface-2 text-text-secondary hover:border-border-hover"
            )}
          >
            <Sun size={16} />
            Light
          </button>
        </div>
      </div>

      {/* Theme Grid */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-text-primary">Theme</label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {THEMES.map((t) => {
            const isActive = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "group relative rounded-card border p-4 text-left transition-all",
                  isActive
                    ? "border-sage-400 ring-1 ring-sage-400"
                    : "border-border hover:border-border-hover"
                )}
              >
                {isActive && (
                  <div className="absolute right-2 top-2 rounded-full bg-sage-400 p-0.5">
                    <Check size={12} className="text-text-on-accent" />
                  </div>
                )}

                {/* Color swatches */}
                <div className="mb-3 flex gap-1.5">
                  <div
                    className="h-6 w-6 rounded-full border border-border"
                    style={{ backgroundColor: t.colors.bg }}
                  />
                  <div
                    className="h-6 w-6 rounded-full"
                    style={{ backgroundColor: t.colors.accent }}
                  />
                  <div
                    className="h-6 w-6 rounded-full"
                    style={{ backgroundColor: t.colors.secondary }}
                  />
                </div>

                <div className="text-sm font-medium text-text-primary">{t.name}</div>
                <div className="text-xs text-text-muted">{t.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-text-muted">
        Theme changes apply instantly across all pages.
      </p>
    </div>
  );
}
