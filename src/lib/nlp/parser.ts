import { extractAmount } from "./amount-extractor";
import { extractDate } from "./date-extractor";
import { matchCard } from "./card-matcher";
import { matchKeyword } from "./keyword-matcher";
import type { ParsedTransaction, FieldConfidence } from "@/types";

const NONE_CONFIDENCE: FieldConfidence = { level: "none", score: 0 };

function todayString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Main NLP parser. Orchestrates all sub-parsers in order:
 *   1. Amount extraction
 *   2. Card matching (strips alias from text)
 *   3. Date extraction
 *   4. Keyword matching (runs on remaining text after card stripped)
 *
 * NEVER throws. Every field in the result is nullable.
 * Any sub-parser failure results in that field being null, not a crash.
 */
export function parseTransaction(rawText: string): ParsedTransaction {
  const result: ParsedTransaction = {
    amount: null,
    date: todayString(),
    cardId: null,
    cardName: null,
    categoryId: null,
    categoryName: null,
    subcategoryId: null,
    subcategoryName: null,
    labelIds: [],
    labelNames: [],
    merchant: null,
    confidence: {
      amount: NONE_CONFIDENCE,
      date: { level: "high", score: 1.0 }, // default today = high confidence
      card: NONE_CONFIDENCE,
      category: NONE_CONFIDENCE,
    },
    remainingText: rawText,
  };

  if (!rawText || rawText.trim().length === 0) return result;

  let workingText = rawText.trim();

  // Step 1: Extract amount
  try {
    const amountResult = extractAmount(workingText);
    if (amountResult) {
      result.amount = amountResult.amount;
      result.confidence.amount = amountResult.confidence;
      workingText = amountResult.remainingText;
    }
  } catch {
    // Amount extraction failed — leave null
  }

  // Step 2: Match card (runs before keyword matcher per spec)
  // Card aliases get stripped from text so keyword matcher doesn't confuse them
  try {
    const cardResult = matchCard(workingText);
    if (cardResult) {
      result.cardId = cardResult.cardId;
      result.cardName = cardResult.cardName;
      result.confidence.card = cardResult.confidence;
      result.labelIds.push(...cardResult.labelIds);
      result.labelNames.push(...cardResult.labelNames);
      workingText = cardResult.remainingText;
    }
  } catch {
    // Card matching failed — leave null
  }

  // Step 3: Extract date
  try {
    const dateResult = extractDate(workingText);
    if (dateResult) {
      result.date = dateResult.date;
      result.confidence.date = dateResult.confidence;
      workingText = dateResult.remainingText;
    }
    // If no date found, keep the default (today with high confidence)
  } catch {
    // Date extraction failed — keep default today
  }

  // Step 4: Keyword matching on remaining text
  try {
    const keywordResult = matchKeyword(workingText);
    if (keywordResult) {
      result.categoryId = keywordResult.categoryId;
      result.categoryName = keywordResult.categoryName;
      result.subcategoryId = keywordResult.subcategoryId;
      result.subcategoryName = keywordResult.subcategoryName;
      result.confidence.category = keywordResult.confidence;
      result.merchant = keywordResult.merchant;

      // Merge keyword labels with card labels (avoid duplicates)
      for (let i = 0; i < keywordResult.labelIds.length; i++) {
        if (!result.labelIds.includes(keywordResult.labelIds[i])) {
          result.labelIds.push(keywordResult.labelIds[i]);
          result.labelNames.push(keywordResult.labelNames[i]);
        }
      }
    }
  } catch {
    // Keyword matching failed — leave null
  }

  result.remainingText = workingText;
  return result;
}
