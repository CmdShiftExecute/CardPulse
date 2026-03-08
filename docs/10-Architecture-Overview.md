# 🏗️ 10: Architecture Overview

> Technical deep dive into CardPulse's architecture — stack, project structure, database schema, API routes, NLP pipeline, theming system, and billing cycle math.

---

## 📑 Table of Contents

- 🧰 [Tech Stack](#-tech-stack)
- 📁 [Project Structure](#-project-structure)
- 🗃️ [Database Schema](#️-database-schema)
- 🌐 [API Route Map](#-api-route-map)
- 🧠 [NLP Pipeline Architecture](#-nlp-pipeline-architecture)
- 🎨 [Theme System Architecture](#-theme-system-architecture)
- 🔢 [Format Module](#-format-module)
- 📅 [Billing Cycle Calculations](#-billing-cycle-calculations)

---

## 🧰 Tech Stack

| Layer | Technology | Purpose |
|:------|:-----------|:--------|
| ⚛️ **Framework** | Next.js 14 (App Router) | Full-stack React with file-based routing and API routes |
| 📝 **Language** | TypeScript (strict) | Type safety for financial data — no `any` types allowed |
| 🎨 **Styling** | Tailwind CSS 3.4 | Utility-first CSS with CSS variable theme support |
| 🗄️ **Database** | SQLite via `better-sqlite3` | Zero-config, local-first, single-file database |
| 🔧 **ORM** | Drizzle ORM | Lightweight, type-safe SQL builder for SQLite |
| 📊 **Charts** | Recharts | Composable React charting library |
| 🧠 **NLP/Matching** | Fuse.js + custom rules | Offline fuzzy matching for transaction categorization |
| 📤 **Export** | ExcelJS | Styled XLSX generation with full formatting control |
| ✨ **Animations** | Framer Motion | Subtle micro-interactions and page transitions |
| 🎯 **Icons** | Lucide React | Consistent SVG iconography |
| 🔤 **Fonts** | Inter + JetBrains Mono | UI text + monospace numbers via `next/font/google` |

> 🚫 **Explicitly excluded:** Prisma, MongoDB, external AI/LLM APIs, Chart.js, Material UI, Chakra, CSS Modules, styled-components.

---

## 📁 Project Structure

```
cardpulse/
│
├── 📄 CLAUDE.md                            # Project specification & build instructions
├── 📄 package.json
├── 📄 tsconfig.json
├── 📄 tailwind.config.ts                   # Theme CSS var integration (cv() helper)
├── 📄 next.config.mjs                      # Standalone output for Docker
├── 📄 drizzle.config.ts
├── 📄 Dockerfile                           # Multi-stage Docker build
├── 📄 .dockerignore                        # Docker build context exclusions
├── 📄 .env.local                           # DB_PATH=./data/cardpulse.db
│
├── 📂 src/
│   ├── 📂 app/
│   │   ├── 📄 layout.tsx                   # Root layout, fonts, theme flash prevention
│   │   ├── 📄 page.tsx                     # Root redirect (→ /dashboard or /lock)
│   │   ├── 📄 globals.css                  # CSS variables (6 themes × 2 modes), utilities
│   │   ├── 📄 loading.tsx                  # HMR loading state (dev-only dark bg)
│   │   │
│   │   ├── 📂 dashboard/page.tsx           # Main dashboard with collapsible sections
│   │   ├── 📂 transactions/page.tsx        # Transaction list + dual-mode entry
│   │   ├── 📂 cards/page.tsx               # Card management + credit overview
│   │   ├── 📂 emis/page.tsx                # EMI tracker + auto-generation
│   │   ├── 📂 analytics/page.tsx           # 7-tab analytics (Trends, Compare, etc.)
│   │   ├── 📂 budgets/page.tsx             # Monthly budget management
│   │   ├── 📂 settings/page.tsx            # 8-section settings panel
│   │   ├── 📂 lock/page.tsx                # PIN lock screen
│   │   ├── 📂 setup/page.tsx               # First-time PIN setup
│   │   │
│   │   └── 📂 api/                         # API endpoints (see route map below)
│   │       ├── 📂 transactions/            # CRUD + /top endpoint
│   │       ├── 📂 cards/                   # CRUD + spend enrichment
│   │       ├── 📂 categories/              # Read-only reference data
│   │       ├── 📂 labels/                  # CRUD (system labels protected)
│   │       ├── 📂 budgets/                 # CRUD with spent amounts
│   │       ├── 📂 emis/                    # CRUD + /generate endpoint
│   │       ├── 📂 analytics/               # Summary, detailed, compare
│   │       ├── 📂 export/                  # XLSX generation
│   │       ├── 📂 parse/                   # NLP text parsing
│   │       ├── 📂 keywords/                # Keyword rule management
│   │       ├── 📂 auth/                    # PIN setup, verify, change, disable
│   │       ├── 📂 settings/                # App settings + backup/restore
│   │       ├── 📂 ticker/                  # Payment ticker data
│   │       └── 📂 cycle-payments/          # Cycle payment tracking
│   │
│   ├── 📂 components/
│   │   ├── 📂 ui/                          # Reusable primitives
│   │   │   ├── button.tsx                  #   Primary/Secondary/Ghost/Danger variants
│   │   │   ├── input.tsx                   #   Text input with focus ring
│   │   │   ├── select.tsx                  #   Styled dropdown
│   │   │   ├── badge.tsx                   #   Category/label badges
│   │   │   ├── card.tsx                    #   Surface card container
│   │   │   ├── modal.tsx                   #   Dialog overlay
│   │   │   ├── chip.tsx                    #   Label tag chips
│   │   │   ├── skeleton.tsx                #   Loading placeholder
│   │   │   ├── pin-input.tsx               #   PIN entry dots
│   │   │   ├── date-picker.tsx             #   Date selection
│   │   │   ├── progress-bar.tsx            #   Horizontal progress indicator
│   │   │   ├── confidence-dot.tsx          #   🟢🟡⚪ NLP confidence
│   │   │   └── collapsible-section.tsx     #   Animated expand/collapse
│   │   │
│   │   ├── 📂 layout/                      # App shell
│   │   │   ├── sidebar.tsx                 #   Collapsible navigation sidebar
│   │   │   ├── header.tsx                  #   Top bar with page title + ticker
│   │   │   └── payment-ticker.tsx          #   Scrolling payment marquee
│   │   │
│   │   ├── 📂 providers/                   # React context providers
│   │   │   └── theme-provider.tsx          #   Theme + color mode state
│   │   │
│   │   ├── 📂 dashboard/                   # Dashboard components
│   │   │   ├── monthly-hero.tsx            #   Per-card spend hero with CountUp
│   │   │   ├── category-donut.tsx          #   Interactive category pie chart
│   │   │   ├── label-donut.tsx             #   Label breakdown pie chart
│   │   │   ├── credit-overview.tsx         #   Total credit utilization
│   │   │   ├── payment-due-summary.tsx     #   Upcoming payments + mark paid
│   │   │   ├── top-transactions-emi.tsx    #   Top txns + EMI status
│   │   │   ├── budget-strip.tsx            #   Budget progress bars
│   │   │   └── export-modal.tsx            #   XLSX export configuration
│   │   │
│   │   ├── 📂 transactions/                # Transaction components
│   │   │   ├── transaction-form.tsx        #   THE shared form (Quick Add + Manual + Edit)
│   │   │   ├── transaction-row.tsx         #   List item display
│   │   │   └── transaction-filters.tsx     #   Filter/sort controls
│   │   │
│   │   ├── 📂 analytics/                   # Analytics chart components
│   │   │   ├── trends-tab.tsx              #   3-section trends (Overall, Category, Label)
│   │   │   ├── compare-tab.tsx             #   Month-vs-month comparison
│   │   │   ├── trend-area-chart.tsx        #   Reusable area chart with dropdown
│   │   │   ├── insight-card.tsx            #   Stat card + row layout
│   │   │   ├── chart-tooltip.tsx           #   Shared Recharts tooltip
│   │   │   ├── card-breakdown.tsx          #   Per-card bar/area charts
│   │   │   ├── monthly-drilldown.tsx       #   Category + label donut pair
│   │   │   └── cycle-timeline.tsx          #   3-cycle billing timeline
│   │   │
│   │   ├── 📂 cards/                       # Card management
│   │   ├── 📂 emis/                        # EMI tracker
│   │   ├── 📂 budgets/                     # Budget management
│   │   └── 📂 settings/                    # 8 settings sections
│   │
│   ├── 📂 lib/
│   │   ├── 📂 db/
│   │   │   ├── 📄 index.ts                 # Database connection singleton
│   │   │   ├── 📄 schema.ts                # Drizzle schema (11 tables)
│   │   │   ├── 📄 seed.ts                  # Seeds: categories, labels, rules, cards, settings
│   │   │   └── 📄 queries.ts               # Shared query helpers (ticker, cycle payments)
│   │   │
│   │   ├── 📂 nlp/
│   │   │   ├── 📄 parser.ts                # NLP pipeline orchestrator
│   │   │   ├── 📄 amount-extractor.ts      # Regex amount parsing
│   │   │   ├── 📄 date-extractor.ts        # Natural date parsing
│   │   │   ├── 📄 card-matcher.ts          # Fuzzy card alias matching (Fuse.js)
│   │   │   └── 📄 keyword-matcher.ts       # Category matching (Fuse.js + rules)
│   │   │
│   │   ├── 📂 export/
│   │   │   └── 📄 xlsx-generator.ts        # Styled Excel report builder
│   │   │
│   │   ├── 📄 format.ts                    # Currency/date/number formatting (server + client)
│   │   ├── 📄 cycle-utils.ts               # Billing cycle date calculations
│   │   ├── 📄 chart-utils.ts               # Shared chart helpers (Y-axis, formatting)
│   │   ├── 📄 constants.ts                 # Color palette, category lists (legacy)
│   │   └── 📄 utils.ts                     # cn() helper, general utilities
│   │
│   ├── 📂 hooks/
│   │   └── 📄 use-theme-colors.ts          # CSS variable → hex for Recharts
│   │
│   └── 📂 types/
│       ├── 📄 index.ts                     # Shared TypeScript types
│
├── 📂 data/                                # SQLite database (gitignored)
│   └── 📄 cardpulse.db
├── 📂 docs/                                # Documentation (11 guides)
└── 📂 drizzle/                             # Generated migrations
```

---

## 🗃️ Database Schema

CardPulse uses **11 tables** in a single SQLite file. All tables are defined in `src/lib/db/schema.ts` using Drizzle ORM.

### 📊 Tables Overview

| # | Table | Records | Purpose |
|:-:|:------|:--------|:--------|
| 1 | 💳 `cards` | User data | Credit cards with billing cycle data |
| 2 | 📂 `categories` | 11 pre-seeded | Main expense categories (read-only) |
| 3 | 📁 `subcategories` | 68 pre-seeded | Subcategories under each category (read-only) |
| 4 | 🏷️ `labels` | 29 pre-seeded | Transaction tags (system + custom) |
| 5 | 💰 `transactions` | User data | Individual expense entries |
| 6 | 🔗 `transaction_labels` | User data | Many-to-many: transactions ↔ labels |
| 7 | 🧠 `keyword_rules` | 91+ pre-seeded | NLP auto-categorization rules |
| 8 | 📆 `emis` | User data | Active installment plans |
| 9 | 🎯 `budgets` | User data | Monthly spending limits per category |
| 10 | ✅ `cycle_payments` | User data | Payment tracking per billing cycle |
| 11 | ⚙️ `settings` | ~8 rows | Application configuration (key-value pairs) |

---

### 💳 `cards`

Credit cards with billing cycle definitions and NLP aliases.

| Column | Type | Nullable | Description |
|:-------|:-----|:--------:|:------------|
| `id` | INTEGER | PK | Auto-increment primary key |
| `name` | TEXT | No | Display name (unique), e.g., "My Premium Card" |
| `label_name` | TEXT | No | Matching label reference (unique) |
| `bank` | TEXT | No | Bank name, e.g., "Example Bank" |
| `last_four` | TEXT | Yes | Last 4 digits of card number |
| `cycle_start` | INTEGER | No | Billing cycle start day (1–31) |
| `cycle_end` | INTEGER | No | Billing cycle end day (1–31) |
| `statement_day` | INTEGER | No | Day statement is generated |
| `due_day` | INTEGER | No | Payment due day |
| `credit_limit` | REAL | Yes | Credit limit in configured currency |
| `color` | TEXT | Yes | Hex color for UI differentiation |
| `aliases` | TEXT | Yes | JSON array of NLP aliases for fuzzy matching |
| `is_active` | INTEGER | No | `1` = active, `0` = inactive (default: `1`) |
| `created_at` | TEXT | No | ISO datetime (auto-set) |
| `updated_at` | TEXT | No | ISO datetime (auto-set) |

> 🔑 **Unique constraints:** `name`, `label_name`

---

### 💰 `transactions`

Individual expense entries — the core data table.

| Column | Type | Nullable | Description |
|:-------|:-----|:--------:|:------------|
| `id` | INTEGER | PK | Auto-increment primary key |
| `amount` | REAL | No | Transaction amount (stored as number) |
| `description` | TEXT | No | Raw NLP input or "Manual entry" |
| `merchant` | TEXT | Yes | Extracted merchant name |
| `transaction_date` | TEXT | No | Date in `YYYY-MM-DD` format |
| `category_id` | INTEGER | Yes | FK → `categories.id` |
| `subcategory_id` | INTEGER | Yes | FK → `subcategories.id` |
| `card_id` | INTEGER | Yes | FK → `cards.id` (NULL = cash/bank) |
| `notes` | TEXT | Yes | Optional user notes |
| `is_recurring` | INTEGER | No | `0` or `1` (default: `0`) |
| `created_at` | TEXT | No | ISO datetime (auto-set) |
| `updated_at` | TEXT | No | ISO datetime (auto-set) |

> 🔗 **Foreign keys:** `category_id` → categories, `subcategory_id` → subcategories, `card_id` → cards

---

### 📆 `emis`

Active installment / Buy Now Pay Later plans.

| Column | Type | Nullable | Description |
|:-------|:-----|:--------:|:------------|
| `id` | INTEGER | PK | Auto-increment primary key |
| `card_id` | INTEGER | No | FK → `cards.id` |
| `description` | TEXT | No | Purchase name (e.g., "Laptop", "Smart Device") |
| `original_amount` | REAL | No | Total purchase price |
| `monthly_amount` | REAL | No | Monthly installment amount |
| `total_months` | INTEGER | No | Total tenure (e.g., 12, 24) |
| `months_remaining` | INTEGER | No | Months left (decrements each cycle) |
| `start_date` | TEXT | No | Start date in `YYYY-MM-DD` |
| `end_date` | TEXT | Yes | Expected completion date |
| `category_id` | INTEGER | Yes | FK → `categories.id` (auto-categorization) |
| `subcategory_id` | INTEGER | Yes | FK → `subcategories.id` |
| `label_ids` | TEXT | Yes | JSON array of label IDs to auto-apply |
| `is_active` | INTEGER | No | `1` = active, `0` = completed (default: `1`) |
| `auto_generate` | INTEGER | No | `1` = prompt for auto-generation (default: `1`) |
| `last_generated` | TEXT | Yes | `YYYY-MM` of last generated transaction |
| `notes` | TEXT | Yes | Optional notes |
| `created_at` | TEXT | No | ISO datetime (auto-set) |
| `updated_at` | TEXT | No | ISO datetime (auto-set) |

> ⚙️ **Auto-generation:** When `auto_generate = 1`, the app prompts (never silently generates) to create transactions each billing cycle. Description is prefixed with `[EMI]`.

---

### 🧠 `keyword_rules`

NLP engine rules mapping keywords to categories, subcategories, and labels.

| Column | Type | Nullable | Description |
|:-------|:-----|:--------:|:------------|
| `id` | INTEGER | PK | Auto-increment primary key |
| `keyword` | TEXT | No | Match text (e.g., "enoc", "netflix") |
| `category_id` | INTEGER | Yes | FK → `categories.id` |
| `subcategory_id` | INTEGER | Yes | FK → `subcategories.id` |
| `label_ids` | TEXT | Yes | JSON array of label IDs (e.g., `[5, 12]`) |
| `priority` | INTEGER | No | Higher = checked first (default: `0`) |
| `is_system` | INTEGER | No | `1` = built-in, `0` = user-learned (default: `1`) |
| `created_at` | TEXT | No | ISO datetime (auto-set) |

> 📈 **Learning:** User-created rules (`is_system = 0`) automatically have higher priority than system rules. Created when user corrects an NLP auto-fill and clicks "Remember this."

---

### ⚙️ `settings`

Application configuration stored as key-value pairs.

| Key | Default Value | Description |
|:----|:-------------|:------------|
| 💱 `currency` | `AED` | Display currency code |
| 📅 `date_format` | `DD/MM` | Date display format |
| 🔢 `number_format` | `comma_period` | Number formatting style (`1,234.56` or `1.234,56`) |
| 🔐 `pin_enabled` | `true` | PIN lock screen toggle |
| 🎨 `theme` | `sage` | Active color theme (sage/ocean/ember/rose/slate/lavender) |
| 🌗 `color_mode` | `dark` | Dark or light mode |
| 🚀 `first_run_complete` | `false` | First-run setup completion flag |
| 🔑 `pin_hash` | *(bcrypt hash)* | Hashed PIN — **never exposed via API** |

---

### 📂 `categories`

Main expense categories (11 pre-seeded, read-only).

| Column | Type | Description |
|:-------|:-----|:------------|
| `id` | INTEGER PK | Auto-increment |
| `name` | TEXT UNIQUE | Category name (e.g., "Food & Drinks") |

---

### 📁 `subcategories`

Subcategories under each main category (68 pre-seeded, read-only).

| Column | Type | Description |
|:-------|:-----|:------------|
| `id` | INTEGER PK | Auto-increment |
| `category_id` | INTEGER FK | → `categories.id` |
| `name` | TEXT | Subcategory name (e.g., "Groceries") |

> 🔑 **Unique constraint:** `(category_id, name)` — no duplicate subcategory names within a category.

---

### 🏷️ `labels`

Transaction tags — 29 system labels + user-created custom labels.

| Column | Type | Description |
|:-------|:-----|:------------|
| `id` | INTEGER PK | Auto-increment |
| `name` | TEXT UNIQUE | Label name (e.g., "Weekend", "Groceries") |
| `is_system` | INTEGER | `1` = pre-seeded (protected), `0` = user-created (deletable) |
| `created_at` | TEXT | ISO datetime (auto-set) |

---

### 🔗 `transaction_labels`

Many-to-many junction table connecting transactions to labels.

| Column | Type | Description |
|:-------|:-----|:------------|
| `transaction_id` | INTEGER FK | → `transactions.id` (CASCADE delete) |
| `label_id` | INTEGER FK | → `labels.id` |

> 🔑 **Primary key:** Composite `(transaction_id, label_id)`

---

### 🎯 `budgets`

Monthly spending limits per category or subcategory.

| Column | Type | Description |
|:-------|:-----|:------------|
| `id` | INTEGER PK | Auto-increment |
| `category_id` | INTEGER FK | → `categories.id` |
| `subcategory_id` | INTEGER FK | → `subcategories.id` (NULL = whole category) |
| `month` | INTEGER | Month number (1–12) |
| `year` | INTEGER | Year (e.g., 2026) |
| `amount` | REAL | Budget limit amount |

> 🔑 **Unique constraint:** `(category_id, subcategory_id, month, year)` — one budget per category/subcategory per month.

---

### ✅ `cycle_payments`

Tracks which billing cycles have been marked as paid by the user.

| Column | Type | Description |
|:-------|:-----|:------------|
| `id` | INTEGER PK | Auto-increment |
| `card_id` | INTEGER FK | → `cards.id` |
| `cycle_start` | TEXT | Cycle start date (`YYYY-MM-DD`) |
| `cycle_end` | TEXT | Cycle end date (`YYYY-MM-DD`) |
| `due_date` | TEXT | Payment due date (`YYYY-MM-DD`) |
| `amount` | REAL | Estimated bill amount |
| `is_paid` | INTEGER | `0` = unpaid, `1` = paid (default: `0`) |
| `paid_at` | TEXT | ISO datetime when marked paid |
| `created_at` | TEXT | ISO datetime (auto-set) |

> 🔑 **Unique constraint:** `(card_id, cycle_start, cycle_end)` — one record per card per billing cycle.

---

## 🌐 API Route Map

All API endpoints return a consistent JSON shape:

```typescript
{ success: boolean; data?: T; error?: string }
```

### 💰 Transaction Endpoints

| Method | Path | Description |
|:------:|:-----|:------------|
| `GET` | `/api/transactions` | List with filters (`dateFrom`, `dateTo`, `categoryId`, `cardId`, `labelId`, `search`, `sortBy`, `sortOrder`, `limit`) |
| `POST` | `/api/transactions` | Create transaction with label associations |
| `PUT` | `/api/transactions` | Update existing transaction |
| `DELETE` | `/api/transactions` | Bulk delete by IDs (body: `{ ids: number[] }`) |
| `GET` | `/api/transactions/top` | Top 10 by amount (`?year=Y&month=M` or `?all=true`) |

### 💳 Card Endpoints

| Method | Path | Description |
|:------:|:-----|:------------|
| `GET` | `/api/cards` | List cards (`?includeInactive`, `?withSpend`) |
| `POST` | `/api/cards` | Create card (auto-creates matching label) |
| `PUT` | `/api/cards` | Update card details |
| `PATCH` | `/api/cards` | Toggle active/inactive status |

### 📚 Reference Data

| Method | Path | Description |
|:------:|:-----|:------------|
| `GET` | `/api/categories` | All categories with nested subcategories (read-only) |
| `GET` | `/api/labels` | All labels (system + custom) |
| `POST` | `/api/labels` | Create custom label |
| `DELETE` | `/api/labels` | Delete custom label (`?id=N`); system labels are protected |

### 🎯 Budget Endpoints

| Method | Path | Description |
|:------:|:-----|:------------|
| `GET` | `/api/budgets` | Budgets for month (`?year=Y&month=M`) with spent amounts |
| `POST` | `/api/budgets` | Create or upsert budget |
| `PUT` | `/api/budgets` | Update budget amount |
| `DELETE` | `/api/budgets` | Delete budget (`?id=N`) |

### 📆 EMI Endpoints

| Method | Path | Description |
|:------:|:-----|:------------|
| `GET` | `/api/emis` | List EMIs (`?includeCompleted`) |
| `POST` | `/api/emis` | Create new EMI |
| `PUT` | `/api/emis` | Update EMI details |
| `PATCH` | `/api/emis` | Mark complete or reactivate |
| `GET` | `/api/emis/generate` | Check which EMIs need transaction generation |
| `POST` | `/api/emis/generate` | Generate transactions for confirmed EMIs |

### 📊 Analytics Endpoints

| Method | Path | Description |
|:------:|:-----|:------------|
| `GET` | `/api/analytics` | Dashboard summary (`?year=Y&month=M`) — totals, breakdowns, card spend |
| `GET` | `/api/analytics/detailed` | Full analytics — trends, drilldowns, cycles, EMI landscape, insight stats |
| `GET` | `/api/analytics/compare` | Month comparison (`?year1=Y&month1=M&year2=Y&month2=M`) |

### 🔧 Other Endpoints

| Method | Path | Description |
|:------:|:-----|:------------|
| `GET` | `/api/export` | Download XLSX report (`?year=Y&month=M&rate=R`) |
| `POST` | `/api/parse` | NLP text parsing (body: `{ text: string }`) |
| `GET/POST/DELETE` | `/api/keywords` | Keyword rule CRUD |
| `GET/POST` | `/api/auth` | PIN setup, verify, change, disable, enable, auto-session |
| `GET` | `/api/ticker` | Payment ticker data (card due dates + top labels) |
| `GET/POST/PATCH` | `/api/cycle-payments` | Cycle payment tracking (mark paid/unpaid) |
| `GET/PUT` | `/api/settings` | Application settings read/update |
| `GET/POST/DELETE` | `/api/settings/backup` | Database export, import, factory reset |

---

## 🧠 NLP Pipeline Architecture

The NLP parser (`src/lib/nlp/parser.ts`) runs **4 stages in sequence**, each extracting a different piece of information from freeform text. Every stage can return `null` — failures never crash the pipeline.

```
📥 Input: "fuel 200 mycard yesterday"
     │
     ▼
┌─────────────────────────────────┐
│  1️⃣  Amount Extractor           │
│  📄 src/lib/nlp/amount-extractor│
│  🔧 Regex-based                 │
│  ✅ Extracts: 200               │
│  ✂️  Strips number from text     │
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│  2️⃣  Card Matcher               │
│  📄 src/lib/nlp/card-matcher    │
│  🔧 Fuse.js fuzzy matching      │
│  ✅ Matches: "mycard" → My Card  │
│  ✂️  Strips "mycard" from text   │
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│  3️⃣  Date Extractor             │
│  📄 src/lib/nlp/date-extractor  │
│  🔧 Pattern-based               │
│  ✅ Matches: "yesterday"        │
│  📅 Returns: 2026-02-28         │
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│  4️⃣  Keyword Matcher            │
│  📄 src/lib/nlp/keyword-matcher │
│  🔧 Fuse.js + 91+ rules        │
│  ✅ Matches: "fuel" → Vehicle   │
│  🏷️  Adds labels: Vehicle Exp.  │
└──────────────┬──────────────────┘
               ▼
📤 Output: ParsedTransaction {
     amount: 200,
     card: { id: 5, name: "My Premium Card" },
     date: "2026-02-28",
     category: "Vehicle",
     subcategory: "Fuel",
     labels: ["Vehicle Expenses", "My Premium Card"],
     confidence: { amount: 1.0, card: 0.95, date: 1.0, category: 1.0 }
   }
```

### 🔑 Key Design Principles

| Principle | Detail |
|:----------|:-------|
| 🛡️ **Never throws** | Every stage wraps in try/catch — failures return `null` for that field |
| ✂️ **Progressive stripping** | Card matcher strips matched text before keyword matching runs |
| 📊 **Confidence scores** | Each auto-filled field gets a 0–1 confidence score for UI indicators |
| 🎓 **User rules first** | User-created keyword rules (`is_system = 0`) have higher priority |
| 🚫 **Ambiguity rejection** | Ambiguous matches (e.g., "cashback" → 2 cards) are rejected, not guessed |
| 🔄 **Learning loop** | User corrections can be saved as new rules via "Remember this?" prompt |

---

## 🎨 Theme System Architecture

CardPulse supports **6 color themes** × **2 modes** (dark/light) = **12 visual configurations**. The system is built in 4 layers:

```
┌──────────────────────────────────────────────────────────┐
│  Layer 1: CSS Variables                                  │
│  📄 globals.css                                          │
│  12 sets of --color-* variables (6 themes × 2 modes)     │
│  RGB channel format: --color-sage-400: 126 184 158       │
└────────────────────┬─────────────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────────────┐
│  Layer 2: Tailwind Integration                           │
│  📄 tailwind.config.ts                                   │
│  cv() helper: cv("sage-400") →                           │
│    "rgb(var(--color-sage-400) / <alpha-value>)"          │
│  Enables: bg-sage-400, text-sage-400/50, etc.            │
└────────────────────┬─────────────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────────────┐
│  Layer 3: ThemeProvider (React Context)                   │
│  📄 src/components/providers/theme-provider.tsx           │
│  • Reads initial theme from <html> dataset attributes    │
│  • Persists to localStorage (instant) + DB API (durable) │
│  • Dispatches 'cp-theme-change' CustomEvent on changes   │
└────────────────────┬─────────────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────────────┐
│  Layer 4: Chart Color Hook                               │
│  📄 src/hooks/use-theme-colors.ts                        │
│  • useThemeColors() reads CSS vars via getComputedStyle() │
│  • Converts RGB channels to hex strings for Recharts     │
│  • Listens for 'cp-theme-change' events to re-read       │
│  • Uses requestAnimationFrame for smooth transitions     │
└──────────────────────────────────────────────────────────┘
```

### ⚡ Flash Prevention

An **inline script** in `layout.tsx` runs before React hydrates to prevent theme flash (FOUC):

```javascript
// Runs before first paint — no flash of wrong theme
const theme = localStorage.getItem('cp-theme') || 'sage';
const mode = localStorage.getItem('cp-mode') || 'dark';
document.documentElement.dataset.theme = theme;
document.documentElement.dataset.mode = mode;
```

### 🎭 Available Themes

| Theme | Primary Accent | Character |
|:------|:---------------|:----------|
| 🌿 Sage | Green | Default — calm, fintech feel |
| 🌊 Ocean | Blue | Cool, professional |
| 🔥 Ember | Orange-red | Warm, energetic |
| 🌹 Rose | Pink | Soft, elegant |
| 🪨 Slate | Gray-blue | Minimal, neutral |
| 💜 Lavender | Purple | Creative, relaxed |

---

## 🔢 Format Module

`src/lib/format.ts` provides currency, date, and number formatting with a **dual-mode architecture** that works on both server and client.

### 🔄 Dual-Mode Resolution

```
┌───────────────────────┐     ┌───────────────────────┐
│  🖥️ Server Side        │     │  🌐 Client Side        │
│                        │     │                        │
│  Reads settings        │     │  Reads from            │
│  directly from DB      │     │  window.__CP_FMT__     │
│  via better-sqlite3    │     │  (injected by          │
│                        │     │   layout.tsx)           │
└───────────┬────────────┘     └───────────┬────────────┘
            │                              │
            └──────────┬───────────────────┘
                       ▼
              🎯 Same output format
              regardless of context
```

### 📋 Function Reference

| Function | Input | Output | Example |
|:---------|:------|:-------|:--------|
| `getCurrency()` | — | Currency code | `"AED"` |
| `formatAmount(n)` | `1234.56` | Formatted string | `"AED 1,234.56"` |
| `formatChartAxis(n)` | `15000` | Compact axis label | `"AED 15k"` |
| `formatDate(s)` | `"2026-02-10"` | Formatted date | `"10/02/2026"` |
| `getFormatSettings()` | — | Settings object | `{ currency, numberFormat, dateFormat }` |
| `invalidateFormatCache()` | — | void | Clears module-level cache after settings update |

### 🌍 Number Format Styles

| Style | Pattern | Example | Locale |
|:------|:--------|:--------|:-------|
| `comma_period` | `1,234.56` | Default (US/UAE) | `en-US` |
| `period_comma` | `1.234,56` | European | `de-DE` |

---

## 📅 Billing Cycle Calculations

`src/lib/cycle-utils.ts` centralizes all billing cycle date math used by dashboard cards, analytics, and payment tracking.

### 🔄 Cycle Date Resolution

Given a card's `cycle_start` and `cycle_end` day numbers, the utility determines which **calendar dates** define each billing cycle relative to today:

```
Example: Card E (cycle_start=2, cycle_end=1)

     Jan 2          Feb 1       Feb 2          Mar 1
      │◄── Previous Cycle ──►│  │◄── Current Cycle ──►│
                                      ▲ Today (Feb 15)
```

### 📋 Due Date Logic

The due date is determined relative to the **statement date** (which falls on `cycle_end`):

| Condition | Due Date Month | Example |
|:----------|:---------------|:--------|
| `dueDay > statementDay` | **Same month** as statement | Card E: stmt 1st → due 26th (same month) |
| `dueDay <= statementDay` | **Next month** after statement | Card A: stmt 9th → due 3rd (next month) |

### 📊 Verified Due Dates (from PDF statements)

| Card | Statement Day | Due Day | Gap | Logic |
|:-----|:-------------|:--------|:---:|:------|
| 🔵 Card A | 9th | 3rd (next month) | 25d | `dueDay < stmtDay` → next month |
| 🟡 Card B | 31st | 25th (next month) | 25d | `dueDay < stmtDay` → next month |
| 🟢 Card C | 31st | 25th (next month) | 25d | `dueDay < stmtDay` → next month |
| 🟣 Card D | 23rd | 19th (next month) | 27d | `dueDay < stmtDay` → next month |
| 🔷 Card E | 1st | 26th (same month) | 25d | `dueDay > stmtDay` → same month |

### 📏 Month-Length Capping

Day numbers like `31` are automatically **capped to the actual last day** of each month:

| Month | Day 31 becomes |
|:------|:---------------|
| February | 28 (or 29 in leap years) |
| April, June, Sep, Nov | 30 |
| All other months | 31 (unchanged) |

> 🔗 **Single source of truth.** All components (dashboard cards, analytics cycles, payment tracker) import cycle logic from `@/lib/cycle-utils` — no duplicate implementations.

---

← Previous: [Export Reports](./09-Export-Reports.md) | → Next: [Deployment Guide](./11-Deployment-Guide.md)
