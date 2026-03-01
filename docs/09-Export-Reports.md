# 📤 09: Export Reports

> Export your monthly spending data as a **professionally styled XLSX (Excel) report** — complete with color-coded headers, category totals, and label summaries. Perfect for personal records, accountant handoffs, or monthly financial reviews.

---

## 📑 Table of Contents

- 🔭 [Overview](#-overview)
- 🚪 [Accessing Exports](#-accessing-exports)
- 📊 [XLSX Export Format](#-xlsx-export-format)
- 🎨 [Styling Details](#-styling-details)
- ⚙️ [Export Options](#️-export-options)
- 💡 [Tips & Notes](#-tips--notes)

---

## 🔭 Overview

CardPulse generates a **single-sheet Excel report** for any month of transaction data. The export captures every transaction organized by category, with a label summary section at the bottom and an optional currency conversion rate.

| Feature | Detail |
|:--------|:-------|
| 📁 **Format** | `.xlsx` (Excel 2007+) |
| 📦 **Library** | ExcelJS with full styling control |
| 🗓️ **Scope** | One calendar month per export |
| 💱 **Conversion** | Optional rate column for multi-currency |
| 📥 **Output** | Auto-downloads as `CardPulse_MonthName_Year.xlsx` |

> 🌐 **Fully offline.** Export generation runs entirely on your machine — no data is sent anywhere.

---

## 🚪 Accessing Exports

1. 📊 Open the **Dashboard** (`/dashboard`)
2. 🖱️ Click the **Export** button (top-right area of the dashboard)
3. 📋 An **export modal** appears with configuration options:

```
┌─────────────────────────────────────────┐
│          📤 Export Monthly Report        │
│                                         │
│  🗓️ Month:  [◀ February 2026 ▶]        │
│                                         │
│  💱 Conversion Rate:  [ 1.00 ]          │
│     (AED → target currency)             │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │      📥 Export XLSX              │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

4. 📅 Select the **month and year** using the arrow navigator
5. 💱 Optionally set a **conversion rate** (default: `1`)
6. ✅ Click **Export XLSX** to download

> 📁 **File name pattern:** `CardPulse_February_2026.xlsx`

---

## 📊 XLSX Export Format

### 📐 Column Layout

The Excel sheet uses a fixed 8-column layout:

| Column | Header | Content | Width |
|:------:|:-------|:--------|:-----:|
| **A** | Date | Transaction date (DD/MM/YYYY) | 14 |
| **B** | Main Category | Primary category name | 22 |
| **C** | Sub-Category | Subcategory name | 22 |
| **D** | Amount | Transaction amount (#,##0.00) | 16 |
| **E** | Label | Primary label tag | 24 |
| **F** | *(spacer)* | Empty separator column | 4 |
| **G** | *Conversion rate =* | Static label text | 20 |
| **H** | *(rate value)* | User-specified conversion rate | 14 |

### 📋 Row Structure

The rows are organized in this order:

```
Row 1     │  🏷️ Title: "Monthly Expense Report — February 2026" (merged A1:E1)
Row 2     │  📊 Column headers (Date | Main Category | Sub-Category | Amount | Label)
Row 3+    │  💳 Transaction rows — sorted by category, then by date
          │     ... one row per transaction ...
Row N     │  ─── Separator ───
Row N+1   │  📊 Label summary header
Row N+2+  │  🏷️ Label rows — per-label totals (e.g., "Groceries: AED 1,234.56")
Row Last  │  🧮 Subtotal row — SUM formula for all transaction amounts
```

> 🔄 **Label rows** aggregate spending by label, giving you a cross-cutting view that complements the category-based transaction rows above.

---

## 🎨 Styling Details

The XLSX export uses precise professional styling to make the report print-ready:

### 🎯 Color Scheme

| Element | Color | Hex Code | Applied To |
|:--------|:------|:--------:|:-----------|
| 🔵 **Header background** | Blue | `#4472C4` | Row 2 (column headers) + label summary header |
| ⬜ **Header text** | White | `#FFFFFF` | Bold text on blue headers |
| 🟢 **Amount cells** | Light green fill | `#E2EFDA` | All amount values in column D |
| 🟡 **Label rows** | Light yellow fill | `#FFF2CC` | Entire row for label summary entries |
| 🏷️ **Title row** | Bold, larger font | — | Merged across A1:E1 |
| 📏 **Borders** | Thin light gray | `#D9D9D9` | All data cells (thin solid borders) |

### 🔢 Number Formatting

| Detail | Format |
|:-------|:-------|
| 💰 **Amounts** | `#,##0.00` — right-aligned |
| 📅 **Dates** | `DD/MM/YYYY` — left-aligned |
| 📝 **Text** | Left-aligned, regular weight |
| 🧮 **Subtotal** | Bold, `#,##0.00`, green fill |

### 📐 Column Widths

```
A (Date)          │ 14 characters
B (Category)      │ 22 characters
C (Sub-Category)  │ 22 characters
D (Amount)        │ 16 characters
E (Label)         │ 24 characters
F (Spacer)        │  4 characters
G (Conv. Label)   │ 20 characters
H (Rate)          │ 14 characters
```

> 🖨️ **Print-optimized.** Column widths are designed to fit on A4/Letter paper in landscape orientation without clipping.

---

## ⚙️ Export Options

### 🗓️ Month/Year Selector

Use the **◀ ▶ arrow buttons** to navigate between months. The export includes every transaction within the selected calendar month (1st through last day).

| Detail | Info |
|:-------|:-----|
| 📅 **Range** | Any month with transaction data |
| ⏪ **Navigation** | Arrow buttons to go forward/backward |
| 📊 **Scope** | Full calendar month (1st → last day) |

### 💱 Conversion Rate

The conversion rate allows you to display amounts in a secondary currency. The rate value appears in cell **H2** for reference.

| Setting | Description |
|:--------|:------------|
| 🔢 **Default** | `1` (no conversion — amounts displayed as-is) |
| 💱 **Example** | Enter `0.27` to approximate AED → USD conversion |
| 📍 **Location** | Displayed in column G/H of the header area |
| 🔄 **Effect** | For reference only — amounts in column D remain in your configured currency |

> 💡 **Tip:** The conversion rate is informational. It populates a reference cell in the spreadsheet so you (or your accountant) can apply the formula manually in Excel. Transaction amounts are not auto-multiplied.

---

## 💡 Tips & Notes

| Tip | Detail |
|:---:|:-------|
| 📂 | Export files are generated **on-demand** — they are not stored on the server |
| 🔒 | Exports run entirely locally — no data is uploaded or transmitted |
| 📊 | The label summary section helps reconcile per-card spending vs per-category spending |
| 📅 | If a month has zero transactions, the export will still generate with headers but no data rows |
| 🏦 | Each card's transactions are captured within the category rows — filter by the label column in Excel to isolate per-card spending |

> ⚠️ **Large months:** If you have hundreds of transactions in a single month, the XLSX file may take a moment to generate. The download will start automatically once ready.

---

← Previous: [Settings Reference](./08-Settings-Reference.md) | → Next: [Architecture Overview](./10-Architecture-Overview.md)
