# ⚡ 03: Transaction Entry

> CardPulse's **dual-mode entry system** lets you add transactions however you prefer — type a quick sentence and let the NLP parser handle the rest, or fill in every field manually. Both modes feed into the exact same form.

---

## 📑 Table of Contents

- 🔀 [Two Entry Modes](#-two-entry-modes)
- 🧠 [Quick Add (NLP)](#-quick-add-nlp)
- ⚙️ [NLP Pipeline](#️-nlp-pipeline)
- 📝 [Example Parses](#-example-parses)
- 🎯 [Confidence Indicators](#-confidence-indicators)
- 🧑‍🏫 [Teaching the System](#-teaching-the-system)
- ✍️ [Manual Entry](#️-manual-entry)
- 📋 [Transaction Form Fields](#-transaction-form-fields)
- ✏️ [Editing Transactions](#️-editing-transactions)
- 📃 [Transaction List](#-transaction-list)
- 🔍 [Filtering & Sorting](#-filtering--sorting)
- 🗑️ [Bulk Operations](#️-bulk-operations)

---

## 🔀 Two Entry Modes

CardPulse offers **dual-mode input** at the top of the Transactions page:

| Mode | How it Works | Best For |
|:-----|:-------------|:---------|
| ⚡ **Quick Add** | Type a natural-language sentence → NLP parser extracts data | Fast daily entries |
| 📝 **Manual Entry** | Fill in each field using dropdowns and inputs | Full control, unusual entries |

> 🔄 Both modes populate the **same underlying form**. Quick Add pre-fills fields where possible; Manual Entry starts empty. Switch between modes freely using the tab toggle.

![Transaction Entry — Quick Add Mode](../public/screenshots/nlp-entry.png)

---

## 🧠 Quick Add (NLP)

Type what you spent in plain language:

```
fuel 200 mycard yesterday
```

Press **Enter** or click the submit arrow. The NLP parser runs **entirely offline** — no API calls, no LLM, no data leaves your machine — and pre-fills the form below with extracted data.

> 🛡️ **Key principle:** The parser can **never** block transaction entry. If it fails to extract a field, that field is simply left empty for you to fill manually. NLP is an accelerator, not a gatekeeper.

---

## ⚙️ NLP Pipeline

The parser runs **4 stages** in sequence. Each stage is independent — if one fails, the others still run:

```
┌──────────────────────────────────────────────────────┐
│  "fuel 200 mycard yesterday"                         │
│                                                      │
│  Stage 1: 💰 Amount Extraction ──→ AED 200           │
│  Stage 2: 💳 Card Matching ─────→ My Premium Card    │
│  Stage 3: 📅 Date Detection ────→ Yesterday          │
│  Stage 4: 🏷️ Keyword Matching ──→ Vehicle > Fuel     │
│                                                      │
│  ════════════════════════════════════════════════════ │
│  Result: Form pre-filled with all extracted fields   │
│  Missing fields left empty for manual input          │
└──────────────────────────────────────────────────────┘
```

### 💰 Stage 1: Amount Extraction

Recognizes numbers with optional currency codes and formatting:

| Pattern | Example | Result |
|:--------|:--------|:-------|
| Plain number | `200`, `45.50` | AED 200, AED 45.50 |
| With commas | `1,234.56` | AED 1,234.56 |
| Currency prefix | `AED 200` | AED 200 |
| Currency suffix | `200 AED` | AED 200 |

> 💡 If multiple numbers are found, the parser uses the most likely amount (skipping values that look like dates or years).

### 💳 Stage 2: Card Matching

Fuzzy-matches text against **card aliases** stored in the database:

| Match Type | Confidence | Example |
|:-----------|:----------:|:--------|
| 🎯 Exact match | 1.0 | `"my premium card"` → My Premium Card |
| 📏 Substring match | 0.95 | `"premium"` → My Premium Card |
| 🔍 Fuzzy match (Fuse.js) | ≥ 0.7 | `"premum"` → My Premium Card |

When a card is matched, its text is **stripped** from the input before keyword matching. This prevents card aliases from interfering with category detection.

> ⚠️ **Ambiguity protection:** If an alias could match multiple cards (e.g., `"cashback"` matches two different cards, or `"bank name"` matches multiple cards at the same bank), the parser **rejects the match entirely** rather than guessing wrong. You pick the card from the dropdown.

### 📅 Stage 3: Date Detection

Understands relative and absolute dates:

| Pattern | Examples |
|:--------|:---------|
| 📍 Relative | `today`, `yesterday` |
| 📆 Day names | `saturday`, `last friday` |
| 🗓️ Month + day | `feb 5`, `5 february` |
| 📝 Slash format | `05/02` (interpreted as DD/MM) |

> 📅 If no date is found, defaults to **today**.

### 🏷️ Stage 4: Keyword Matching

Runs remaining text against **91+ keyword rules** using Fuse.js:

1. 🎯 **Exact substring match** checked first (e.g., `"enoc"` → Vehicle > Fuel)
2. 🔍 **Fuzzy match** as fallback (e.g., `"shoes"` → Shopping > Clothes & Shoes)
3. 📂 **Subcategory name fallback** if no keyword rule matches

> 🏅 **Priority:** User-created rules always take priority over system rules.

---

## 📝 Example Parses

| Input | 💰 Amount | 📂 Category | 💳 Card | 📅 Date | 🏷️ Labels |
|:------|:----------|:------------|:--------|:--------|:----------|
| `fuel 200 mycard` | AED 200 | Vehicle > Fuel | My Card | Today | Vehicle Expenses, My Card |
| `talabat 85 yesterday` | AED 85 | Food & Drinks > Restaurant, Fast-Food | — | Yesterday | Food Delivery |
| `netflix 55` | AED 55 | Life & Entertainment > TV, Streaming | — | Today | Subscriptions, Bills and Subs |
| `bought shoes 400` | AED 400 | Shopping > Clothes & Shoes | — | Today | — |
| `random thing 150` | AED 150 | *User selects* | — | Today | — |
| `paid 300 for AC repair` | AED 300 | Housing > Maintenance, Repairs | — | Today | — |
| `200` | AED 200 | *User selects* | — | Today | — |

> 💡 **Notice the graceful degradation:** From fully parsed (`fuel 200 mycard`) to bare minimum (`200`), the form always works. You just fill in what the parser couldn't figure out.

---

## 🎯 Confidence Indicators

In Quick Add mode, each auto-filled field shows a colored dot:

| Indicator | Meaning | Score Range |
|:---------:|:--------|:------------|
| 🟢 Green dot | High confidence — auto-filled correctly | ≥ 0.9 |
| 🟡 Amber dot | Low confidence — might need your correction | < 0.9 |
| ⚪ No dot | Not auto-filled — you must enter this field | — |

> 📝 Confidence dots **only appear in Quick Add mode**. In Manual Entry and Edit modes, no dots are shown.

---

## 🧑‍🏫 Teaching the System

When you modify an auto-filled field before saving (e.g., change the category from what the parser suggested), a **Learn prompt** appears:

> 💬 *"Remember 'keyword' for next time?"*

Click **Yes** to save your correction as a new keyword rule:

- 🏅 Has **higher priority** than system rules
- 🔄 Will be used in **future Quick Add parses** automatically
- ⚙️ Can be managed from **Settings > Keywords** (see [Settings Reference](./08-Settings-Reference.md))

> 🧠 **This is how CardPulse gets smarter over time** — each correction you make improves future accuracy. The more you use Quick Add, the better it gets.

---

## ✍️ Manual Entry

Switch to the **Manual Entry** tab to get a completely empty form:

- 🚫 No NLP parsing happens
- 🚫 No confidence dots shown
- 🚫 No learn prompt appears
- ✅ All fields blank and ready for input

> 💡 **Use Manual Entry** when you want full control, when the input doesn't suit natural-language parsing, or when you're entering a transaction with specific fields already in mind.

---

## 📋 Transaction Form Fields

The **same form** is used across Quick Add, Manual Entry, and Edit modes:

| Field | Required | Type | Details |
|:------|:--------:|:-----|:--------|
| 💰 **Amount** | ✅ | Number input | Configured currency, JetBrains Mono font |
| 📅 **Date** | ✅ | Date picker | Defaults to today |
| 📂 **Category** | ✅ | Dropdown | 11 main categories; selecting one filters subcategories |
| 📁 **Subcategory** | ✅ | Dropdown | Filtered by selected category |
| 💳 **Card** | ❌ | Dropdown | Active cards + "None (Cash/Bank)". Auto-adds card label when selected |
| 🏷️ **Labels** | ❌ | Multi-select chips | Searchable, shows system + custom labels |
| 📝 **Notes** | ❌ | Text input | Free-text for additional context |

**Action buttons:**
- 💾 **Save** — Saves and closes the form
- ➕ **Save & Add Another** — Saves, clears the form, keeps it open for the next entry

---

## ✏️ Editing Transactions

👆 Click any transaction row in the list to open it in **edit mode**. The same TransactionForm appears pre-filled with the transaction's current values. Modify any field and click Save.

---

## 📃 Transaction List

The main transactions page shows all transactions in a table:

![Transaction List](../public/screenshots/transactions-list.png)

Each row displays:
- 📅 **Date** (formatted per your settings)
- 📝 **Description** and merchant name
- 💰 **Amount** (monospace font, right-aligned)
- 🏷️ **Category/Subcategory** badges
- 💳 **Card** badge (color-coded)
- 🏷️ **Label** chips
- ⚙️ **Actions** — Edit and delete buttons

> 📊 A **summary bar** at the top shows the transaction count and total amount for the current filter.

---

## 🔍 Filtering & Sorting

### 🎛️ Filters (combine any)

| Filter | Type | Description |
|:-------|:-----|:------------|
| 📅 **Date range** | Start + end date pickers | Show transactions within a period |
| 📂 **Category** | Dropdown | Filter by main category |
| 📁 **Subcategory** | Dropdown | Filtered by selected category |
| 💳 **Card** | Dropdown | Filter by credit card |
| 🏷️ **Label** | Dropdown | Filter by any label |
| 🔎 **Search** | Text input | Full-text search across descriptions |

### 📊 Sorting (click column headers)

| Column | Default |
|:-------|:--------|
| 📅 Date | ✅ Descending (newest first) |
| 💰 Amount | Ascending/Descending |
| 📂 Category | Alphabetical |

---

## 🗑️ Bulk Operations

1. ☑️ Select transactions using **row checkboxes** (or "Select All")
2. 🗑️ A **Delete (n)** button appears showing the count
3. 👆 Click to delete — a **confirmation dialog** appears
4. ✅ Confirm to permanently remove all selected transactions

> ⚠️ **Bulk delete is irreversible.** Make sure you've selected the right transactions before confirming.

---

← Previous: [Dashboard Guide](./02-Dashboard-Guide.md) | → Next: [Card Management](./04-Card-Management.md)
