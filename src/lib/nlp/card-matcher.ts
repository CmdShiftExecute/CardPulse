import Fuse from "fuse.js";
import { db } from "@/lib/db";
import { cards, labels } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { FieldConfidence } from "@/types";

interface CardMatchResult {
  cardId: number;
  cardName: string;
  labelIds: number[];
  labelNames: string[];
  confidence: FieldConfidence;
  remainingText: string;
}

interface AliasEntry {
  alias: string;
  cardId: number;
  cardName: string;
}

/**
 * Build the alias list from DB cards.aliases column.
 * Each card stores aliases as a JSON array of strings.
 * Also detects ambiguous aliases (shared by 2+ cards).
 */
function loadAliasesFromDB(): { entries: AliasEntry[]; ambiguous: Set<string> } {
  const allCards = db.select().from(cards).where(eq(cards.isActive, 1)).all();
  const entries: AliasEntry[] = [];
  const aliasCounts = new Map<string, number>();

  for (const card of allCards) {
    let cardAliases: string[] = [];
    if (card.aliases) {
      try {
        cardAliases = JSON.parse(card.aliases) as string[];
      } catch {
        cardAliases = [];
      }
    }
    for (const alias of cardAliases) {
      const lower = alias.toLowerCase().trim();
      if (!lower) continue;
      entries.push({ alias: lower, cardId: card.id, cardName: card.name });
      aliasCounts.set(lower, (aliasCounts.get(lower) || 0) + 1);
    }
  }

  // An alias is ambiguous if it maps to 2+ different cards
  const ambiguous = new Set<string>();
  aliasCounts.forEach((count, alias) => {
    if (count > 1) ambiguous.add(alias);
  });

  return { entries, ambiguous };
}

/**
 * Matches card aliases in freeform text.
 * Uses Fuse.js for fuzzy matching against all card aliases loaded from DB.
 * Handles ambiguity dynamically: if an alias maps to 2+ cards, reject unless
 * the full text contains a disambiguating word.
 * Strips matched alias from remaining text for keyword matching.
 * Returns null if no card found — never throws.
 */
export function matchCard(text: string): CardMatchResult | null {
  try {
    const normalized = text.trim().toLowerCase();
    const { entries: aliasEntries, ambiguous } = loadAliasesFromDB();

    if (aliasEntries.length === 0) return null;

    // Try longest alias first for exact substring matching (before fuzzy)
    const sortedEntries = [...aliasEntries].sort(
      (a, b) => b.alias.length - a.alias.length
    );

    let bestMatch: { cardId: number; cardName: string; alias: string; score: number } | null = null;

    for (const entry of sortedEntries) {
      // Check for "card" suffix pattern: "fab card", "mashreq card"
      const cardPattern = new RegExp(`\\b${escapeRegex(entry.alias)}\\s+card\\b`, "i");
      const plainPattern = new RegExp(`\\b${escapeRegex(entry.alias)}\\b`, "i");

      if (cardPattern.test(normalized)) {
        bestMatch = { cardId: entry.cardId, cardName: entry.cardName, alias: entry.alias + " card", score: 1.0 };
        break;
      }

      if (plainPattern.test(normalized) && !bestMatch) {
        bestMatch = { cardId: entry.cardId, cardName: entry.cardName, alias: entry.alias, score: 0.95 };
        // Don't break — a longer match may come
      }
    }

    // If no exact match, try fuzzy with Fuse.js
    if (!bestMatch) {
      const words = normalized.split(/\s+/);
      // Try 2-word and 3-word chunks, then single words
      const chunks: string[] = [];
      for (let len = 3; len >= 1; len--) {
        for (let i = 0; i <= words.length - len; i++) {
          chunks.push(words.slice(i, i + len).join(" "));
        }
      }

      const fuse = new Fuse(aliasEntries, {
        keys: ["alias"],
        threshold: 0.3,
        includeScore: true,
      });

      for (const chunk of chunks) {
        const results = fuse.search(chunk);
        if (results.length > 0 && results[0].score !== undefined) {
          const fuseScore = 1 - results[0].score; // Fuse returns 0=perfect, 1=worst
          if (fuseScore >= 0.7) {
            // Check for fuzzy ambiguity: do top results map to different cards with similar scores?
            const topCardIds = new Set<number>();
            for (const r of results) {
              if (r.score !== undefined && (1 - r.score) >= 0.7) {
                topCardIds.add(r.item.cardId);
              }
            }
            if (topCardIds.size > 1) {
              // Multiple cards match this chunk with similar scores — ambiguous, skip
              continue;
            }
            bestMatch = {
              cardId: results[0].item.cardId,
              cardName: results[0].item.cardName,
              alias: chunk,
              score: fuseScore,
            };
            break;
          }
        }
      }
    }

    if (!bestMatch) return null;

    // Ambiguity check: if the matched alias is ambiguous, check for disambiguation
    const matchedAliasLower = bestMatch.alias.toLowerCase().replace(/\s+card$/, "");
    if (ambiguous.has(matchedAliasLower)) {
      // Check if other words in text disambiguate to a specific card
      // Find all cards that share this alias
      const matchingCards = aliasEntries
        .filter(e => e.alias === matchedAliasLower)
        .map(e => e.cardId);

      // Try to find a longer, non-ambiguous alias in the text that resolves to one card
      const disambiguated = sortedEntries.find(entry => {
        if (matchingCards.includes(entry.cardId) && entry.alias !== matchedAliasLower) {
          const pattern = new RegExp(`\\b${escapeRegex(entry.alias)}\\b`, "i");
          return pattern.test(normalized);
        }
        return false;
      });

      if (disambiguated) {
        bestMatch = { cardId: disambiguated.cardId, cardName: disambiguated.cardName, alias: disambiguated.alias, score: 0.95 };
      } else {
        // Can't disambiguate — reject
        return null;
      }
    }

    // Look up card in DB (verify it still exists)
    const dbCard = db.select().from(cards).where(eq(cards.id, bestMatch.cardId)).get();
    if (!dbCard) return null;

    // Look up card label
    const matchedLabels: { id: number; name: string }[] = [];

    const cardLabel = db.select().from(labels).where(eq(labels.name, dbCard.labelName)).get();
    if (cardLabel) {
      matchedLabels.push({ id: cardLabel.id, name: cardLabel.name });
    }

    // Strip the matched alias from text
    const aliasRegex = new RegExp(`\\b${escapeRegex(bestMatch.alias)}\\b`, "i");
    let remaining = text.replace(aliasRegex, " ").replace(/\s+/g, " ").trim();
    // Also strip trailing/leading "card" word if leftover
    remaining = remaining.replace(/\bcard\b/gi, "").replace(/\s+/g, " ").trim();

    const confidence: FieldConfidence = bestMatch.score >= 0.9
      ? { level: "high", score: bestMatch.score }
      : { level: "low", score: bestMatch.score };

    return {
      cardId: dbCard.id,
      cardName: dbCard.name,
      labelIds: matchedLabels.map((l) => l.id),
      labelNames: matchedLabels.map((l) => l.name),
      confidence,
      remainingText: remaining,
    };
  } catch {
    return null;
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
