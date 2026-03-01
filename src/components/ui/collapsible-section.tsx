"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "cardpulse-collapsed";

interface CollapsibleSectionProps {
  id: string;
  title: string;
  icon?: ReactNode;
  defaultCollapsed?: boolean;
  children: ReactNode;
}

function readCollapsedState(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as Record<string, boolean>;
    }
  } catch {
    // Ignore parse errors or unavailable localStorage
  }
  return {};
}

function writeCollapsedState(state: Record<string, boolean>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore write errors
  }
}

function CollapsibleSection({
  id,
  title,
  icon,
  defaultCollapsed = false,
  children,
}: CollapsibleSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [hydrated, setHydrated] = useState(false);

  // SSR-safe: read localStorage only after mount
  useEffect(() => {
    const stored = readCollapsedState();
    if (id in stored) {
      setCollapsed(stored[id]);
    }
    setHydrated(true);
  }, [id]);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      const stored = readCollapsedState();
      stored[id] = next;
      writeCollapsedState(stored);
      return next;
    });
  }, [id]);

  // Before hydration, render based on defaultCollapsed to avoid layout shift
  const isCollapsed = hydrated ? collapsed : defaultCollapsed;

  if (isCollapsed) {
    return (
      <div
        role="button"
        tabIndex={0}
        aria-expanded={false}
        aria-label={`Expand ${title}`}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
        className={cn(
          "rounded-card border border-border bg-surface-1 px-4 py-2.5",
          "flex items-center gap-2 cursor-pointer",
          "text-sm text-text-muted font-medium",
          "hover:border-border-hover transition-all duration-150"
        )}
      >
        {icon && (
          <span className="flex-shrink-0 text-text-muted">{icon}</span>
        )}
        <span>{title}</span>
        <ChevronDown className="ml-auto h-4 w-4 flex-shrink-0 text-text-muted" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end -mb-1">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={true}
          aria-label={`Collapse ${title}`}
          className={cn(
            "p-1 text-text-muted hover:text-text-secondary",
            "transition-colors duration-150"
          )}
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>
      <AnimatePresence initial={false}>
        <motion.div
          key="content"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export { CollapsibleSection, type CollapsibleSectionProps };
