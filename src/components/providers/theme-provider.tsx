"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

/* ── Types ─────────────────────────────────────────────────────────── */

export type ThemeName =
  | "sage"
  | "midnight"
  | "cyberpunk"
  | "molten"
  | "mono"
  | "terminal";

export type ColorMode = "dark" | "light";

interface ThemeContextValue {
  theme: ThemeName;
  mode: ColorMode;
  setTheme: (theme: ThemeName) => void;
  setMode: (mode: ColorMode) => void;
  toggleMode: () => void;
}

const VALID_THEMES: ThemeName[] = [
  "sage",
  "midnight",
  "cyberpunk",
  "molten",
  "mono",
  "terminal",
];
const VALID_MODES: ColorMode[] = ["dark", "light"];

const ThemeContext = createContext<ThemeContextValue | null>(null);

/* ── Provider ──────────────────────────────────────────────────────── */

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Read initial values from the <html> data attributes (set by layout.tsx
  // inline script from localStorage, or from DB settings via SSR).
  const [theme, setThemeState] = useState<ThemeName>(() => {
    if (typeof window === "undefined") return "sage";
    const attr = document.documentElement.getAttribute("data-theme");
    return VALID_THEMES.includes(attr as ThemeName)
      ? (attr as ThemeName)
      : "sage";
  });

  const [mode, setModeState] = useState<ColorMode>(() => {
    if (typeof window === "undefined") return "dark";
    const attr = document.documentElement.getAttribute("data-mode");
    return VALID_MODES.includes(attr as ColorMode)
      ? (attr as ColorMode)
      : "dark";
  });

  // Apply data attributes + persist to localStorage whenever theme/mode changes.
  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute("data-theme", theme);
    el.setAttribute("data-mode", mode);
    localStorage.setItem("cp-theme", theme);
    localStorage.setItem("cp-mode", mode);

    // Dispatch event for useThemeColors hook to re-read computed styles.
    window.dispatchEvent(new CustomEvent("cp-theme-change"));
  }, [theme, mode]);

  // On mount, sync DB settings to localStorage (DB is source of truth for
  // persistence across devices; localStorage is for flash prevention).
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) return;
        const json = await res.json();
        if (!json.success) return;
        const s = json.data as Record<string, string>;
        const dbTheme = s.theme;
        const dbMode = s.color_mode;
        if (
          dbTheme &&
          VALID_THEMES.includes(dbTheme as ThemeName) &&
          dbTheme !== theme
        ) {
          setThemeState(dbTheme as ThemeName);
        }
        if (
          dbMode &&
          VALID_MODES.includes(dbMode as ColorMode) &&
          dbMode !== mode
        ) {
          setModeState(dbMode as ColorMode);
        }
      } catch {
        // Settings API may not be available — ignore silently.
      }
    })();
    // Run only once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTheme = useCallback((t: ThemeName) => {
    setThemeState(t);
    // Persist to DB (fire-and-forget).
    fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: t }),
    }).catch(() => {});
  }, []);

  const setMode = useCallback((m: ColorMode) => {
    setModeState(m);
    fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ color_mode: m }),
    }).catch(() => {});
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ color_mode: next }),
      }).catch(() => {});
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider
      value={{ theme, mode, setTheme, setMode, toggleMode }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

/* ── Hook ──────────────────────────────────────────────────────────── */

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
