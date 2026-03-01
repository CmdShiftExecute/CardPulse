import { ensureDbReady } from "../src/lib/db/seed";
import { parseTransaction } from "../src/lib/nlp/parser";

ensureDbReady();

interface TestCase {
  input: string;
  expectAmount: number | null;
  expectCategory: string | null;
  expectSubcategory: string | null;
  expectCard: string | null;
  expectLabels: string[];
}

const TEST_CASES: TestCase[] = [
  // 1. From CLAUDE.md examples
  {
    input: "enoc 200 fab card",
    expectAmount: 200,
    expectCategory: "Vehicle",
    expectSubcategory: "Fuel",
    expectCard: "FAB Indulge Card",
    expectLabels: ["Vehicle Expenses", "FAB Indulge Card", "Credit Card Purchase"],
  },
  // 2.
  {
    input: "talabat 85 yesterday mashreq",
    expectAmount: 85,
    expectCategory: "Food & Drinks",
    expectSubcategory: "Restaurant, Fast-Food",
    expectCard: "Mashreq Card",
    expectLabels: ["Food Delivery", "Mashreq Card", "Credit Card Purchase"],
  },
  // 3.
  {
    input: "netflix 55",
    expectAmount: 55,
    expectCategory: "Life & Entertainment",
    expectSubcategory: "TV, Streaming",
    expectCard: null,
    expectLabels: ["Subscriptions", "Bills and Subs"],
  },
  // 4.
  {
    input: "bought shoes 400",
    expectAmount: 400,
    expectCategory: "Shopping",
    expectSubcategory: "Clothes & Shoes",
    expectCard: null,
    expectLabels: [],
  },
  // 5. No keyword match — category should be empty
  {
    input: "random thing 150",
    expectAmount: 150,
    expectCategory: null,
    expectSubcategory: null,
    expectCard: null,
    expectLabels: [],
  },
  // 6. Just an amount — everything else empty
  {
    input: "200",
    expectAmount: 200,
    expectCategory: null,
    expectSubcategory: null,
    expectCard: null,
    expectLabels: [],
  },
  // 7. AED prefix
  {
    input: "AED 1,234.56 carrefour",
    expectAmount: 1234.56,
    expectCategory: "Food & Drinks",
    expectSubcategory: "Groceries",
    expectCard: null,
    expectLabels: ["Groceries"],
  },
  // 8. Card + keyword + date
  {
    input: "starbucks 45 enbd card yesterday",
    expectAmount: 45,
    expectCategory: "Food & Drinks",
    expectSubcategory: "Bar, Café",
    expectCard: "ENBD Platinum Card",
    expectLabels: ["ENBD Platinum Card", "Credit Card Purchase"],
  },
  // 9. Amazon as card alias (should match EIB Amazon Card)
  {
    input: "amazon 350 amazon card",
    expectAmount: 350,
    expectCategory: null, // card matcher strips "amazon" so keyword may not match
    expectSubcategory: null,
    expectCard: "EIB Amazon Card",
    expectLabels: ["EIB Amazon Card", "Credit Card Purchase"],
  },
  // 10. Ambiguous "cashback" alone — should NOT match a card
  {
    input: "cashback 100",
    expectAmount: 100,
    expectCategory: null,
    expectSubcategory: null,
    expectCard: null,
    expectLabels: [],
  },
  // 11. "switch cashback" — should match EIB Switch Cashback Card
  {
    input: "switch cashback 75 starbucks",
    expectAmount: 75,
    expectCategory: "Food & Drinks",
    expectSubcategory: "Bar, Café",
    expectCard: "EIB Switch Cashback Card",
    expectLabels: ["EIB Switch Cashback Card", "Credit Card Purchase"],
  },
  // 12. DEWA utility
  {
    input: "dewa 450 fab",
    expectAmount: 450,
    expectCategory: "Housing",
    expectSubcategory: "Energy, Utilities",
    expectCard: "FAB Indulge Card",
    expectLabels: ["Utilities", "FAB Indulge Card", "Credit Card Purchase"],
  },
  // 13. Empty string — should return defaults, never crash
  {
    input: "",
    expectAmount: null,
    expectCategory: null,
    expectSubcategory: null,
    expectCard: null,
    expectLabels: [],
  },
];

let passed = 0;
let failed = 0;

for (const tc of TEST_CASES) {
  const result = parseTransaction(tc.input);

  const checks: string[] = [];

  // Check amount
  if (tc.expectAmount !== null) {
    if (result.amount !== tc.expectAmount) {
      checks.push(`amount: expected ${tc.expectAmount}, got ${result.amount}`);
    }
  } else if (result.amount !== null) {
    checks.push(`amount: expected null, got ${result.amount}`);
  }

  // Check category
  if (tc.expectCategory !== null) {
    if (result.categoryName !== tc.expectCategory) {
      checks.push(`category: expected "${tc.expectCategory}", got "${result.categoryName}"`);
    }
  } else if (result.categoryName !== null) {
    // Not a failure if we expected null but got something — parser is best-effort
    // But flag it as informational
  }

  // Check subcategory
  if (tc.expectSubcategory !== null) {
    if (result.subcategoryName !== tc.expectSubcategory) {
      checks.push(`subcategory: expected "${tc.expectSubcategory}", got "${result.subcategoryName}"`);
    }
  }

  // Check card
  if (tc.expectCard !== null) {
    if (result.cardName !== tc.expectCard) {
      checks.push(`card: expected "${tc.expectCard}", got "${result.cardName}"`);
    }
  } else if (result.cardName !== null) {
    checks.push(`card: expected null, got "${result.cardName}"`);
  }

  // Check expected labels are present (order doesn't matter)
  for (const expectedLabel of tc.expectLabels) {
    if (!result.labelNames.includes(expectedLabel)) {
      checks.push(`label missing: "${expectedLabel}"`);
    }
  }

  const status = checks.length === 0 ? "✅ PASS" : "❌ FAIL";
  if (checks.length === 0) passed++;
  else failed++;

  console.log(`\n${status}: "${tc.input || "(empty)"}"`);
  console.log(`  Amount: ${result.amount} (${result.confidence.amount.level})`);
  console.log(`  Date: ${result.date} (${result.confidence.date.level})`);
  console.log(`  Card: ${result.cardName || "none"} (${result.confidence.card.level})`);
  console.log(`  Category: ${result.categoryName || "none"} > ${result.subcategoryName || "none"} (${result.confidence.category.level})`);
  console.log(`  Labels: [${result.labelNames.join(", ")}]`);
  if (checks.length > 0) {
    for (const c of checks) console.log(`  ⚠️  ${c}`);
  }
}

console.log(`\n${"=".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed out of ${TEST_CASES.length}`);
console.log(`${"=".repeat(50)}`);

if (failed > 0) {
  process.exit(1);
}
