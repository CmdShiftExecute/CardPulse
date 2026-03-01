import Fuse from "fuse.js";
import { db } from "@/lib/db";
import { keywordRules, categories, subcategories, labels } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { FieldConfidence } from "@/types";

interface KeywordMatchResult {
  categoryId: number;
  categoryName: string;
  subcategoryId: number;
  subcategoryName: string;
  labelIds: number[];
  labelNames: string[];
  confidence: FieldConfidence;
  merchant: string | null;
}

interface RuleEntry {
  id: number;
  keyword: string;
  categoryId: number | null;
  subcategoryId: number | null;
  labelIds: string | null;
  priority: number;
  isSystem: number;
}

/**
 * Matches remaining text against keyword_rules using Fuse.js.
 * User-created rules (is_system=0) are checked first (higher priority).
 * Returns category, subcategory, labels, and a confidence score.
 * Returns null if no match — never throws.
 */
export function matchKeyword(text: string): KeywordMatchResult | null {
  try {
    if (!text || text.trim().length === 0) return null;

    const normalized = text.trim().toLowerCase();

    // Load all keyword rules, user rules first (higher priority)
    const rules = db
      .select()
      .from(keywordRules)
      .orderBy(desc(keywordRules.priority), keywordRules.isSystem)
      .all();

    if (rules.length === 0) return null;

    // First try exact substring match (most reliable)
    const exactMatch = findExactMatch(normalized, rules);
    if (exactMatch) {
      return resolveRule(exactMatch.rule, exactMatch.keyword, { level: "high", score: 1.0 });
    }

    // Then fuzzy match with Fuse.js
    const fuse = new Fuse(rules, {
      keys: ["keyword"],
      threshold: 0.3,
      includeScore: true,
    });

    // Try multi-word chunks first, then single words
    const words = normalized.split(/\s+/).filter((w) => w.length > 1);
    const chunks: string[] = [];
    for (let len = Math.min(3, words.length); len >= 1; len--) {
      for (let i = 0; i <= words.length - len; i++) {
        chunks.push(words.slice(i, i + len).join(" "));
      }
    }

    for (const chunk of chunks) {
      const results = fuse.search(chunk);
      if (results.length > 0 && results[0].score !== undefined) {
        const fuseScore = 1 - results[0].score;
        if (fuseScore >= 0.7) {
          const confidenceLevel = fuseScore >= 0.85 ? "high" : "low";
          return resolveRule(
            results[0].item,
            results[0].item.keyword,
            { level: confidenceLevel, score: fuseScore }
          );
        }
      }
    }

    // Fallback: fuzzy match against subcategory names directly
    // Catches cases like "shoes" → "Clothes & Shoes" where no keyword rule exists
    const subcatFallback = matchSubcategoryName(normalized, words);
    if (subcatFallback) return subcatFallback;

    return null;
  } catch {
    return null;
  }
}

function findExactMatch(text: string, rules: RuleEntry[]): { rule: RuleEntry; keyword: string } | null {
  // Sort by keyword length descending so longer matches win
  const sorted = [...rules].sort((a, b) => b.keyword.length - a.keyword.length);

  for (const rule of sorted) {
    if (text.includes(rule.keyword.toLowerCase())) {
      return { rule, keyword: rule.keyword };
    }
  }
  return null;
}

/**
 * Fallback: fuzzy-match input words against subcategory names.
 * This catches cases like "shoes" → "Clothes & Shoes" where no keyword rule exists.
 * Uses a tighter threshold to avoid false positives.
 * Returns with "low" confidence since it's a fallback.
 */
function matchSubcategoryName(normalized: string, words: string[]): KeywordMatchResult | null {
  try {
    const allSubcats = db
      .select({
        id: subcategories.id,
        name: subcategories.name,
        categoryId: subcategories.categoryId,
      })
      .from(subcategories)
      .all();

    if (allSubcats.length === 0) return null;

    // Build searchable entries: split subcategory names into individual terms
    // e.g. "Clothes & Shoes" → searchable parts: ["clothes", "shoes"]
    interface SubcatSearchEntry {
      term: string;
      subcatId: number;
      subcatName: string;
      categoryId: number;
    }

    const searchEntries: SubcatSearchEntry[] = [];
    for (const sub of allSubcats) {
      // Split on common separators: comma, ampersand, slash, hyphen
      const parts = sub.name
        .split(/[,&/\-]+/)
        .map((p) => p.trim().toLowerCase())
        .filter((p) => p.length > 2);

      for (const part of parts) {
        searchEntries.push({
          term: part,
          subcatId: sub.id,
          subcatName: sub.name,
          categoryId: sub.categoryId,
        });
      }

      // Also add the full name as a searchable entry
      searchEntries.push({
        term: sub.name.toLowerCase(),
        subcatId: sub.id,
        subcatName: sub.name,
        categoryId: sub.categoryId,
      });
    }

    const subcatFuse = new Fuse(searchEntries, {
      keys: ["term"],
      threshold: 0.3,
      includeScore: true,
    });

    // Try each word from input against subcategory terms
    // Require word length > 3 to avoid false positives ("thing" → "renting")
    for (const word of words) {
      if (word.length <= 3) continue; // skip short words

      const results = subcatFuse.search(word);
      if (results.length > 0 && results[0].score !== undefined) {
        const fuseScore = 1 - results[0].score;
        if (fuseScore >= 0.8) {
          const entry = results[0].item;

          const cat = db
            .select()
            .from(categories)
            .where(eq(categories.id, entry.categoryId))
            .get();

          if (!cat) continue;

          return {
            categoryId: cat.id,
            categoryName: cat.name,
            subcategoryId: entry.subcatId,
            subcategoryName: entry.subcatName,
            labelIds: [],
            labelNames: [],
            confidence: { level: "low", score: fuseScore },
            merchant: null,
          };
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

function resolveRule(
  rule: RuleEntry,
  matchedKeyword: string,
  confidence: FieldConfidence
): KeywordMatchResult | null {
  try {
    if (!rule.categoryId || !rule.subcategoryId) return null;

    const cat = db.select().from(categories).where(eq(categories.id, rule.categoryId)).get();
    const sub = db.select().from(subcategories).where(eq(subcategories.id, rule.subcategoryId)).get();

    if (!cat || !sub) return null;

    // Resolve label IDs from the rule's JSON array
    const resolvedLabels: { id: number; name: string }[] = [];
    if (rule.labelIds) {
      try {
        const ids = JSON.parse(rule.labelIds) as number[];
        for (const id of ids) {
          const label = db.select().from(labels).where(eq(labels.id, id)).get();
          if (label) {
            resolvedLabels.push({ id: label.id, name: label.name });
          }
        }
      } catch {
        // Invalid JSON in labelIds — skip labels, don't crash
      }
    }

    return {
      categoryId: cat.id,
      categoryName: cat.name,
      subcategoryId: sub.id,
      subcategoryName: sub.name,
      labelIds: resolvedLabels.map((l) => l.id),
      labelNames: resolvedLabels.map((l) => l.name),
      confidence,
      merchant: matchedKeyword,
    };
  } catch {
    return null;
  }
}
