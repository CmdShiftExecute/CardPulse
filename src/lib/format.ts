/**
 * Central formatting module for CardPulse.
 * Provides currency, amount, date, and chart axis formatting.
 *
 * Works on both server (reads DB directly) and client (reads from injected global).
 * Client-side hydration: layout.tsx injects `window.__CP_FMT__` before React mounts.
 */

/* ── Types ──────────────────────────────────────────────── */

interface FormatSettings {
  currency: string;
  numberFormat: "comma_period" | "period_comma";
  dateFormat: "DD/MM" | "MM/DD";
}

const DEFAULTS: FormatSettings = {
  currency: "AED",
  numberFormat: "comma_period",
  dateFormat: "DD/MM",
};

/* ── Cache ──────────────────────────────────────────────── */

let _cache: FormatSettings | null = null;

/**
 * Load format settings.
 * Server: reads from DB (cached at module level).
 * Client: reads from window.__CP_FMT__ (injected by layout.tsx).
 */
function getSettings(): FormatSettings {
  if (_cache) return _cache;

  if (typeof window === "undefined") {
    // Server-side: read from DB
    try {
      // Dynamic require to keep better-sqlite3 out of client bundles
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { db } = require("@/lib/db");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { settings } = require("@/lib/db/schema");
      const rows = db.select().from(settings).all() as Array<{ key: string; value: string }>;
      const map: Record<string, string> = {};
      for (const row of rows) {
        map[row.key] = row.value;
      }
      _cache = {
        currency: map.currency || DEFAULTS.currency,
        numberFormat: (map.number_format || DEFAULTS.numberFormat) as FormatSettings["numberFormat"],
        dateFormat: (map.date_format || DEFAULTS.dateFormat) as FormatSettings["dateFormat"],
      };
    } catch {
      _cache = { ...DEFAULTS };
    }
  } else {
    // Client-side: check injected global from layout.tsx
    const g = (window as unknown as Record<string, unknown>).__CP_FMT__ as Partial<FormatSettings> | undefined;
    if (g) {
      _cache = {
        currency: (g.currency as string) || DEFAULTS.currency,
        numberFormat: (g.numberFormat as FormatSettings["numberFormat"]) || DEFAULTS.numberFormat,
        dateFormat: (g.dateFormat as FormatSettings["dateFormat"]) || DEFAULTS.dateFormat,
      };
    } else {
      _cache = { ...DEFAULTS };
    }
  }

  return _cache;
}

/* ── Public API ─────────────────────────────────────────── */

/** Get the current format settings object (for injection into client). */
export function getFormatSettings(): FormatSettings {
  return { ...getSettings() };
}

/** Get the configured currency code (e.g., "AED", "USD", "EUR"). */
export function getCurrency(): string {
  return getSettings().currency;
}

/**
 * Format a monetary amount with the configured currency and number format.
 * e.g., "AED 1,234.56" (comma_period) or "USD 1.234,56" (period_comma)
 */
export function formatAmount(amount: number): string {
  const { currency, numberFormat } = getSettings();

  if (numberFormat === "period_comma") {
    // European style: 1.234,56
    const formatted = amount.toLocaleString("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${currency} ${formatted}`;
  }

  // Default: comma_period style: 1,234.56
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency} ${formatted}`;
}

/**
 * Format a chart Y-axis value with currency prefix and compact notation.
 * e.g., "AED 0", "USD 1.5k", "EUR 25k"
 */
export function formatChartAxis(value: number): string {
  const currency = getCurrency();
  if (value === 0) return `${currency} 0`;
  if (value >= 1000) {
    const k = value / 1000;
    return `${currency} ${k >= 10 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return `${currency} ${value}`;
}

/**
 * Format a date string (YYYY-MM-DD) according to the configured date format.
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string"
    ? new Date(date + (date.includes("T") ? "" : "T00:00:00"))
    : date;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  const { dateFormat } = getSettings();
  if (dateFormat === "MM/DD") {
    return `${month}/${day}/${year}`;
  }
  return `${day}/${month}/${year}`;
}

/**
 * Invalidate the cached format settings.
 * Call this after settings are updated via the API.
 */
export function invalidateFormatCache(): void {
  _cache = null;
}
