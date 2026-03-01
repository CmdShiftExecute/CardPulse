/**
 * ENBD Platinum Card — January Statement Import
 * Statement Period: Dec 10, 2025 → Jan 9, 2026
 * Statement Date: 09/01/2026, Due: 03/02/2026
 *
 * This script imports:
 * 1. Regular transactions (8 purchases)
 * 2. EMI plans (6 active installment plans)
 * 3. [EMI] transactions for the Jan cycle (6 installment charges)
 *
 * Excluded:
 * - "CONVERSION TO INSTALLMENT 1040.0" + its CR (net zero, becomes EMI #6)
 * - "TRANSFER PAYMENT RECEIVED" (payment, not a purchase)
 * - "Apple R 597" AED 6,144 (converted to EMI — will appear in Feb statement)
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.resolve(__dirname, "../data/cardpulse.db");
const db = new Database(DB_PATH);

// Enable WAL mode and foreign keys
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ─── Constants ─────────────────────────────────────────────
const ENBD_CARD_ID = 1;

// Category IDs
const CAT_FOOD = 1;
const CAT_SHOPPING = 2;
const CAT_HOUSING = 3;
const CAT_VEHICLE = 5;
const CAT_COMM = 7;
const CAT_FINANCIAL = 8;

// Subcategory IDs
const SUB_GROCERIES = 1;
const SUB_BAR_CAFE = 3;
const SUB_ELECTRONICS = 10;
const SUB_ENERGY_UTILITIES = 17;
const SUB_SERVICES = 18;
const SUB_LEASING = 31;
const SUB_SOFTWARE = 42;
const SUB_INSURANCE = 45;

// Label IDs
const LBL_AMAZON = 1;
const LBL_BILLS_SUBS = 2;
const LBL_CAR_LOAN = 4;
const LBL_ENBD = 9;
const LBL_GROCERIES = 12;
const LBL_SUBSCRIPTIONS = 24;
const LBL_UTILITIES = 28;
const LBL_VEHICLE_EXPENSES = 29;

// ─── Transaction Insert ────────────────────────────────────
const insertTx = db.prepare(`
  INSERT INTO transactions (amount, description, merchant, transaction_date, category_id, subcategory_id, card_id, notes, is_recurring)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertLabel = db.prepare(`
  INSERT INTO transaction_labels (transaction_id, label_id) VALUES (?, ?)
`);

function addTransaction(
  amount: number,
  description: string,
  merchant: string | null,
  date: string,
  categoryId: number,
  subcategoryId: number,
  labelIds: number[],
  notes: string | null = null,
  isRecurring: number = 0
): number {
  const result = insertTx.run(
    amount, description, merchant, date,
    categoryId, subcategoryId, ENBD_CARD_ID,
    notes, isRecurring
  );
  const txId = Number(result.lastInsertRowid);

  // Always add ENBD card label
  const allLabels = Array.from(new Set([LBL_ENBD, ...labelIds]));
  for (const lid of allLabels) {
    insertLabel.run(txId, lid);
  }

  console.log(`  ✓ Transaction #${txId}: ${date} | ${description} | AED ${amount.toFixed(2)}`);
  return txId;
}

// ─── EMI Insert ────────────────────────────────────────────
const insertEmi = db.prepare(`
  INSERT INTO emis (card_id, description, original_amount, monthly_amount, total_months, months_remaining, start_date, end_date, category_id, subcategory_id, label_ids, is_active, auto_generate, last_generated, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?)
`);

function addEmi(
  description: string,
  originalAmount: number,
  monthlyAmount: number,
  totalMonths: number,
  monthsRemaining: number,
  startDate: string,
  categoryId: number,
  subcategoryId: number,
  labelIds: number[],
  notes: string | null = null
): number {
  // Calculate end date
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(start);
  end.setMonth(end.getMonth() + totalMonths);
  const endDate = end.toISOString().split("T")[0];

  // All labels include ENBD card label
  const allLabels = Array.from(new Set([LBL_ENBD, ...labelIds]));
  const labelIdsJson = JSON.stringify(allLabels);

  // last_generated = "2026-01" since we're creating Jan cycle transactions manually
  const lastGenerated = "2026-01";

  const result = insertEmi.run(
    ENBD_CARD_ID, description, originalAmount, monthlyAmount,
    totalMonths, monthsRemaining, startDate, endDate,
    categoryId, subcategoryId, labelIdsJson,
    lastGenerated, notes
  );
  const emiId = Number(result.lastInsertRowid);

  const monthsPaid = totalMonths - monthsRemaining;
  console.log(`  ✓ EMI #${emiId}: ${description} | AED ${monthlyAmount}/mo | ${monthsPaid}/${totalMonths} paid | ${monthsRemaining} left`);
  return emiId;
}

// ═══════════════════════════════════════════════════════════
// IMPORT
// ═══════════════════════════════════════════════════════════

const importAll = db.transaction(() => {
  console.log("\n═══ ENBD Platinum Card — Jan Statement Import ═══\n");

  // ─── 1. REGULAR TRANSACTIONS ─────────────────────────────
  console.log("── Regular Transactions (Dec 10, 2025 → Jan 9, 2026) ──\n");

  // 1. Claude.AI Subscription (20 USD → 75.75 AED)
  addTransaction(
    75.75,
    "Claude.AI Subscription (20 USD)",
    "Claude.AI",
    "2025-12-10",
    CAT_COMM, SUB_SOFTWARE,
    [LBL_SUBSCRIPTIONS, LBL_BILLS_SUBS],
    "1 AED = USD 0.26403",
    1 // recurring
  );

  // 2. Claude.AI Subscription (80.01 USD → 303.06 AED)
  addTransaction(
    303.06,
    "Claude.AI Subscription (80.01 USD)",
    "Claude.AI",
    "2025-12-10",
    CAT_COMM, SUB_SOFTWARE,
    [LBL_SUBSCRIPTIONS, LBL_BILLS_SUBS],
    "1 AED = USD 0.26401",
    1 // recurring
  );

  // 3. Smart Dubai Government — this was CONVERTED TO EMI
  // The charge (1040) and credit (1040 CR) cancel out.
  // The EMI is handled below in EMI section (#6).
  // We do NOT add a regular transaction for this.

  // 4. The Espresso Lab Coffee
  addTransaction(
    111.00,
    "The Espresso Lab Coffee",
    "The Espresso Lab",
    "2025-12-13",
    CAT_FOOD, SUB_BAR_CAFE,
    []
  );

  // 5. Dubai Electricity (DEWA)
  addTransaction(
    296.48,
    "Dubai Electricity (DEWA)",
    "DEWA",
    "2025-12-14",
    CAT_HOUSING, SUB_ENERGY_UTILITIES,
    [LBL_UTILITIES],
    null,
    1 // recurring
  );

  // 6. Amazon Now
  addTransaction(
    83.93,
    "Amazon Now",
    "Amazon",
    "2025-12-19",
    CAT_SHOPPING, SUB_ELECTRONICS,
    [LBL_AMAZON]
  );

  // 7. Apple R 597 (AED 6,144) — SKIP: Converted to EMI (will show in Feb statement)
  // Not added as a transaction since it cancels out with EMI conversion.

  // 8. Amazon Grocery
  addTransaction(
    29.95,
    "Amazon Grocery",
    "Amazon",
    "2026-01-02",
    CAT_FOOD, SUB_GROCERIES,
    [LBL_AMAZON, LBL_GROCERIES]
  );

  // 9. Amazon.ae
  addTransaction(
    84.99,
    "Amazon.ae",
    "Amazon",
    "2026-01-02",
    CAT_SHOPPING, SUB_ELECTRONICS,
    [LBL_AMAZON]
  );

  console.log(`\n  Total regular transactions: 7\n`);

  // ─── 2. EMI PLANS ────────────────────────────────────────
  console.log("── EMI Plans (6 active installments) ──\n");

  // As of the Jan statement, each EMI has completed X installments.
  // The (X/12) notation means "this is installment #X of 12 total".
  // So months_remaining = 12 - X.
  //
  // HOWEVER, since we set last_generated = "2026-01", the app won't
  // try to auto-generate for Jan again. For Feb onward, it will prompt.

  // EMI 1: Sukoon Insurance — 4/12 paid, 8 remaining
  addEmi(
    "Sukoon Insurance (PB)",
    4180.05, 348.34, 12, 8,
    "2025-09-23",
    CAT_FINANCIAL, SUB_INSURANCE,
    [LBL_BILLS_SUBS],
    "Remaining principal: AED 2,786.69 as of Jan 2026"
  );

  // EMI 2: Dubai Smart Government — 5/12 paid, 7 remaining
  addEmi(
    "Dubai Smart Government",
    1740.00, 145.00, 12, 7,
    "2025-08-16",
    CAT_HOUSING, SUB_SERVICES,
    [],
    "Remaining principal: AED 1,015.00 as of Jan 2026"
  );

  // EMI 3: Dubai Electricity — 4/12 paid, 8 remaining
  addEmi(
    "Dubai Electricity",
    875.51, 72.96, 12, 8,
    "2025-09-19",
    CAT_HOUSING, SUB_ENERGY_UTILITIES,
    [LBL_UTILITIES],
    "Remaining principal: AED 583.67 as of Jan 2026"
  );

  // EMI 4: Car Leasing (CARSTF) — 4/12 paid, 8 remaining
  addEmi(
    "Car Leasing (CARSTF)",
    1000.00, 91.23, 12, 8,
    "2025-09-14",
    CAT_VEHICLE, SUB_LEASING,
    [LBL_VEHICLE_EXPENSES, LBL_CAR_LOAN],
    "Remaining principal: AED 685.32 as of Jan 2026"
  );

  // EMI 5: Apple R 597 (older purchase) — 4/12 paid, 8 remaining
  addEmi(
    "Apple R 597",
    2698.00, 224.83, 12, 8,
    "2025-09-29",
    CAT_SHOPPING, SUB_ELECTRONICS,
    [],
    "Remaining principal: AED 1,798.68 as of Jan 2026"
  );

  // EMI 6: Smart Dubai Government (new, Dec 2025) — 1/12 paid, 11 remaining
  addEmi(
    "Smart Dubai Government (Dec 2025)",
    1040.00, 86.67, 12, 11,
    "2025-12-18",
    CAT_HOUSING, SUB_SERVICES,
    [],
    "Converted from Dec 12 purchase. Remaining principal: AED 953.33 as of Jan 2026"
  );

  console.log(`\n  Total EMI plans: 6`);
  console.log(`  Total monthly EMI burden: AED ${(348.34 + 145.00 + 72.96 + 91.23 + 224.83 + 86.67).toFixed(2)}\n`);

  // ─── 3. [EMI] TRANSACTIONS FOR JAN CYCLE ─────────────────
  console.log("── [EMI] Transactions for Jan Cycle ──\n");

  // These represent the installment charges that appeared on the Jan statement.
  // Use the statement date (Jan 9) as the transaction date since EMIs don't
  // have individual posting dates — they're charged as part of the cycle.

  const emiTxDate = "2026-01-09"; // statement date

  addTransaction(
    348.34,
    "[EMI] Sukoon Insurance (PB)",
    "Sukoon Insurance",
    emiTxDate,
    CAT_FINANCIAL, SUB_INSURANCE,
    [LBL_BILLS_SUBS],
    "EMI 4/12",
    1
  );

  addTransaction(
    145.00,
    "[EMI] Dubai Smart Government",
    "Smart Dubai Government",
    emiTxDate,
    CAT_HOUSING, SUB_SERVICES,
    [],
    "EMI 5/12",
    1
  );

  addTransaction(
    72.96,
    "[EMI] Dubai Electricity",
    "DEWA",
    emiTxDate,
    CAT_HOUSING, SUB_ENERGY_UTILITIES,
    [LBL_UTILITIES],
    "EMI 4/12",
    1
  );

  addTransaction(
    91.23,
    "[EMI] Car Leasing (CARSTF)",
    "CARSTF",
    emiTxDate,
    CAT_VEHICLE, SUB_LEASING,
    [LBL_VEHICLE_EXPENSES, LBL_CAR_LOAN],
    "EMI 4/12",
    1
  );

  addTransaction(
    224.83,
    "[EMI] Apple R 597",
    "Apple",
    emiTxDate,
    CAT_SHOPPING, SUB_ELECTRONICS,
    [],
    "EMI 4/12",
    1
  );

  addTransaction(
    86.67,
    "[EMI] Smart Dubai Government (Dec 2025)",
    "Smart Dubai Government",
    emiTxDate,
    CAT_HOUSING, SUB_SERVICES,
    [],
    "EMI 1/12",
    1
  );

  console.log(`\n  Total [EMI] transactions: 6`);
  console.log(`  Total EMI charges this cycle: AED ${(348.34 + 145.00 + 72.96 + 91.23 + 224.83 + 86.67).toFixed(2)}\n`);

  // ─── SUMMARY ─────────────────────────────────────────────
  const regularTotal = 75.75 + 303.06 + 111.00 + 296.48 + 83.93 + 29.95 + 84.99;
  const emiTotal = 348.34 + 145.00 + 72.96 + 91.23 + 224.83 + 86.67;

  console.log("═══ IMPORT SUMMARY ═══");
  console.log(`  Regular transactions: 7  (AED ${regularTotal.toFixed(2)})`);
  console.log(`  EMI plans created:   6`);
  console.log(`  [EMI] transactions:  6  (AED ${emiTotal.toFixed(2)})`);
  console.log(`  ────────────────────────────────`);
  console.log(`  Total cycle spend:   AED ${(regularTotal + emiTotal).toFixed(2)}`);
  console.log(`  Statement balance:   AED 15,920.88 (includes prev balance carry-forward)`);
  console.log("");
});

// Run!
try {
  importAll();
  console.log("✅ Import complete!\n");
} catch (err) {
  console.error("❌ Import failed:", err);
  process.exit(1);
} finally {
  db.close();
}
