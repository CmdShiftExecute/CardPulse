import type { FieldConfidence } from "@/types";

interface DateResult {
  date: string; // YYYY-MM-DD
  confidence: FieldConfidence;
  remainingText: string;
}

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONTH_NAMES: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
  apr: 3, april: 3, may: 4, jun: 5, june: 5,
  jul: 6, july: 6, aug: 7, august: 7, sep: 8, september: 8,
  oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
};

function formatDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function removeMatch(text: string, pattern: RegExp): string {
  return text.replace(pattern, " ").replace(/\s+/g, " ").trim();
}

/**
 * Extracts a date from freeform text.
 * Supports: "today", "yesterday", "saturday", "last friday",
 *           "feb 5", "5 feb", "05/02", "02/05"
 * Returns null if no date found — never throws.
 * Default to today is handled by the orchestrator, not here.
 */
export function extractDate(text: string): DateResult | null {
  try {
    const normalized = text.trim().toLowerCase();
    const now = new Date();

    // "today"
    if (/\btoday\b/.test(normalized)) {
      return {
        date: formatDate(now),
        confidence: { level: "high", score: 1.0 },
        remainingText: removeMatch(text, /\btoday\b/i),
      };
    }

    // "yesterday"
    if (/\byesterday\b/.test(normalized)) {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      return {
        date: formatDate(d),
        confidence: { level: "high", score: 1.0 },
        remainingText: removeMatch(text, /\byesterday\b/i),
      };
    }

    // "last <day>" e.g. "last friday"
    const lastDayMatch = normalized.match(/\blast\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
    if (lastDayMatch) {
      const targetDay = DAY_NAMES.indexOf(lastDayMatch[1]);
      const d = new Date(now);
      const currentDay = d.getDay();
      let diff = currentDay - targetDay;
      if (diff <= 0) diff += 7;
      d.setDate(d.getDate() - diff);
      return {
        date: formatDate(d),
        confidence: { level: "high", score: 0.95 },
        remainingText: removeMatch(text, /\blast\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i),
      };
    }

    // bare day name "saturday", "friday" — means most recent past occurrence (or today)
    for (const dayName of DAY_NAMES) {
      const dayRegex = new RegExp(`\\b${dayName}\\b`);
      if (dayRegex.test(normalized)) {
        const targetDay = DAY_NAMES.indexOf(dayName);
        const d = new Date(now);
        const currentDay = d.getDay();
        let diff = currentDay - targetDay;
        if (diff < 0) diff += 7;
        if (diff === 0) diff = 0; // today is that day
        d.setDate(d.getDate() - diff);
        return {
          date: formatDate(d),
          confidence: { level: "high", score: 0.9 },
          remainingText: removeMatch(text, new RegExp(`\\b${dayName}\\b`, "i")),
        };
      }
    }

    // "feb 5", "february 5", "5 feb", "5 february", "feb 05"
    const monthDayMatch = normalized.match(
      /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})\b/
    );
    if (monthDayMatch) {
      const month = MONTH_NAMES[monthDayMatch[1]];
      const day = parseInt(monthDayMatch[2]);
      if (month !== undefined && day >= 1 && day <= 31) {
        const d = new Date(now.getFullYear(), month, day);
        // If the date is in the future, use last year
        if (d > now) d.setFullYear(d.getFullYear() - 1);
        return {
          date: formatDate(d),
          confidence: { level: "high", score: 0.95 },
          remainingText: removeMatch(text, /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}\b/i),
        };
      }
    }

    // "5 feb", "05 february"
    const dayMonthMatch = normalized.match(
      /\b(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/
    );
    if (dayMonthMatch) {
      const day = parseInt(dayMonthMatch[1]);
      const month = MONTH_NAMES[dayMonthMatch[2]];
      if (month !== undefined && day >= 1 && day <= 31) {
        const d = new Date(now.getFullYear(), month, day);
        if (d > now) d.setFullYear(d.getFullYear() - 1);
        return {
          date: formatDate(d),
          confidence: { level: "high", score: 0.95 },
          remainingText: removeMatch(text, /\b\d{1,2}\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i),
        };
      }
    }

    // "05/02" or "5/2" — treat as DD/MM (UAE convention)
    const slashDateMatch = normalized.match(/\b(\d{1,2})\/(\d{1,2})\b/);
    if (slashDateMatch) {
      const day = parseInt(slashDateMatch[1]);
      const month = parseInt(slashDateMatch[2]) - 1;
      if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
        const d = new Date(now.getFullYear(), month, day);
        if (d > now) d.setFullYear(d.getFullYear() - 1);
        return {
          date: formatDate(d),
          confidence: { level: "low", score: 0.7 },
          remainingText: removeMatch(text, /\b\d{1,2}\/\d{1,2}\b/),
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}
