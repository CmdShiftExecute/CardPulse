"use client";

import { usePathname, useRouter } from "next/navigation";
import { Sun, Moon, Palette, Lock } from "lucide-react";
import { useTheme, type ThemeName } from "@/components/providers/theme-provider";
import { useState, useRef, useEffect } from "react";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/transactions": "Transactions",
  "/cards": "Cards",
  "/emis": "EMIs",
  "/analytics": "Analytics",
  "/budgets": "Budgets",
  "/settings": "Settings",
};

const THEME_OPTIONS: { value: ThemeName; label: string; dot: string }[] = [
  { value: "sage", label: "Sage", dot: "#7EB89E" },
  { value: "midnight", label: "Midnight", dot: "#6BA3D6" },
  { value: "cyberpunk", label: "Cyberpunk", dot: "#FF2D78" },
  { value: "molten", label: "Molten", dot: "#D4634A" },
  { value: "mono", label: "Mono", dot: "#A0A0A0" },
  { value: "terminal", label: "Terminal", dot: "#33FF33" },
];

function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const title = PAGE_TITLES[pathname] || "CardPulse";
  const { theme, mode, setTheme, toggleMode } = useTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Check if PIN is enabled
  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setPinEnabled(data.data.hasPin && data.data.pinEnabled);
      })
      .catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface-1 px-6">
      <h1 className="text-2xl font-bold text-text-primary">{title}</h1>

      <div className="flex items-center gap-2">
        {/* Theme selector */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((p) => !p)}
            className="flex items-center gap-1.5 rounded-button px-2.5 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-3 hover:text-text-primary"
            aria-label="Select theme"
          >
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline capitalize">{mounted ? theme : "sage"}</span>
          </button>

          {open && (
            <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-card border border-border bg-surface-2 py-1 shadow-lg">
              {THEME_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => {
                    setTheme(t.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                    theme === t.value
                      ? "bg-surface-3 text-text-primary"
                      : "text-text-secondary hover:bg-surface-3 hover:text-text-primary"
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: t.dot }}
                  />
                  {t.label}
                  {theme === t.value && (
                    <span className="ml-auto text-sage-400">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Light / Dark toggle — defer icon until mounted to avoid hydration mismatch */}
        <button
          onClick={toggleMode}
          className="flex items-center justify-center rounded-button p-2 text-text-secondary transition-colors hover:bg-surface-3 hover:text-text-primary"
          aria-label={mounted ? (mode === "dark" ? "Switch to light mode" : "Switch to dark mode") : "Toggle color mode"}
        >
          {!mounted ? (
            <Sun className="h-4 w-4" />
          ) : mode === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>

        {/* Lock button — only visible when PIN protection is enabled */}
        {pinEnabled && (
          <button
            onClick={async () => {
              await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "lock" }),
              });
              router.push("/lock");
            }}
            className="flex items-center justify-center rounded-button p-2 text-text-secondary transition-colors hover:bg-surface-3 hover:text-text-primary"
            aria-label="Lock app"
          >
            <Lock className="h-4 w-4" />
          </button>
        )}
      </div>
    </header>
  );
}

export { Header };
