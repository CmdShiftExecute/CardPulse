import { db, sqlite } from "./index";
import { cards, categories, subcategories, labels, keywordRules, settings } from "./schema";
import { count, eq } from "drizzle-orm";

const CATEGORIES_WITH_SUBS: Record<string, string[]> = {
  "Food & Drinks": ["Groceries", "Restaurant, Fast-Food", "Bar, Café"],
  "Shopping": [
    "Clothes & Shoes", "Jewels, Accessories", "Health and Beauty", "Kids",
    "Home, Garden", "Pets, Animals", "Electronics, Accessories", "Gifts, Joy",
    "Stationery, Tools", "Free Time", "Drug-store, Chemist",
  ],
  "Housing": [
    "Rent", "Mortgage", "Energy, Utilities", "Services",
    "Maintenance, Repairs", "Property Insurance", "Laundry",
  ],
  "Transportation": ["Public Transport", "Taxi", "Long Distance", "Business Trips"],
  "Vehicle": [
    "Fuel", "Parking", "Vehicle Maintenance", "Rentals",
    "Vehicle Insurance", "Leasing", "Toll",
  ],
  "Life & Entertainment": [
    "Books, Audio, Subscriptions", "TV, Streaming", "Holiday, Trips, Hotels",
    "Charity, Gifts", "Alcohol, Tobacco", "Lottery, Gambling", "Cinema",
  ],
  "Communication, PC": [
    "Phone, Cell Phone", "Internet", "Software, Apps, Games", "Postal Services",
  ],
  "Financial Expenses": [
    "Taxes", "Insurance", "Loan, Interests", "Fines",
    "Credit Card Payment", "Charges, Fees", "India Transfer", "Buy Now Pay Later",
  ],
  "Investments": [
    "Realty", "Vehicles, Shuttles", "Financial Investments", "Savings", "Collections",
  ],
  "Income": [
    "Wage, Invoices", "Interests, Dividends", "Sale", "Rental Income",
    "Dues & Grants", "Lending, Renting", "Checks, Coupons", "Lottery, Gambling",
    "Refunds (Tax, Purchase)", "Child Support", "Gifts",
  ],
  "Others": ["Missing"],
};

// Labels that are always seeded for all users (universal)
const UNIVERSAL_SYSTEM_LABELS = [
  "Amazon", "Bills and Subs", "Buy Now Pay Later", "Car Loan", "Celebrations",
  "Credit Card Purchase", "Food Delivery", "Groceries",
  "Hospital", "India Transfers", "Laundry", "Movies",
  "Nicotine Gum", "One Time Purchase", "Rent", "Savings", "Shisha", "Spa",
  "Subscriptions", "Tabby", "Telecom", "Temu", "Utilities", "Vehicle Expenses",
  "Weekend",
];

// Card-specific labels — only seeded for existing users who already have these cards in their DB
const CARD_SPECIFIC_LABELS = [
  "EIB Amazon Card", "EIB Switch Cashback Card",
  "ENBD Platinum Card", "FAB Indulge Card", "Mashreq Card",
];

interface KeywordRuleSeed {
  keyword: string;
  category: string;
  sub: string;
  labels: string[];
}

const KEYWORD_RULES: KeywordRuleSeed[] = [
  { keyword: "carrefour", category: "Food & Drinks", sub: "Groceries", labels: ["Groceries"] },
  { keyword: "lulu", category: "Food & Drinks", sub: "Groceries", labels: ["Groceries"] },
  { keyword: "union coop", category: "Food & Drinks", sub: "Groceries", labels: ["Groceries"] },
  { keyword: "choithrams", category: "Food & Drinks", sub: "Groceries", labels: ["Groceries"] },
  { keyword: "spinneys", category: "Food & Drinks", sub: "Groceries", labels: ["Groceries"] },
  { keyword: "grandiose", category: "Food & Drinks", sub: "Groceries", labels: ["Groceries"] },
  { keyword: "viva", category: "Food & Drinks", sub: "Groceries", labels: ["Groceries"] },
  { keyword: "nesto", category: "Food & Drinks", sub: "Groceries", labels: ["Groceries"] },
  { keyword: "talabat", category: "Food & Drinks", sub: "Restaurant, Fast-Food", labels: ["Food Delivery"] },
  { keyword: "deliveroo", category: "Food & Drinks", sub: "Restaurant, Fast-Food", labels: ["Food Delivery"] },
  { keyword: "zomato", category: "Food & Drinks", sub: "Restaurant, Fast-Food", labels: ["Food Delivery"] },
  { keyword: "noon food", category: "Food & Drinks", sub: "Restaurant, Fast-Food", labels: ["Food Delivery"] },
  { keyword: "mcdonalds", category: "Food & Drinks", sub: "Restaurant, Fast-Food", labels: [] },
  { keyword: "kfc", category: "Food & Drinks", sub: "Restaurant, Fast-Food", labels: [] },
  { keyword: "burger king", category: "Food & Drinks", sub: "Restaurant, Fast-Food", labels: [] },
  { keyword: "subway", category: "Food & Drinks", sub: "Restaurant, Fast-Food", labels: [] },
  { keyword: "hardees", category: "Food & Drinks", sub: "Restaurant, Fast-Food", labels: [] },
  { keyword: "starbucks", category: "Food & Drinks", sub: "Bar, Café", labels: [] },
  { keyword: "tim hortons", category: "Food & Drinks", sub: "Bar, Café", labels: [] },
  { keyword: "costa", category: "Food & Drinks", sub: "Bar, Café", labels: [] },
  { keyword: "caribou", category: "Food & Drinks", sub: "Bar, Café", labels: [] },
  { keyword: "coffee", category: "Food & Drinks", sub: "Bar, Café", labels: [] },
  { keyword: "amazon", category: "Shopping", sub: "Electronics, Accessories", labels: ["Amazon"] },
  { keyword: "noon", category: "Shopping", sub: "Electronics, Accessories", labels: [] },
  { keyword: "temu", category: "Shopping", sub: "Electronics, Accessories", labels: ["Temu"] },
  { keyword: "sharaf dg", category: "Shopping", sub: "Electronics, Accessories", labels: [] },
  { keyword: "emax", category: "Shopping", sub: "Electronics, Accessories", labels: [] },
  { keyword: "namshi", category: "Shopping", sub: "Clothes & Shoes", labels: [] },
  { keyword: "h&m", category: "Shopping", sub: "Clothes & Shoes", labels: [] },
  { keyword: "zara", category: "Shopping", sub: "Clothes & Shoes", labels: [] },
  { keyword: "shein", category: "Shopping", sub: "Clothes & Shoes", labels: [] },
  { keyword: "max fashion", category: "Shopping", sub: "Clothes & Shoes", labels: [] },
  { keyword: "centrepoint", category: "Shopping", sub: "Clothes & Shoes", labels: [] },
  { keyword: "boots", category: "Shopping", sub: "Drug-store, Chemist", labels: [] },
  { keyword: "life pharmacy", category: "Shopping", sub: "Drug-store, Chemist", labels: [] },
  { keyword: "aster pharmacy", category: "Shopping", sub: "Drug-store, Chemist", labels: [] },
  { keyword: "bin sina", category: "Shopping", sub: "Drug-store, Chemist", labels: [] },
  { keyword: "medcare", category: "Shopping", sub: "Health and Beauty", labels: ["Hospital"] },
  { keyword: "nmc", category: "Shopping", sub: "Health and Beauty", labels: ["Hospital"] },
  { keyword: "aster hospital", category: "Shopping", sub: "Health and Beauty", labels: ["Hospital"] },
  { keyword: "mediclinic", category: "Shopping", sub: "Health and Beauty", labels: ["Hospital"] },
  { keyword: "prime hospital", category: "Shopping", sub: "Health and Beauty", labels: ["Hospital"] },
  { keyword: "ikea", category: "Shopping", sub: "Home, Garden", labels: [] },
  { keyword: "home centre", category: "Shopping", sub: "Home, Garden", labels: [] },
  { keyword: "ace hardware", category: "Shopping", sub: "Home, Garden", labels: [] },
  { keyword: "babyshop", category: "Shopping", sub: "Kids", labels: [] },
  { keyword: "mothercare", category: "Shopping", sub: "Kids", labels: [] },
  { keyword: "firstcry", category: "Shopping", sub: "Kids", labels: [] },
  { keyword: "dewa", category: "Housing", sub: "Energy, Utilities", labels: ["Utilities"] },
  { keyword: "washmen", category: "Housing", sub: "Laundry", labels: ["Laundry"] },
  { keyword: "champion cleaners", category: "Housing", sub: "Laundry", labels: ["Laundry"] },
  { keyword: "enoc", category: "Vehicle", sub: "Fuel", labels: ["Vehicle Expenses"] },
  { keyword: "adnoc", category: "Vehicle", sub: "Fuel", labels: ["Vehicle Expenses"] },
  { keyword: "emarat", category: "Vehicle", sub: "Fuel", labels: ["Vehicle Expenses"] },
  { keyword: "eppco", category: "Vehicle", sub: "Fuel", labels: ["Vehicle Expenses"] },
  { keyword: "shell", category: "Vehicle", sub: "Fuel", labels: ["Vehicle Expenses"] },
  { keyword: "salik", category: "Vehicle", sub: "Toll", labels: ["Vehicle Expenses"] },
  { keyword: "darb", category: "Vehicle", sub: "Toll", labels: ["Vehicle Expenses"] },
  { keyword: "rta parking", category: "Vehicle", sub: "Parking", labels: ["Vehicle Expenses"] },
  { keyword: "mawaqif", category: "Vehicle", sub: "Parking", labels: ["Vehicle Expenses"] },
  { keyword: "careem", category: "Transportation", sub: "Taxi", labels: [] },
  { keyword: "uber", category: "Transportation", sub: "Taxi", labels: [] },
  { keyword: "hala", category: "Transportation", sub: "Taxi", labels: [] },
  { keyword: "netflix", category: "Life & Entertainment", sub: "TV, Streaming", labels: ["Subscriptions", "Bills and Subs"] },
  { keyword: "spotify", category: "Life & Entertainment", sub: "Books, Audio, Subscriptions", labels: ["Subscriptions", "Bills and Subs"] },
  { keyword: "apple.com/bill", category: "Life & Entertainment", sub: "TV, Streaming", labels: ["Subscriptions", "Bills and Subs"] },
  { keyword: "youtube premium", category: "Life & Entertainment", sub: "TV, Streaming", labels: ["Subscriptions", "Bills and Subs"] },
  { keyword: "disney+", category: "Life & Entertainment", sub: "TV, Streaming", labels: ["Subscriptions", "Bills and Subs"] },
  { keyword: "shahid", category: "Life & Entertainment", sub: "TV, Streaming", labels: ["Subscriptions", "Bills and Subs"] },
  { keyword: "vox cinema", category: "Life & Entertainment", sub: "Cinema", labels: ["Movies"] },
  { keyword: "reel cinema", category: "Life & Entertainment", sub: "Cinema", labels: ["Movies"] },
  { keyword: "novo cinema", category: "Life & Entertainment", sub: "Cinema", labels: ["Movies"] },
  { keyword: "booking.com", category: "Life & Entertainment", sub: "Holiday, Trips, Hotels", labels: [] },
  { keyword: "airbnb", category: "Life & Entertainment", sub: "Holiday, Trips, Hotels", labels: [] },
  { keyword: "du", category: "Communication, PC", sub: "Phone, Cell Phone", labels: ["Telecom"] },
  { keyword: "etisalat", category: "Communication, PC", sub: "Phone, Cell Phone", labels: ["Telecom"] },
  { keyword: "virgin mobile", category: "Communication, PC", sub: "Phone, Cell Phone", labels: ["Telecom"] },
  { keyword: "setapp", category: "Communication, PC", sub: "Software, Apps, Games", labels: ["Subscriptions"] },
  { keyword: "github", category: "Communication, PC", sub: "Software, Apps, Games", labels: ["Subscriptions"] },
  { keyword: "openai", category: "Communication, PC", sub: "Software, Apps, Games", labels: ["Subscriptions"] },
  { keyword: "anthropic", category: "Communication, PC", sub: "Software, Apps, Games", labels: ["Subscriptions"] },
  { keyword: "notion", category: "Communication, PC", sub: "Software, Apps, Games", labels: ["Subscriptions"] },
  { keyword: "tabby", category: "Financial Expenses", sub: "Buy Now Pay Later", labels: ["Tabby", "Buy Now Pay Later"] },
  { keyword: "postpay", category: "Financial Expenses", sub: "Buy Now Pay Later", labels: ["Buy Now Pay Later"] },
  { keyword: "tamara", category: "Financial Expenses", sub: "Buy Now Pay Later", labels: ["Buy Now Pay Later"] },
  { keyword: "western union", category: "Financial Expenses", sub: "India Transfer", labels: ["India Transfers"] },
  { keyword: "al ansari", category: "Financial Expenses", sub: "India Transfer", labels: ["India Transfers"] },
  { keyword: "uae exchange", category: "Financial Expenses", sub: "India Transfer", labels: ["India Transfers"] },
  { keyword: "spa", category: "Shopping", sub: "Health and Beauty", labels: ["Spa"] },
  { keyword: "massage", category: "Shopping", sub: "Health and Beauty", labels: ["Spa"] },
  { keyword: "rent", category: "Housing", sub: "Rent", labels: ["Rent"] },
];

// All settings keys with their default values.
// For existing users: INSERT OR IGNORE ensures new keys are added without overwriting.
const DEFAULT_SETTINGS: Record<string, string> = {
  currency: "AED",
  app_name: "CardPulse",
  date_format: "DD/MM",
  number_format: "comma_period",
  pin_enabled: "true",
  theme: "sage",
  color_mode: "dark",
  first_run_complete: "false",
};

// Card aliases used for one-time migration to populate the DB aliases column.
// After migration, card-matcher reads aliases from the cards table directly.
// @deprecated — will be removed in Phase 4 when constants.ts is cleaned up
const LEGACY_CARD_ALIASES: Record<string, string[]> = {
  "ENBD Platinum Card": [
    "enbd", "enbd platinum", "enbd card", "platinum card", "emirates nbd",
    "enbd mastercard", "platinum",
  ],
  "EIB Amazon Card": [
    "amazon", "amazon card", "eib amazon", "amazon world", "eib amazon card",
    "amazon world card",
  ],
  "EIB Switch Cashback Card": [
    "switch", "switch cashback", "eib switch", "switch card", "eib switch cashback",
    "eib cashback",
  ],
  "Mashreq Card": [
    "mashreq", "mashreq card", "mashreq cashback", "mashreq cashback card", "mash",
  ],
  "FAB Indulge Card": [
    "fab", "fab card", "fab indulge", "indulge", "indulge card", "fab indulge card",
    "first abu dhabi",
  ],
};

function createTables() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS subcategories (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id   INTEGER NOT NULL REFERENCES categories(id),
      name          TEXT NOT NULL,
      UNIQUE(category_id, name)
    );

    CREATE TABLE IF NOT EXISTS labels (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT NOT NULL UNIQUE,
      is_system     INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cards (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT NOT NULL UNIQUE,
      label_name    TEXT NOT NULL UNIQUE,
      bank          TEXT NOT NULL,
      last_four     TEXT,
      cycle_start   INTEGER NOT NULL,
      cycle_end     INTEGER NOT NULL,
      statement_day INTEGER NOT NULL,
      due_day       INTEGER NOT NULL,
      credit_limit  REAL,
      color         TEXT,
      aliases       TEXT,
      is_active     INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      amount          REAL NOT NULL,
      description     TEXT NOT NULL,
      merchant        TEXT,
      transaction_date TEXT NOT NULL,
      category_id     INTEGER REFERENCES categories(id),
      subcategory_id  INTEGER REFERENCES subcategories(id),
      card_id         INTEGER REFERENCES cards(id),
      notes           TEXT,
      is_recurring    INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transaction_labels (
      transaction_id  INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
      label_id        INTEGER NOT NULL REFERENCES labels(id),
      PRIMARY KEY (transaction_id, label_id)
    );

    CREATE TABLE IF NOT EXISTS keyword_rules (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword         TEXT NOT NULL,
      category_id     INTEGER REFERENCES categories(id),
      subcategory_id  INTEGER REFERENCES subcategories(id),
      label_ids       TEXT,
      priority        INTEGER NOT NULL DEFAULT 0,
      is_system       INTEGER NOT NULL DEFAULT 1,
      created_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS emis (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id         INTEGER NOT NULL REFERENCES cards(id),
      description     TEXT NOT NULL,
      original_amount REAL NOT NULL,
      monthly_amount  REAL NOT NULL,
      total_months    INTEGER NOT NULL,
      months_remaining INTEGER NOT NULL,
      start_date      TEXT NOT NULL,
      end_date        TEXT,
      category_id     INTEGER REFERENCES categories(id),
      subcategory_id  INTEGER REFERENCES subcategories(id),
      label_ids       TEXT,
      is_active       INTEGER NOT NULL DEFAULT 1,
      auto_generate   INTEGER NOT NULL DEFAULT 1,
      last_generated  TEXT,
      notes           TEXT,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id     INTEGER NOT NULL REFERENCES categories(id),
      subcategory_id  INTEGER REFERENCES subcategories(id),
      month           INTEGER NOT NULL,
      year            INTEGER NOT NULL,
      amount          REAL NOT NULL,
      UNIQUE(category_id, subcategory_id, month, year)
    );

    CREATE TABLE IF NOT EXISTS cycle_payments (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id         INTEGER NOT NULL REFERENCES cards(id),
      cycle_start     TEXT NOT NULL,
      cycle_end       TEXT NOT NULL,
      due_date        TEXT NOT NULL,
      amount          REAL NOT NULL,
      is_paid         INTEGER NOT NULL DEFAULT 0,
      paid_at         TEXT,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(card_id, cycle_start, cycle_end)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key             TEXT PRIMARY KEY,
      value           TEXT NOT NULL
    );
  `);
}

/**
 * Ensures all default settings exist in the DB.
 * Uses INSERT OR IGNORE so existing values are never overwritten.
 * Safe to call on every startup — idempotent.
 */
function ensureSettingsExist() {
  const stmt = sqlite.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    stmt.run(key, value);
  }
}

/**
 * Migrates the cards table to add the `aliases` column if it doesn't exist.
 * For existing cards, populates aliases from the legacy CARD_ALIASES constant.
 */
function migrateCardAliases() {
  // Add aliases column if missing (safe: errors if already exists, caught by try/catch)
  try {
    sqlite.exec("ALTER TABLE cards ADD COLUMN aliases TEXT");
  } catch {
    // Column already exists — expected for existing DBs that already ran this migration
  }

  // Populate aliases for existing cards that don't have them yet
  const existingCards = db.select({ id: cards.id, name: cards.name, aliases: cards.aliases }).from(cards).all();
  for (const card of existingCards) {
    if (card.aliases === null || card.aliases === undefined) {
      const legacyAliases = LEGACY_CARD_ALIASES[card.name];
      if (legacyAliases) {
        db.update(cards)
          .set({ aliases: JSON.stringify(legacyAliases) })
          .where(eq(cards.id, card.id))
          .run();
      }
    }
  }
}

/**
 * Detects whether this is an existing user (has cards/transactions) or a fresh install.
 * For existing users, marks first_run_complete=true so card seeding is skipped.
 */
function detectExistingUser(): boolean {
  const cardCount = db.select({ value: count() }).from(cards).get();
  return !!(cardCount && cardCount.value > 0);
}

export function seedDatabase() {
  const result = db.select({ value: count() }).from(categories).get();
  if (result && result.value > 0) {
    return;
  }

  createTables();

  const isExistingUser = detectExistingUser();
  const categoryMap: Record<string, number> = {};
  const subcategoryMap: Record<string, Record<string, number>> = {};
  const labelMap: Record<string, number> = {};

  // Determine which labels to seed
  const labelsToSeed = isExistingUser
    ? [...UNIVERSAL_SYSTEM_LABELS, ...CARD_SPECIFIC_LABELS]
    : UNIVERSAL_SYSTEM_LABELS;

  sqlite.exec("BEGIN TRANSACTION");

  try {
    // Seed categories and subcategories
    const categoryOrder = [
      "Food & Drinks", "Shopping", "Housing", "Transportation", "Vehicle",
      "Life & Entertainment", "Communication, PC", "Financial Expenses",
      "Investments", "Income", "Others",
    ];

    for (const catName of categoryOrder) {
      const catResult = db.insert(categories).values({ name: catName }).returning().get();
      categoryMap[catName] = catResult.id;
      subcategoryMap[catName] = {};

      const subs = CATEGORIES_WITH_SUBS[catName];
      for (const subName of subs) {
        const subResult = db.insert(subcategories).values({
          categoryId: catResult.id,
          name: subName,
        }).returning().get();
        subcategoryMap[catName][subName] = subResult.id;
      }
    }

    // Seed labels
    for (const labelName of labelsToSeed) {
      const labelResult = db.insert(labels).values({
        name: labelName,
        isSystem: 1,
      }).returning().get();
      labelMap[labelName] = labelResult.id;
    }

    // Seed keyword rules
    for (const rule of KEYWORD_RULES) {
      const categoryId = categoryMap[rule.category];
      const subcategoryId = subcategoryMap[rule.category]?.[rule.sub];
      const resolvedLabelIds = rule.labels
        .map((l) => labelMap[l])
        .filter((id): id is number => id !== undefined);

      db.insert(keywordRules).values({
        keyword: rule.keyword,
        categoryId,
        subcategoryId,
        labelIds: resolvedLabelIds.length > 0 ? JSON.stringify(resolvedLabelIds) : null,
        priority: 0,
        isSystem: 1,
      }).run();
    }

    // Seed default settings (OR IGNORE for idempotent re-runs)
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      sqlite.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run(key, value);
    }

    sqlite.exec("COMMIT");
  } catch (error) {
    sqlite.exec("ROLLBACK");
    throw error;
  }
}

export function ensureDbReady() {
  createTables();

  // Run migrations for existing databases
  migrateCardAliases();
  ensureSettingsExist();

  // Detect if this is an existing user and mark accordingly
  const isExistingUser = detectExistingUser();
  if (isExistingUser) {
    // Existing user: ensure first_run_complete is true (don't overwrite if already set)
    const existing = db.select().from(settings).where(eq(settings.key, "first_run_complete")).get();
    if (!existing || existing.value === "false") {
      sqlite.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run("first_run_complete", "true");
    }
    // Also ensure pin_enabled defaults to true for existing users who have a PIN
    const pinHash = db.select().from(settings).where(eq(settings.key, "pin_hash")).get();
    if (pinHash) {
      const pinEnabled = db.select().from(settings).where(eq(settings.key, "pin_enabled")).get();
      if (!pinEnabled) {
        sqlite.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run("pin_enabled", "true");
      }
    }
  }

  // Seed categories, labels, keyword rules (only if categories table is empty)
  seedDatabase();

}
