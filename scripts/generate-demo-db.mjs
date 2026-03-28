#!/usr/bin/env node
/**
 * Generates a demo SQLite database for CardPulse with realistic sample data.
 * Run: node scripts/generate-demo-db.mjs
 * Output: data/cardpulse.db
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "data", "cardpulse.db");

// Remove existing DB files
for (const ext of ["", "-shm", "-wal"]) {
  const f = DB_PATH + ext;
  if (fs.existsSync(f)) fs.unlinkSync(f);
}

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ── Create tables ──
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE
  );
  CREATE TABLE IF NOT EXISTS subcategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    name TEXT NOT NULL, UNIQUE(category_id, name)
  );
  CREATE TABLE IF NOT EXISTS labels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE, is_system INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE, label_name TEXT NOT NULL UNIQUE,
    bank TEXT NOT NULL, last_four TEXT,
    cycle_start INTEGER NOT NULL, cycle_end INTEGER NOT NULL,
    statement_day INTEGER NOT NULL, due_day INTEGER NOT NULL,
    credit_limit REAL, color TEXT, aliases TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL, description TEXT NOT NULL, merchant TEXT,
    transaction_date TEXT NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    subcategory_id INTEGER REFERENCES subcategories(id),
    card_id INTEGER REFERENCES cards(id),
    notes TEXT, is_recurring INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS transaction_labels (
    transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    label_id INTEGER NOT NULL REFERENCES labels(id),
    PRIMARY KEY (transaction_id, label_id)
  );
  CREATE TABLE IF NOT EXISTS keyword_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    subcategory_id INTEGER REFERENCES subcategories(id),
    label_ids TEXT, priority INTEGER NOT NULL DEFAULT 0,
    is_system INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS emis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER NOT NULL REFERENCES cards(id),
    description TEXT NOT NULL,
    original_amount REAL NOT NULL, monthly_amount REAL NOT NULL,
    total_months INTEGER NOT NULL, months_remaining INTEGER NOT NULL,
    start_date TEXT NOT NULL, end_date TEXT,
    category_id INTEGER REFERENCES categories(id),
    subcategory_id INTEGER REFERENCES subcategories(id),
    label_ids TEXT, is_active INTEGER NOT NULL DEFAULT 1,
    auto_generate INTEGER NOT NULL DEFAULT 1, last_generated TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    subcategory_id INTEGER REFERENCES subcategories(id),
    month INTEGER NOT NULL, year INTEGER NOT NULL,
    amount REAL NOT NULL,
    UNIQUE(category_id, subcategory_id, month, year)
  );
  CREATE TABLE IF NOT EXISTS cycle_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER NOT NULL REFERENCES cards(id),
    cycle_start TEXT NOT NULL, cycle_end TEXT NOT NULL,
    due_date TEXT NOT NULL, amount REAL NOT NULL,
    is_paid INTEGER NOT NULL DEFAULT 0, paid_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(card_id, cycle_start, cycle_end)
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY, value TEXT NOT NULL
  );
`);

// ── Helper: date string ──
function d(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// ── Categories & Subcategories ──
const CATS = {
  "Food & Drinks": ["Groceries", "Restaurant, Fast-Food", "Bar, Café"],
  "Shopping": ["Clothes & Shoes", "Jewels, Accessories", "Health and Beauty", "Kids", "Home, Garden", "Pets, Animals", "Electronics, Accessories", "Gifts, Joy", "Stationery, Tools", "Free Time", "Drug-store, Chemist"],
  "Housing": ["Rent", "Mortgage", "Energy, Utilities", "Services", "Maintenance, Repairs", "Property Insurance", "Laundry"],
  "Transportation": ["Public Transport", "Taxi", "Long Distance", "Business Trips"],
  "Vehicle": ["Fuel", "Parking", "Vehicle Maintenance", "Rentals", "Vehicle Insurance", "Leasing", "Toll"],
  "Life & Entertainment": ["Books, Audio, Subscriptions", "TV, Streaming", "Holiday, Trips, Hotels", "Charity, Gifts", "Alcohol, Tobacco", "Lottery, Gambling", "Cinema"],
  "Communication, PC": ["Phone, Cell Phone", "Internet", "Software, Apps, Games", "Postal Services"],
  "Financial Expenses": ["Taxes", "Insurance", "Loan, Interests", "Fines", "Credit Card Payment", "Charges, Fees", "Wire Transfer", "Buy Now Pay Later"],
  "Investments": ["Realty", "Vehicles, Shuttles", "Financial Investments", "Savings", "Collections"],
  "Income": ["Wage, Invoices", "Interests, Dividends", "Sale", "Rental Income", "Dues & Grants", "Lending, Renting", "Checks, Coupons", "Lottery, Gambling", "Refunds (Tax, Purchase)", "Child Support", "Gifts"],
  "Others": ["Missing"],
};

const catOrder = ["Food & Drinks", "Shopping", "Housing", "Transportation", "Vehicle", "Life & Entertainment", "Communication, PC", "Financial Expenses", "Investments", "Income", "Others"];

const catMap = {};
const subMap = {};

const insertCat = db.prepare("INSERT INTO categories (name) VALUES (?)");
const insertSub = db.prepare("INSERT INTO subcategories (category_id, name) VALUES (?, ?)");

db.transaction(() => {
  for (const catName of catOrder) {
    const { lastInsertRowid } = insertCat.run(catName);
    const catId = Number(lastInsertRowid);
    catMap[catName] = catId;
    subMap[catName] = {};
    for (const subName of CATS[catName]) {
      const { lastInsertRowid: subId } = insertSub.run(catId, subName);
      subMap[catName][subName] = Number(subId);
    }
  }
})();

// ── Labels ──
const LABELS = [
  "Amazon", "Bills and Subs", "Buy Now Pay Later", "Car Loan", "Celebrations",
  "Credit Card Purchase", "Food Delivery", "Groceries",
  "Hospital", "Wire Transfer", "Laundry", "Movies",
  "One Time Purchase", "Rent", "Savings",
  "Subscriptions", "Telecom", "Temu", "Utilities", "Vehicle Expenses",
  "Weekend", "Platinum Rewards Card", "Cashback Plus Card",
];

const labelMap = {};
const insertLabel = db.prepare("INSERT INTO labels (name, is_system) VALUES (?, 1)");

db.transaction(() => {
  for (const name of LABELS) {
    const { lastInsertRowid } = insertLabel.run(name);
    labelMap[name] = Number(lastInsertRowid);
  }
})();

// ── Keyword Rules (global/location-agnostic merchants) ──
const RULES = [
  // Groceries
  { kw: "whole foods", cat: "Food & Drinks", sub: "Groceries", labels: ["Groceries"] },
  { kw: "trader joes", cat: "Food & Drinks", sub: "Groceries", labels: ["Groceries"] },
  { kw: "costco", cat: "Food & Drinks", sub: "Groceries", labels: ["Groceries"] },
  { kw: "kroger", cat: "Food & Drinks", sub: "Groceries", labels: ["Groceries"] },
  { kw: "aldi", cat: "Food & Drinks", sub: "Groceries", labels: ["Groceries"] },
  { kw: "walmart grocery", cat: "Food & Drinks", sub: "Groceries", labels: ["Groceries"] },
  { kw: "target grocery", cat: "Food & Drinks", sub: "Groceries", labels: ["Groceries"] },

  // Food Delivery
  { kw: "doordash", cat: "Food & Drinks", sub: "Restaurant, Fast-Food", labels: ["Food Delivery"] },
  { kw: "uber eats", cat: "Food & Drinks", sub: "Restaurant, Fast-Food", labels: ["Food Delivery"] },
  { kw: "grubhub", cat: "Food & Drinks", sub: "Restaurant, Fast-Food", labels: ["Food Delivery"] },
  { kw: "instacart", cat: "Food & Drinks", sub: "Restaurant, Fast-Food", labels: ["Food Delivery"] },

  // Fast food
  { kw: "mcdonalds", cat: "Food & Drinks", sub: "Restaurant, Fast-Food", labels: [] },
  { kw: "chipotle", cat: "Food & Drinks", sub: "Restaurant, Fast-Food", labels: [] },
  { kw: "burger king", cat: "Food & Drinks", sub: "Restaurant, Fast-Food", labels: [] },
  { kw: "subway", cat: "Food & Drinks", sub: "Restaurant, Fast-Food", labels: [] },
  { kw: "chick-fil-a", cat: "Food & Drinks", sub: "Restaurant, Fast-Food", labels: [] },

  // Coffee
  { kw: "starbucks", cat: "Food & Drinks", sub: "Bar, Café", labels: [] },
  { kw: "dunkin", cat: "Food & Drinks", sub: "Bar, Café", labels: [] },
  { kw: "peets coffee", cat: "Food & Drinks", sub: "Bar, Café", labels: [] },
  { kw: "blue bottle", cat: "Food & Drinks", sub: "Bar, Café", labels: [] },
  { kw: "coffee", cat: "Food & Drinks", sub: "Bar, Café", labels: [] },

  // Shopping - Electronics
  { kw: "amazon", cat: "Shopping", sub: "Electronics, Accessories", labels: ["Amazon"] },
  { kw: "best buy", cat: "Shopping", sub: "Electronics, Accessories", labels: [] },
  { kw: "apple store", cat: "Shopping", sub: "Electronics, Accessories", labels: [] },
  { kw: "temu", cat: "Shopping", sub: "Electronics, Accessories", labels: ["Temu"] },

  // Shopping - Clothes
  { kw: "h&m", cat: "Shopping", sub: "Clothes & Shoes", labels: [] },
  { kw: "zara", cat: "Shopping", sub: "Clothes & Shoes", labels: [] },
  { kw: "uniqlo", cat: "Shopping", sub: "Clothes & Shoes", labels: [] },
  { kw: "nike", cat: "Shopping", sub: "Clothes & Shoes", labels: [] },
  { kw: "gap", cat: "Shopping", sub: "Clothes & Shoes", labels: [] },
  { kw: "target", cat: "Shopping", sub: "Clothes & Shoes", labels: [] },

  // Shopping - Pharmacy
  { kw: "cvs", cat: "Shopping", sub: "Drug-store, Chemist", labels: [] },
  { kw: "walgreens", cat: "Shopping", sub: "Drug-store, Chemist", labels: [] },

  // Shopping - Health
  { kw: "hospital", cat: "Shopping", sub: "Health and Beauty", labels: ["Hospital"] },
  { kw: "clinic", cat: "Shopping", sub: "Health and Beauty", labels: ["Hospital"] },
  { kw: "urgent care", cat: "Shopping", sub: "Health and Beauty", labels: ["Hospital"] },

  // Shopping - Home
  { kw: "ikea", cat: "Shopping", sub: "Home, Garden", labels: [] },
  { kw: "home depot", cat: "Shopping", sub: "Home, Garden", labels: [] },
  { kw: "wayfair", cat: "Shopping", sub: "Home, Garden", labels: [] },

  // Utilities
  { kw: "electric", cat: "Housing", sub: "Energy, Utilities", labels: ["Utilities"] },
  { kw: "power company", cat: "Housing", sub: "Energy, Utilities", labels: ["Utilities"] },
  { kw: "water bill", cat: "Housing", sub: "Energy, Utilities", labels: ["Utilities"] },

  // Laundry
  { kw: "dry cleaners", cat: "Housing", sub: "Laundry", labels: ["Laundry"] },
  { kw: "laundromat", cat: "Housing", sub: "Laundry", labels: ["Laundry"] },

  // Fuel
  { kw: "shell", cat: "Vehicle", sub: "Fuel", labels: ["Vehicle Expenses"] },
  { kw: "chevron", cat: "Vehicle", sub: "Fuel", labels: ["Vehicle Expenses"] },
  { kw: "bp", cat: "Vehicle", sub: "Fuel", labels: ["Vehicle Expenses"] },
  { kw: "exxon", cat: "Vehicle", sub: "Fuel", labels: ["Vehicle Expenses"] },

  // Toll & Parking
  { kw: "ez-pass", cat: "Vehicle", sub: "Toll", labels: ["Vehicle Expenses"] },
  { kw: "toll", cat: "Vehicle", sub: "Toll", labels: ["Vehicle Expenses"] },
  { kw: "parkmobile", cat: "Vehicle", sub: "Parking", labels: ["Vehicle Expenses"] },
  { kw: "spothero", cat: "Vehicle", sub: "Parking", labels: ["Vehicle Expenses"] },

  // Taxi/Rideshare
  { kw: "uber", cat: "Transportation", sub: "Taxi", labels: [] },
  { kw: "lyft", cat: "Transportation", sub: "Taxi", labels: [] },

  // Streaming & Subscriptions
  { kw: "netflix", cat: "Life & Entertainment", sub: "TV, Streaming", labels: ["Subscriptions", "Bills and Subs"] },
  { kw: "spotify", cat: "Life & Entertainment", sub: "Books, Audio, Subscriptions", labels: ["Subscriptions", "Bills and Subs"] },
  { kw: "apple.com/bill", cat: "Life & Entertainment", sub: "TV, Streaming", labels: ["Subscriptions", "Bills and Subs"] },
  { kw: "youtube premium", cat: "Life & Entertainment", sub: "TV, Streaming", labels: ["Subscriptions", "Bills and Subs"] },
  { kw: "disney+", cat: "Life & Entertainment", sub: "TV, Streaming", labels: ["Subscriptions", "Bills and Subs"] },
  { kw: "hbo max", cat: "Life & Entertainment", sub: "TV, Streaming", labels: ["Subscriptions", "Bills and Subs"] },
  { kw: "hulu", cat: "Life & Entertainment", sub: "TV, Streaming", labels: ["Subscriptions", "Bills and Subs"] },

  // Cinema
  { kw: "amc", cat: "Life & Entertainment", sub: "Cinema", labels: ["Movies"] },
  { kw: "regal cinema", cat: "Life & Entertainment", sub: "Cinema", labels: ["Movies"] },
  { kw: "cinemark", cat: "Life & Entertainment", sub: "Cinema", labels: ["Movies"] },

  // Travel
  { kw: "booking.com", cat: "Life & Entertainment", sub: "Holiday, Trips, Hotels", labels: [] },
  { kw: "airbnb", cat: "Life & Entertainment", sub: "Holiday, Trips, Hotels", labels: [] },
  { kw: "expedia", cat: "Life & Entertainment", sub: "Holiday, Trips, Hotels", labels: [] },

  // Telecom
  { kw: "t-mobile", cat: "Communication, PC", sub: "Phone, Cell Phone", labels: ["Telecom"] },
  { kw: "verizon", cat: "Communication, PC", sub: "Phone, Cell Phone", labels: ["Telecom"] },
  { kw: "at&t", cat: "Communication, PC", sub: "Phone, Cell Phone", labels: ["Telecom"] },

  // Software
  { kw: "github", cat: "Communication, PC", sub: "Software, Apps, Games", labels: ["Subscriptions"] },
  { kw: "openai", cat: "Communication, PC", sub: "Software, Apps, Games", labels: ["Subscriptions"] },
  { kw: "notion", cat: "Communication, PC", sub: "Software, Apps, Games", labels: ["Subscriptions"] },

  // BNPL
  { kw: "klarna", cat: "Financial Expenses", sub: "Buy Now Pay Later", labels: ["Buy Now Pay Later"] },
  { kw: "afterpay", cat: "Financial Expenses", sub: "Buy Now Pay Later", labels: ["Buy Now Pay Later"] },
  { kw: "affirm", cat: "Financial Expenses", sub: "Buy Now Pay Later", labels: ["Buy Now Pay Later"] },

  // Wire Transfer
  { kw: "western union", cat: "Financial Expenses", sub: "Wire Transfer", labels: ["Wire Transfer"] },
  { kw: "wise", cat: "Financial Expenses", sub: "Wire Transfer", labels: ["Wire Transfer"] },
  { kw: "venmo", cat: "Financial Expenses", sub: "Wire Transfer", labels: ["Wire Transfer"] },

  // Rent
  { kw: "rent", cat: "Housing", sub: "Rent", labels: ["Rent"] },
];

const insertRule = db.prepare("INSERT INTO keyword_rules (keyword, category_id, subcategory_id, label_ids, priority, is_system) VALUES (?, ?, ?, ?, 0, 1)");

db.transaction(() => {
  for (const r of RULES) {
    const cId = catMap[r.cat];
    const sId = subMap[r.cat]?.[r.sub];
    const lIds = r.labels.map(l => labelMap[l]).filter(Boolean);
    insertRule.run(r.kw, cId, sId, lIds.length ? JSON.stringify(lIds) : null);
  }
})();

// ── Cards ──
const insertCard = db.prepare(`INSERT INTO cards (name, label_name, bank, last_four, cycle_start, cycle_end, statement_day, due_day, credit_limit, color, aliases) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

db.transaction(() => {
  insertCard.run(
    "Platinum Rewards Card", "Platinum Rewards Card", "Demo Bank A", "4521",
    1, 31, 31, 25, 15000, "#6366f1",
    JSON.stringify(["platinum", "platinum rewards", "demo bank a", "rewards card"])
  );
  insertCard.run(
    "Cashback Plus Card", "Cashback Plus Card", "Demo Bank B", "8734",
    10, 9, 9, 3, 25000, "#f59e0b",
    JSON.stringify(["cashback", "cashback plus", "demo bank b", "plus card"])
  );
})();

const PLATINUM = 1;
const CASHBACK = 2;

// ── Settings ──
const insertSetting = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
db.transaction(() => {
  insertSetting.run("currency", "USD");
  insertSetting.run("app_name", "CardPulse");
  insertSetting.run("date_format", "DD/MM");
  insertSetting.run("number_format", "comma_period");
  insertSetting.run("pin_enabled", "false");
  insertSetting.run("theme", "sage");
  insertSetting.run("color_mode", "dark");
  insertSetting.run("first_run_complete", "true");
})();

// ── Transactions ──
const insertTxn = db.prepare(`INSERT INTO transactions (amount, description, merchant, transaction_date, category_id, subcategory_id, card_id, notes, is_recurring, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime(?), datetime(?))`);
const insertTxnLabel = db.prepare("INSERT INTO transaction_labels (transaction_id, label_id) VALUES (?, ?)");

function sub(cat, subName) {
  return { catId: catMap[cat], subId: subMap[cat][subName] };
}

const TXN_DATA = [
  // ═══ DECEMBER 2025 ═══
  // Groceries
  [287.50, "Weekly groceries whole foods", "Whole Foods", d(2025,12,2), "Food & Drinks", "Groceries", PLATINUM, ["Groceries"], 0, null],
  [145.30, "Fruits and vegetables trader joes", "Trader Joes", d(2025,12,8), "Food & Drinks", "Groceries", CASHBACK, ["Groceries"], 0, null],
  [312.00, "Monthly grocery run costco", "Costco", d(2025,12,15), "Food & Drinks", "Groceries", PLATINUM, ["Groceries"], 0, null],
  [89.75, "Quick grocery stop aldi", "Aldi", d(2025,12,22), "Food & Drinks", "Groceries", CASHBACK, ["Groceries"], 0, null],
  [198.40, "End of month groceries kroger", "Kroger", d(2025,12,28), "Food & Drinks", "Groceries", PLATINUM, ["Groceries"], 0, null],

  // Dining & Delivery
  [67.00, "Dinner delivery doordash", "DoorDash", d(2025,12,3), "Food & Drinks", "Restaurant, Fast-Food", CASHBACK, ["Food Delivery"], 0, null],
  [42.50, "Lunch mcdonalds", "McDonalds", d(2025,12,7), "Food & Drinks", "Restaurant, Fast-Food", PLATINUM, [], 0, null],
  [85.00, "Family dinner uber eats", "Uber Eats", d(2025,12,14), "Food & Drinks", "Restaurant, Fast-Food", CASHBACK, ["Food Delivery", "Weekend"], 0, null],
  [35.00, "Chipotle bowl", "Chipotle", d(2025,12,20), "Food & Drinks", "Restaurant, Fast-Food", PLATINUM, [], 0, null],
  [95.00, "Christmas dinner delivery grubhub", "GrubHub", d(2025,12,25), "Food & Drinks", "Restaurant, Fast-Food", CASHBACK, ["Food Delivery", "Celebrations"], 0, null],

  // Coffee
  [27.00, "Morning coffee starbucks", "Starbucks", d(2025,12,4), "Food & Drinks", "Bar, Café", PLATINUM, [], 0, null],
  [22.00, "Dunkin breakfast combo", "Dunkin", d(2025,12,11), "Food & Drinks", "Bar, Café", CASHBACK, [], 0, null],
  [31.50, "Weekend coffee blue bottle", "Blue Bottle", d(2025,12,19), "Food & Drinks", "Bar, Café", PLATINUM, ["Weekend"], 0, null],

  // Fuel & Vehicle
  [55.00, "Fuel shell station", "Shell", d(2025,12,1), "Vehicle", "Fuel", PLATINUM, ["Vehicle Expenses"], 0, null],
  [62.00, "Full tank chevron", "Chevron", d(2025,12,14), "Vehicle", "Fuel", PLATINUM, ["Vehicle Expenses"], 0, null],
  [48.00, "Fuel bp highway", "BP", d(2025,12,27), "Vehicle", "Fuel", CASHBACK, ["Vehicle Expenses"], 0, null],
  [35.00, "EZ-Pass recharge", "EZ-Pass", d(2025,12,5), "Vehicle", "Toll", PLATINUM, ["Vehicle Expenses"], 1, null],
  [12.00, "ParkMobile downtown", "ParkMobile", d(2025,12,12), "Vehicle", "Parking", CASHBACK, ["Vehicle Expenses"], 0, null],

  // Subscriptions (recurring)
  [15.49, "Netflix monthly", "Netflix", d(2025,12,1), "Life & Entertainment", "TV, Streaming", PLATINUM, ["Subscriptions", "Bills and Subs"], 1, null],
  [10.99, "Spotify premium", "Spotify", d(2025,12,1), "Life & Entertainment", "Books, Audio, Subscriptions", PLATINUM, ["Subscriptions", "Bills and Subs"], 1, null],
  [13.99, "YouTube premium family", "YouTube Premium", d(2025,12,5), "Life & Entertainment", "TV, Streaming", CASHBACK, ["Subscriptions", "Bills and Subs"], 1, null],
  [7.99, "Disney+ monthly", "Disney+", d(2025,12,10), "Life & Entertainment", "TV, Streaming", CASHBACK, ["Subscriptions", "Bills and Subs"], 1, null],
  [15.99, "HBO Max monthly", "HBO Max", d(2025,12,10), "Life & Entertainment", "TV, Streaming", PLATINUM, ["Subscriptions", "Bills and Subs"], 1, null],

  // Telecom
  [75.00, "T-Mobile phone plan", "T-Mobile", d(2025,12,6), "Communication, PC", "Phone, Cell Phone", CASHBACK, ["Telecom", "Bills and Subs"], 1, null],

  // Utilities
  [185.00, "Electric company monthly", "Electric Co", d(2025,12,10), "Housing", "Energy, Utilities", PLATINUM, ["Utilities", "Bills and Subs"], 1, null],

  // Housing
  [2200.00, "Monthly rent dec", "Rent", d(2025,12,1), "Housing", "Rent", CASHBACK, ["Rent"], 1, "Monthly apartment rent"],

  // Shopping
  [349.00, "Amazon echo dot speaker", "Amazon", d(2025,12,8), "Shopping", "Electronics, Accessories", CASHBACK, ["Amazon"], 0, "Smart speaker for kitchen"],
  [189.00, "Zara winter jacket", "Zara", d(2025,12,13), "Shopping", "Clothes & Shoes", PLATINUM, [], 0, null],
  [45.00, "CVS medicines", "CVS", d(2025,12,16), "Shopping", "Drug-store, Chemist", PLATINUM, [], 0, null],
  [650.00, "IKEA desk and chair", "IKEA", d(2025,12,20), "Shopping", "Home, Garden", CASHBACK, ["One Time Purchase"], 0, "Home office upgrade"],

  // Taxi
  [45.00, "Uber to airport", "Uber", d(2025,12,23), "Transportation", "Taxi", PLATINUM, [], 0, null],
  [28.00, "Lyft to mall", "Lyft", d(2025,12,26), "Transportation", "Taxi", CASHBACK, [], 0, null],

  // Entertainment
  [65.00, "AMC cinema tickets", "AMC", d(2025,12,27), "Life & Entertainment", "Cinema", CASHBACK, ["Movies", "Weekend"], 0, "2 tickets + popcorn"],

  // Laundry
  [35.00, "Dry cleaners pickup", "Dry Cleaners", d(2025,12,9), "Housing", "Laundry", PLATINUM, ["Laundry"], 1, null],

  // Software
  [20.00, "OpenAI ChatGPT Plus", "OpenAI", d(2025,12,15), "Communication, PC", "Software, Apps, Games", CASHBACK, ["Subscriptions"], 1, null],
  [10.00, "Notion team plan", "Notion", d(2025,12,15), "Communication, PC", "Software, Apps, Games", PLATINUM, ["Subscriptions"], 1, null],

  // ═══ JANUARY 2026 ═══
  // Groceries
  [320.00, "New year grocery whole foods", "Whole Foods", d(2026,1,2), "Food & Drinks", "Groceries", PLATINUM, ["Groceries"], 0, null],
  [156.80, "Trader joes weekly", "Trader Joes", d(2026,1,9), "Food & Drinks", "Groceries", CASHBACK, ["Groceries"], 0, null],
  [275.00, "Costco mid month haul", "Costco", d(2026,1,16), "Food & Drinks", "Groceries", PLATINUM, ["Groceries"], 0, null],
  [210.00, "Aldi organic groceries", "Aldi", d(2026,1,23), "Food & Drinks", "Groceries", CASHBACK, ["Groceries"], 0, null],
  [143.50, "Kroger essentials", "Kroger", d(2026,1,30), "Food & Drinks", "Groceries", PLATINUM, ["Groceries"], 0, null],

  // Dining & Delivery
  [78.00, "DoorDash new year dinner", "DoorDash", d(2026,1,1), "Food & Drinks", "Restaurant, Fast-Food", CASHBACK, ["Food Delivery", "Celebrations"], 0, null],
  [55.00, "Uber eats lunch", "Uber Eats", d(2026,1,10), "Food & Drinks", "Restaurant, Fast-Food", PLATINUM, ["Food Delivery"], 0, null],
  [48.00, "Burger king combo", "Burger King", d(2026,1,15), "Food & Drinks", "Restaurant, Fast-Food", CASHBACK, [], 0, null],
  [72.00, "GrubHub weekend feast", "GrubHub", d(2026,1,18), "Food & Drinks", "Restaurant, Fast-Food", PLATINUM, ["Food Delivery", "Weekend"], 0, null],
  [38.50, "Subway lunch deal", "Subway", d(2026,1,24), "Food & Drinks", "Restaurant, Fast-Food", CASHBACK, [], 0, null],

  // Coffee
  [25.00, "Starbucks latte", "Starbucks", d(2026,1,5), "Food & Drinks", "Bar, Café", PLATINUM, [], 0, null],
  [18.00, "Dunkin donuts coffee", "Dunkin", d(2026,1,14), "Food & Drinks", "Bar, Café", CASHBACK, [], 0, null],
  [19.00, "Peets coffee americano", "Peets Coffee", d(2026,1,22), "Food & Drinks", "Bar, Café", PLATINUM, [], 0, null],
  [33.00, "Blue bottle reserve", "Blue Bottle", d(2026,1,28), "Food & Drinks", "Bar, Café", CASHBACK, ["Weekend"], 0, null],

  // Fuel
  [58.00, "Shell full tank", "Shell", d(2026,1,3), "Vehicle", "Fuel", PLATINUM, ["Vehicle Expenses"], 0, null],
  [52.00, "Chevron fuel", "Chevron", d(2026,1,17), "Vehicle", "Fuel", CASHBACK, ["Vehicle Expenses"], 0, null],
  [61.00, "Exxon premium fuel", "Exxon", d(2026,1,29), "Vehicle", "Fuel", PLATINUM, ["Vehicle Expenses"], 0, null],
  [35.00, "EZ-Pass recharge jan", "EZ-Pass", d(2026,1,5), "Vehicle", "Toll", PLATINUM, ["Vehicle Expenses"], 1, null],
  [8.00, "SpotHero parking downtown", "SpotHero", d(2026,1,18), "Vehicle", "Parking", CASHBACK, ["Vehicle Expenses", "Weekend"], 0, null],

  // Subscriptions
  [15.49, "Netflix monthly jan", "Netflix", d(2026,1,1), "Life & Entertainment", "TV, Streaming", PLATINUM, ["Subscriptions", "Bills and Subs"], 1, null],
  [10.99, "Spotify premium jan", "Spotify", d(2026,1,1), "Life & Entertainment", "Books, Audio, Subscriptions", PLATINUM, ["Subscriptions", "Bills and Subs"], 1, null],
  [13.99, "YouTube premium jan", "YouTube Premium", d(2026,1,5), "Life & Entertainment", "TV, Streaming", CASHBACK, ["Subscriptions", "Bills and Subs"], 1, null],
  [7.99, "Disney+ jan", "Disney+", d(2026,1,10), "Life & Entertainment", "TV, Streaming", CASHBACK, ["Subscriptions", "Bills and Subs"], 1, null],
  [15.99, "HBO Max jan", "HBO Max", d(2026,1,10), "Life & Entertainment", "TV, Streaming", PLATINUM, ["Subscriptions", "Bills and Subs"], 1, null],

  // Telecom & Utilities
  [75.00, "T-Mobile jan", "T-Mobile", d(2026,1,6), "Communication, PC", "Phone, Cell Phone", CASHBACK, ["Telecom", "Bills and Subs"], 1, null],
  [195.00, "Electric company jan", "Electric Co", d(2026,1,12), "Housing", "Energy, Utilities", PLATINUM, ["Utilities", "Bills and Subs"], 1, null],

  // Rent
  [2200.00, "Monthly rent jan", "Rent", d(2026,1,1), "Housing", "Rent", CASHBACK, ["Rent"], 1, null],

  // Shopping
  [299.00, "Amazon AirPods Pro", "Amazon", d(2026,1,7), "Shopping", "Electronics, Accessories", CASHBACK, ["Amazon"], 0, null],
  [145.00, "H&M winter sale haul", "H&M", d(2026,1,11), "Shopping", "Clothes & Shoes", PLATINUM, [], 0, "Winter clearance sale"],
  [220.00, "Best Buy monitor cable", "Best Buy", d(2026,1,20), "Shopping", "Electronics, Accessories", PLATINUM, [], 0, null],
  [150.00, "Urgent care visit", "Urgent Care", d(2026,1,14), "Shopping", "Health and Beauty", CASHBACK, ["Hospital"], 0, null],
  [38.00, "Walgreens vitamins", "Walgreens", d(2026,1,25), "Shopping", "Drug-store, Chemist", PLATINUM, [], 0, null],

  // Taxi
  [32.00, "Uber to office", "Uber", d(2026,1,6), "Transportation", "Taxi", CASHBACK, [], 0, null],
  [42.00, "Lyft to airport", "Lyft", d(2026,1,19), "Transportation", "Taxi", PLATINUM, [], 0, null],

  // Laundry & Software
  [35.00, "Dry cleaners jan", "Dry Cleaners", d(2026,1,8), "Housing", "Laundry", PLATINUM, ["Laundry"], 1, null],
  [20.00, "OpenAI jan", "OpenAI", d(2026,1,15), "Communication, PC", "Software, Apps, Games", CASHBACK, ["Subscriptions"], 1, null],
  [10.00, "Notion jan", "Notion", d(2026,1,15), "Communication, PC", "Software, Apps, Games", PLATINUM, ["Subscriptions"], 1, null],

  // Cinema
  [55.00, "AMC cinema dune", "AMC", d(2026,1,31), "Life & Entertainment", "Cinema", PLATINUM, ["Movies", "Weekend"], 0, null],

  // ═══ FEBRUARY 2026 ═══
  // Groceries
  [295.00, "Whole Foods weekly shop", "Whole Foods", d(2026,2,1), "Food & Drinks", "Groceries", PLATINUM, ["Groceries"], 0, null],
  [178.50, "Trader Joes valentines", "Trader Joes", d(2026,2,8), "Food & Drinks", "Groceries", CASHBACK, ["Groceries"], 0, null],
  [340.00, "Costco bulk run", "Costco", d(2026,2,14), "Food & Drinks", "Groceries", PLATINUM, ["Groceries"], 0, null],
  [125.00, "Aldi budget groceries", "Aldi", d(2026,2,21), "Food & Drinks", "Groceries", CASHBACK, ["Groceries"], 0, null],
  [230.00, "Kroger end of feb", "Kroger", d(2026,2,27), "Food & Drinks", "Groceries", PLATINUM, ["Groceries"], 0, null],

  // Dining
  [95.00, "Valentines dinner uber eats", "Uber Eats", d(2026,2,14), "Food & Drinks", "Restaurant, Fast-Food", CASHBACK, ["Food Delivery", "Celebrations"], 0, "Valentine's day dinner"],
  [62.00, "DoorDash weekend order", "DoorDash", d(2026,2,7), "Food & Drinks", "Restaurant, Fast-Food", PLATINUM, ["Food Delivery", "Weekend"], 0, null],
  [45.00, "Chick-fil-A lunch", "Chick-fil-A", d(2026,2,18), "Food & Drinks", "Restaurant, Fast-Food", CASHBACK, [], 0, null],
  [68.00, "GrubHub family order", "GrubHub", d(2026,2,22), "Food & Drinks", "Restaurant, Fast-Food", PLATINUM, ["Food Delivery"], 0, null],

  // Coffee
  [29.00, "Starbucks caramel frap", "Starbucks", d(2026,2,3), "Food & Drinks", "Bar, Café", CASHBACK, [], 0, null],
  [24.00, "Dunkin iced coffee", "Dunkin", d(2026,2,16), "Food & Drinks", "Bar, Café", PLATINUM, [], 0, null],

  // Fuel
  [57.00, "Shell fuel feb", "Shell", d(2026,2,2), "Vehicle", "Fuel", PLATINUM, ["Vehicle Expenses"], 0, null],
  [64.00, "BP premium", "BP", d(2026,2,16), "Vehicle", "Fuel", CASHBACK, ["Vehicle Expenses"], 0, null],
  [35.00, "EZ-Pass recharge feb", "EZ-Pass", d(2026,2,5), "Vehicle", "Toll", PLATINUM, ["Vehicle Expenses"], 1, null],

  // Subscriptions
  [15.49, "Netflix feb", "Netflix", d(2026,2,1), "Life & Entertainment", "TV, Streaming", PLATINUM, ["Subscriptions", "Bills and Subs"], 1, null],
  [10.99, "Spotify feb", "Spotify", d(2026,2,1), "Life & Entertainment", "Books, Audio, Subscriptions", PLATINUM, ["Subscriptions", "Bills and Subs"], 1, null],
  [13.99, "YouTube premium feb", "YouTube Premium", d(2026,2,5), "Life & Entertainment", "TV, Streaming", CASHBACK, ["Subscriptions", "Bills and Subs"], 1, null],
  [7.99, "Disney+ feb", "Disney+", d(2026,2,10), "Life & Entertainment", "TV, Streaming", CASHBACK, ["Subscriptions", "Bills and Subs"], 1, null],
  [15.99, "HBO Max feb", "HBO Max", d(2026,2,10), "Life & Entertainment", "TV, Streaming", PLATINUM, ["Subscriptions", "Bills and Subs"], 1, null],

  // Telecom & Utilities & Rent
  [75.00, "T-Mobile feb", "T-Mobile", d(2026,2,6), "Communication, PC", "Phone, Cell Phone", CASHBACK, ["Telecom", "Bills and Subs"], 1, null],
  [175.00, "Electric company feb", "Electric Co", d(2026,2,11), "Housing", "Energy, Utilities", PLATINUM, ["Utilities", "Bills and Subs"], 1, null],
  [2200.00, "Monthly rent feb", "Rent", d(2026,2,1), "Housing", "Rent", CASHBACK, ["Rent"], 1, null],

  // Shopping
  [450.00, "Amazon valentine gift watch", "Amazon", d(2026,2,12), "Shopping", "Electronics, Accessories", CASHBACK, ["Amazon", "Celebrations"], 0, "Valentine's gift"],
  [180.00, "Uniqlo new collection", "Uniqlo", d(2026,2,6), "Shopping", "Clothes & Shoes", PLATINUM, [], 0, null],
  [120.00, "Home Depot tools", "Home Depot", d(2026,2,19), "Shopping", "Home, Garden", CASHBACK, [], 0, null],
  [55.00, "Walgreens prescriptions", "Walgreens", d(2026,2,24), "Shopping", "Drug-store, Chemist", PLATINUM, [], 0, null],

  // Taxi
  [38.00, "Uber downtown", "Uber", d(2026,2,8), "Transportation", "Taxi", PLATINUM, [], 0, null],

  // Laundry & Software
  [35.00, "Dry cleaners feb", "Dry Cleaners", d(2026,2,9), "Housing", "Laundry", PLATINUM, ["Laundry"], 1, null],
  [20.00, "OpenAI feb", "OpenAI", d(2026,2,15), "Communication, PC", "Software, Apps, Games", CASHBACK, ["Subscriptions"], 1, null],
  [10.00, "Notion feb", "Notion", d(2026,2,15), "Communication, PC", "Software, Apps, Games", PLATINUM, ["Subscriptions"], 1, null],

  // BNPL
  [150.00, "Klarna installment", "Klarna", d(2026,2,20), "Financial Expenses", "Buy Now Pay Later", CASHBACK, ["Buy Now Pay Later"], 0, null],

  // ═══ MARCH 2026 ═══
  // Groceries
  [310.00, "Whole Foods march shop", "Whole Foods", d(2026,3,1), "Food & Drinks", "Groceries", PLATINUM, ["Groceries"], 0, null],
  [168.00, "Trader Joes weekly basics", "Trader Joes", d(2026,3,7), "Food & Drinks", "Groceries", CASHBACK, ["Groceries"], 0, null],
  [290.00, "Costco organic haul", "Costco", d(2026,3,14), "Food & Drinks", "Groceries", PLATINUM, ["Groceries"], 0, null],
  [135.00, "Aldi mid month", "Aldi", d(2026,3,18), "Food & Drinks", "Groceries", CASHBACK, ["Groceries"], 0, null],
  [255.00, "Whole Foods weekend shop", "Whole Foods", d(2026,3,22), "Food & Drinks", "Groceries", PLATINUM, ["Groceries"], 0, null],
  [195.00, "Kroger end of month", "Kroger", d(2026,3,27), "Food & Drinks", "Groceries", CASHBACK, ["Groceries"], 0, null],

  // Dining
  [72.00, "DoorDash lunch order", "DoorDash", d(2026,3,3), "Food & Drinks", "Restaurant, Fast-Food", CASHBACK, ["Food Delivery"], 0, null],
  [58.00, "Uber Eats sushi night", "Uber Eats", d(2026,3,8), "Food & Drinks", "Restaurant, Fast-Food", PLATINUM, ["Food Delivery", "Weekend"], 0, null],
  [43.00, "Chipotle family order", "Chipotle", d(2026,3,15), "Food & Drinks", "Restaurant, Fast-Food", CASHBACK, [], 0, null],
  [85.00, "GrubHub friday feast", "GrubHub", d(2026,3,21), "Food & Drinks", "Restaurant, Fast-Food", PLATINUM, ["Food Delivery", "Weekend"], 0, null],
  [36.00, "Subway fresh fit", "Subway", d(2026,3,25), "Food & Drinks", "Restaurant, Fast-Food", CASHBACK, [], 0, null],

  // Coffee
  [26.00, "Starbucks cold brew", "Starbucks", d(2026,3,2), "Food & Drinks", "Bar, Café", PLATINUM, [], 0, null],
  [22.00, "Dunkin mocha", "Dunkin", d(2026,3,10), "Food & Drinks", "Bar, Café", CASHBACK, [], 0, null],
  [23.00, "Peets flat white", "Peets Coffee", d(2026,3,17), "Food & Drinks", "Bar, Café", PLATINUM, [], 0, null],
  [35.00, "Blue Bottle weekend brunch", "Blue Bottle", d(2026,3,24), "Food & Drinks", "Bar, Café", CASHBACK, ["Weekend"], 0, null],

  // Fuel
  [59.00, "Shell march fuel", "Shell", d(2026,3,1), "Vehicle", "Fuel", PLATINUM, ["Vehicle Expenses"], 0, null],
  [54.00, "BP march", "BP", d(2026,3,13), "Vehicle", "Fuel", CASHBACK, ["Vehicle Expenses"], 0, null],
  [63.00, "Exxon highway refuel", "Exxon", d(2026,3,25), "Vehicle", "Fuel", PLATINUM, ["Vehicle Expenses"], 0, null],
  [35.00, "EZ-Pass march", "EZ-Pass", d(2026,3,5), "Vehicle", "Toll", PLATINUM, ["Vehicle Expenses"], 1, null],
  [10.00, "ParkMobile downtown", "ParkMobile", d(2026,3,15), "Vehicle", "Parking", CASHBACK, ["Vehicle Expenses"], 0, null],

  // Subscriptions
  [15.49, "Netflix march", "Netflix", d(2026,3,1), "Life & Entertainment", "TV, Streaming", PLATINUM, ["Subscriptions", "Bills and Subs"], 1, null],
  [10.99, "Spotify march", "Spotify", d(2026,3,1), "Life & Entertainment", "Books, Audio, Subscriptions", PLATINUM, ["Subscriptions", "Bills and Subs"], 1, null],
  [13.99, "YouTube premium march", "YouTube Premium", d(2026,3,5), "Life & Entertainment", "TV, Streaming", CASHBACK, ["Subscriptions", "Bills and Subs"], 1, null],
  [7.99, "Disney+ march", "Disney+", d(2026,3,10), "Life & Entertainment", "TV, Streaming", CASHBACK, ["Subscriptions", "Bills and Subs"], 1, null],
  [15.99, "HBO Max march", "HBO Max", d(2026,3,10), "Life & Entertainment", "TV, Streaming", PLATINUM, ["Subscriptions", "Bills and Subs"], 1, null],

  // Telecom & Utilities & Rent
  [75.00, "T-Mobile march", "T-Mobile", d(2026,3,6), "Communication, PC", "Phone, Cell Phone", CASHBACK, ["Telecom", "Bills and Subs"], 1, null],
  [190.00, "Electric company march", "Electric Co", d(2026,3,10), "Housing", "Energy, Utilities", PLATINUM, ["Utilities", "Bills and Subs"], 1, null],
  [2200.00, "Monthly rent march", "Rent", d(2026,3,1), "Housing", "Rent", CASHBACK, ["Rent"], 1, null],

  // Shopping
  [899.00, "Amazon MacBook charger and accessories", "Amazon", d(2026,3,5), "Shopping", "Electronics, Accessories", CASHBACK, ["Amazon"], 0, null],
  [125.00, "Nike spring collection", "Nike", d(2026,3,12), "Shopping", "Clothes & Shoes", PLATINUM, [], 0, null],
  [180.00, "Wayfair cushions and decor", "Wayfair", d(2026,3,19), "Shopping", "Home, Garden", CASHBACK, [], 0, null],
  [250.00, "Annual health checkup", "Clinic", d(2026,3,22), "Shopping", "Health and Beauty", PLATINUM, ["Hospital"], 0, "Annual health screening"],
  [42.00, "CVS vitamins", "CVS", d(2026,3,26), "Shopping", "Drug-store, Chemist", CASHBACK, [], 0, null],

  // Taxi
  [35.00, "Uber to meeting downtown", "Uber", d(2026,3,4), "Transportation", "Taxi", PLATINUM, [], 0, null],
  [28.00, "Lyft to mall", "Lyft", d(2026,3,16), "Transportation", "Taxi", CASHBACK, [], 0, null],
  [48.00, "Uber airport pickup", "Uber", d(2026,3,23), "Transportation", "Taxi", PLATINUM, [], 0, null],

  // Laundry & Software
  [35.00, "Dry cleaners march", "Dry Cleaners", d(2026,3,9), "Housing", "Laundry", PLATINUM, ["Laundry"], 1, null],
  [20.00, "OpenAI march", "OpenAI", d(2026,3,15), "Communication, PC", "Software, Apps, Games", CASHBACK, ["Subscriptions"], 1, null],
  [10.00, "Notion march", "Notion", d(2026,3,15), "Communication, PC", "Software, Apps, Games", PLATINUM, ["Subscriptions"], 1, null],
  [10.00, "GitHub copilot", "GitHub", d(2026,3,15), "Communication, PC", "Software, Apps, Games", CASHBACK, ["Subscriptions"], 1, null],

  // Cinema & Entertainment
  [60.00, "AMC cinema IMAX", "AMC", d(2026,3,14), "Life & Entertainment", "Cinema", CASHBACK, ["Movies", "Weekend"], 0, null],
  [450.00, "Airbnb weekend getaway", "Airbnb", d(2026,3,20), "Life & Entertainment", "Holiday, Trips, Hotels", PLATINUM, ["Weekend"], 0, "Weekend trip upstate"],

  // BNPL
  [150.00, "Klarna installment march", "Klarna", d(2026,3,20), "Financial Expenses", "Buy Now Pay Later", CASHBACK, ["Buy Now Pay Later"], 0, null],

  // Wire Transfer
  [500.00, "Wise international transfer", "Wise", d(2026,3,5), "Financial Expenses", "Wire Transfer", PLATINUM, ["Wire Transfer"], 0, null],
];

const insertTxnTx = db.transaction((rows) => {
  for (const [amount, desc, merchant, date, catName, subName, cardId, lbls, isRec, notes] of rows) {
    const { catId, subId } = sub(catName, subName);
    const ts = date + "T12:00:00.000Z";
    const result = insertTxn.run(amount, desc, merchant, date, catId, subId, cardId, notes, isRec, ts, ts);
    const tId = Number(result.lastInsertRowid);
    for (const lbl of lbls) {
      const lId = labelMap[lbl];
      if (lId) insertTxnLabel.run(tId, lId);
    }
  }
});

insertTxnTx(TXN_DATA);

// ── EMIs ──
const insertEmi = db.prepare(`INSERT INTO emis (card_id, description, original_amount, monthly_amount, total_months, months_remaining, start_date, end_date, category_id, subcategory_id, label_ids, is_active, auto_generate, last_generated, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

db.transaction(() => {
  // MacBook Pro EMI on Cashback card - 12 months, started Oct 2025
  const laptopCat = sub("Shopping", "Electronics, Accessories");
  insertEmi.run(
    CASHBACK, "MacBook Pro 14-inch M3", 2399.00, 199.92, 12, 6,
    d(2025,10,1), d(2026,9,30),
    laptopCat.catId, laptopCat.subId, null,
    1, 1, d(2026,3,1), "0% APR financing from Apple Store"
  );

  // iPhone EMI on Platinum card - 6 months, started Jan 2026
  const phoneCat = sub("Shopping", "Electronics, Accessories");
  insertEmi.run(
    PLATINUM, "iPhone 16 Pro Max", 1199.00, 199.83, 6, 4,
    d(2026,1,1), d(2026,6,30),
    phoneCat.catId, phoneCat.subId, null,
    1, 1, d(2026,3,1), "0% installment plan"
  );

  // Car loan EMI on Cashback card - 48 months
  const carCat = sub("Vehicle", "Leasing");
  insertEmi.run(
    CASHBACK, "Car Loan - Honda Civic 2024", 28000.00, 583.33, 48, 38,
    d(2025,2,1), d(2029,1,31),
    carCat.catId, carCat.subId, JSON.stringify([labelMap["Car Loan"]]),
    1, 1, d(2026,3,1), "Auto loan 4.9% APR"
  );
})();

// ── Cycle Payments (past cycles marked as paid) ──
const insertCyclePayment = db.prepare(`INSERT INTO cycle_payments (card_id, cycle_start, cycle_end, due_date, amount, is_paid, paid_at) VALUES (?, ?, ?, ?, ?, ?, ?)`);

db.transaction(() => {
  // Platinum (1st-31st cycle, due 25th next month)
  insertCyclePayment.run(PLATINUM, d(2025,12,1), d(2025,12,31), d(2026,1,25), 1850.00, 1, d(2026,1,23) + "T10:00:00.000Z");
  insertCyclePayment.run(PLATINUM, d(2026,1,1), d(2026,1,31), d(2026,2,25), 2120.00, 1, d(2026,2,24) + "T09:30:00.000Z");
  insertCyclePayment.run(PLATINUM, d(2026,2,1), d(2026,2,28), d(2026,3,25), 1980.00, 1, d(2026,3,22) + "T14:00:00.000Z");

  // Cashback (10th-9th cycle, due 3rd next month)
  insertCyclePayment.run(CASHBACK, d(2025,12,10), d(2026,1,9), d(2026,2,3), 3250.00, 1, d(2026,2,2) + "T11:00:00.000Z");
  insertCyclePayment.run(CASHBACK, d(2026,1,10), d(2026,2,9), d(2026,3,3), 2890.00, 1, d(2026,3,1) + "T16:00:00.000Z");
})();

// ── Budgets (monthly budgets for key categories) ──
const insertBudget = db.prepare("INSERT INTO budgets (category_id, subcategory_id, month, year, amount) VALUES (?, ?, ?, ?, ?)");

db.transaction(() => {
  for (const m of [1, 2, 3]) {
    insertBudget.run(catMap["Food & Drinks"], null, m, 2026, 1500);
    insertBudget.run(catMap["Shopping"], null, m, 2026, 1500);
    insertBudget.run(catMap["Vehicle"], null, m, 2026, 300);
    insertBudget.run(catMap["Life & Entertainment"], null, m, 2026, 300);
    insertBudget.run(catMap["Communication, PC"], null, m, 2026, 200);
  }
})();

db.close();

const stats = fs.statSync(DB_PATH);
console.log(`\n✅ Demo database created: ${DB_PATH}`);
console.log(`   Size: ${(stats.size / 1024).toFixed(1)} KB`);
console.log(`   Transactions: ${TXN_DATA.length}`);
console.log(`   Cards: 2 (Platinum Rewards, Cashback Plus)`);
console.log(`   EMIs: 3 (MacBook, iPhone, Car Loan)`);
console.log(`   Months: Dec 2025 — Mar 2026`);
console.log(`   Currency: USD | PIN: disabled | Theme: sage/dark\n`);
