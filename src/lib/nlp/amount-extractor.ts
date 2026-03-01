import type { FieldConfidence } from "@/types";
import { getCurrency } from "@/lib/format";

interface AmountResult {
  amount: number;
  confidence: FieldConfidence;
  remainingText: string;
}

/**
 * Extracts a monetary amount from freeform text.
 * Patterns matched (in priority order):
 *   "{CURRENCY} 1,234.56", "aed 45", "1,234.56 {currency}"
 *   "1,234.56", "45.50", "45"
 * The currency code is read from settings (defaults to "AED").
 * Returns null if no amount found — never throws.
 */
export function extractAmount(text: string): AmountResult | null {
  try {
    const normalized = text.trim().toLowerCase();
    const currency = getCurrency().toLowerCase();
    // Escape special regex chars in currency code (unlikely but defensive)
    const esc = currency.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Pattern 1: "{currency} 1,234.56" or "{currency} 45"
    const prefixRe = new RegExp(`${esc}\\s+([\\d,]+(?:\\.\\d{1,2})?)`);
    const prefixMatch = normalized.match(prefixRe);
    if (prefixMatch) {
      const amount = parseAmount(prefixMatch[1]);
      if (amount !== null) {
        const stripRe = new RegExp(`${esc}\\s+[\\d,]+(?:\\.\\d{1,2})?`, "i");
        return {
          amount,
          confidence: { level: "high", score: 1.0 },
          remainingText: text.replace(stripRe, "").trim(),
        };
      }
    }

    // Pattern 2: "1,234.56 {currency}" or "45 {currency}"
    const suffixRe = new RegExp(`([\\d,]+(?:\\.\\d{1,2})?)\\s*${esc}`);
    const suffixMatch = normalized.match(suffixRe);
    if (suffixMatch) {
      const amount = parseAmount(suffixMatch[1]);
      if (amount !== null) {
        const stripRe = new RegExp(`[\\d,]+(?:\\.\\d{1,2})?\\s*${esc}`, "i");
        return {
          amount,
          confidence: { level: "high", score: 1.0 },
          remainingText: text.replace(stripRe, "").trim(),
        };
      }
    }

    // Pattern 3: standalone numbers — find all numbers, take the first one
    // that looks like an amount (not a day/year)
    const numberMatches = Array.from(normalized.matchAll(/([\d,]+(?:\.\d{1,2})?)/g));

    for (const match of numberMatches) {
      const raw = match[1];
      const amount = parseAmount(raw);
      if (amount === null || amount <= 0) continue;

      // Skip numbers that look like dates (1-31), years (2020-2030), or very small
      const isLikelyDate = amount >= 1 && amount <= 31 && !raw.includes(".");
      const isLikelyYear = amount >= 2020 && amount <= 2035;

      // Only skip date-like numbers if there are other numbers available
      if ((isLikelyDate || isLikelyYear) && numberMatches.length > 1) continue;

      // If we only have one number and it's small, it could still be an amount
      const isOnlyNumber = numberMatches.length === 1;
      const confidence: FieldConfidence = isOnlyNumber && isLikelyDate
        ? { level: "low", score: 0.4 }
        : { level: "high", score: 0.9 };

      const escapedRaw = raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return {
        amount,
        confidence,
        remainingText: text.replace(new RegExp(escapedRaw), "").trim(),
      };
    }

    return null;
  } catch {
    return null;
  }
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/,/g, "");
  const num = parseFloat(cleaned);
  if (isNaN(num) || num <= 0) return null;
  return Math.round(num * 100) / 100;
}
