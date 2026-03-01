import { sqliteTable, text, integer, real, primaryKey, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const cards = sqliteTable("cards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  labelName: text("label_name").notNull().unique(),
  bank: text("bank").notNull(),
  lastFour: text("last_four"),
  cycleStart: integer("cycle_start").notNull(),
  cycleEnd: integer("cycle_end").notNull(),
  statementDay: integer("statement_day").notNull(),
  dueDay: integer("due_day").notNull(),
  creditLimit: real("credit_limit"),
  color: text("color"),
  aliases: text("aliases"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
});

export const subcategories = sqliteTable("subcategories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  name: text("name").notNull(),
}, (table) => ({
  categoryNameUnique: uniqueIndex("subcategories_category_name_unique").on(table.categoryId, table.name),
}));

export const labels = sqliteTable("labels", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  isSystem: integer("is_system").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  amount: real("amount").notNull(),
  description: text("description").notNull(),
  merchant: text("merchant"),
  transactionDate: text("transaction_date").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  subcategoryId: integer("subcategory_id").references(() => subcategories.id),
  cardId: integer("card_id").references(() => cards.id),
  notes: text("notes"),
  isRecurring: integer("is_recurring").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const transactionLabels = sqliteTable("transaction_labels", {
  transactionId: integer("transaction_id").notNull().references(() => transactions.id, { onDelete: "cascade" }),
  labelId: integer("label_id").notNull().references(() => labels.id),
}, (table) => ({
  pk: primaryKey({ columns: [table.transactionId, table.labelId] }),
}));

export const keywordRules = sqliteTable("keyword_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  keyword: text("keyword").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  subcategoryId: integer("subcategory_id").references(() => subcategories.id),
  labelIds: text("label_ids"),
  priority: integer("priority").notNull().default(0),
  isSystem: integer("is_system").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const emis = sqliteTable("emis", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cardId: integer("card_id").notNull().references(() => cards.id),
  description: text("description").notNull(),
  originalAmount: real("original_amount").notNull(),
  monthlyAmount: real("monthly_amount").notNull(),
  totalMonths: integer("total_months").notNull(),
  monthsRemaining: integer("months_remaining").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  categoryId: integer("category_id").references(() => categories.id),
  subcategoryId: integer("subcategory_id").references(() => subcategories.id),
  labelIds: text("label_ids"),
  isActive: integer("is_active").notNull().default(1),
  autoGenerate: integer("auto_generate").notNull().default(1),
  lastGenerated: text("last_generated"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const budgets = sqliteTable("budgets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  subcategoryId: integer("subcategory_id").references(() => subcategories.id),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  amount: real("amount").notNull(),
}, (table) => ({
  budgetUnique: uniqueIndex("budgets_unique").on(table.categoryId, table.subcategoryId, table.month, table.year),
}));

export const cyclePayments = sqliteTable("cycle_payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cardId: integer("card_id").notNull().references(() => cards.id),
  cycleStart: text("cycle_start").notNull(),
  cycleEnd: text("cycle_end").notNull(),
  dueDate: text("due_date").notNull(),
  amount: real("amount").notNull(),
  isPaid: integer("is_paid").notNull().default(0),
  paidAt: text("paid_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
}, (table) => ({
  cycleUnique: uniqueIndex("cycle_payments_card_cycle").on(table.cardId, table.cycleStart, table.cycleEnd),
}));

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
