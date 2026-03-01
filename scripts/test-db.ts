import { db } from "../src/lib/db";
import { ensureDbReady } from "../src/lib/db/seed";
import { cards, categories, subcategories, labels, keywordRules, settings } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

ensureDbReady();

console.log("\n=== CATEGORIES ===");
const allCategories = db.select().from(categories).all();
console.log(`Total categories: ${allCategories.length}`);
allCategories.forEach((c) => console.log(`  ${c.id}. ${c.name}`));

console.log("\n=== SUBCATEGORIES (Food & Drinks) ===");
const foodCat = allCategories.find((c) => c.name === "Food & Drinks");
if (foodCat) {
  const foodSubs = db.select().from(subcategories).where(eq(subcategories.categoryId, foodCat.id)).all();
  foodSubs.forEach((s) => console.log(`  ${s.id}. ${s.name}`));
}

console.log("\n=== TOTAL SUBCATEGORIES ===");
const allSubs = db.select().from(subcategories).all();
console.log(`Total subcategories: ${allSubs.length}`);

console.log("\n=== LABELS ===");
const allLabels = db.select().from(labels).all();
console.log(`Total labels: ${allLabels.length}`);
allLabels.forEach((l) => console.log(`  ${l.id}. ${l.name} (system: ${l.isSystem})`));

console.log("\n=== KEYWORD RULES ===");
const allRules = db.select().from(keywordRules).all();
console.log(`Total keyword rules: ${allRules.length}`);
allRules.slice(0, 5).forEach((r) => console.log(`  "${r.keyword}" → cat:${r.categoryId} sub:${r.subcategoryId} labels:${r.labelIds}`));
console.log("  ...");

console.log("\n=== SETTINGS ===");
const allSettings = db.select().from(settings).all();
allSettings.forEach((s) => console.log(`  ${s.key}: ${s.value}`));

console.log("\n=== CARDS ===");
const allCards = db.select().from(cards).all();
console.log(`Total cards: ${allCards.length}`);
allCards.forEach((c) => console.log(`  ${c.id}. ${c.name} (${c.bank}) •${c.lastFour} cycle:${c.cycleStart}→${c.cycleEnd} stmt:${c.statementDay} due:${c.dueDay} color:${c.color}`));

console.log("\n✓ Database seeded and verified successfully!");
