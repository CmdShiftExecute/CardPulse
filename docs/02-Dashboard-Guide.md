# 📊 02: Dashboard Guide

> The CardPulse dashboard is a **single-glance financial command center** — everything from payment due dates to credit utilization to spending breakdowns, all in one view.

![CardPulse Dashboard](../public/screenshots/dashboard.png)

---

## 📑 Table of Contents

- 🌐 [Overview](#-overview)
- 📢 [Payment Ticker](#-payment-ticker)
- 🏆 [Monthly Hero Card](#-monthly-hero-card)
- 💸 [Upcoming Payments](#-upcoming-payments)
- 🔝 [Top Transactions & EMI Status](#-top-transactions--emi-status)
- 🍩 [Category & Label Donuts](#-category--label-donuts)
- 📋 [Recent Transactions](#-recent-transactions)
- 📏 [Budget Strip](#-budget-strip)
- 🔄 [EMI Summary](#-emi-summary)
- 💳 [Credit Overview](#-credit-overview)
- 🏦 [Card Cycle Status](#-card-cycle-status)
- 📐 [Collapsible Sections](#-collapsible-sections)

---

## 🌐 Overview

The dashboard is structured in **layers of priority**:

| Layer | Sections | Visibility |
|:-----:|:---------|:-----------|
| 🔴 **Always visible** | Hero Card, Upcoming Payments, Top Transactions | Fixed at top |
| 🟡 **Collapsible** | Donuts, Recent Txns, Budgets, EMIs, Credit, Cycles | Click to expand |

Data refreshes automatically on page load. The **month navigator** (← Feb 2026 →) controls which month's data is displayed across all sections.

---

## 📢 Payment Ticker

A **scrolling marquee** in the header bar that keeps you aware without taking focus:

- 🔴 **Card payments** — Each card's estimated bill with due date countdown
  - Unpaid cards glow in neon red (`#FF4D4D`)
  - Paid cards display in calm green
- 🏷️ **Top spends** — Your highest-spending labels for the current month
  - Label names in periwinkle (`#8B9DC3`)
  - Amounts in sand (`#D8C49A`)

> 📱 **Hidden on mobile** to save screen space. Refreshes every 5 minutes and silently handles API failures — if the server is momentarily unreachable, the ticker simply pauses.

---

## 🏆 Monthly Hero Card

The main summary at the top of the dashboard — your month at a glance.

### 💳 Per-Card Breakdown

Instead of a single total, the hero card shows each card's spending in a **responsive grid**:

| # Cards | Layout |
|:-------:|:-------|
| 0 | Centered `AED 0.00` |
| 1 | Single centered card column |
| 2 | Two-column grid |
| 3–5 | Responsive 3/4/5-column grid |

Each card column displays:
- 🎨 **Color dot** matching the card's assigned color
- 🏷️ **Card name** (with " Card" suffix removed for brevity)
- 💰 **Animated amount** (CountUp animation, JetBrains Mono font)
- 🔢 **Transaction count** for the month

> ➕ When 2+ cards have data, a **total line** appears: `TOTAL AED X,XXX.XX · Y transactions`

### 📅 Month Navigation

- ⬅️ ➡️ Use arrow buttons to browse months
- 🚫 Right arrow is disabled when viewing the current month
- 📈 A **percentage badge** shows month-over-month change (green ↓ for decrease, red ↑ for increase)

---

## 💸 Upcoming Payments

The **left card** in Row 2 shows payment due dates grouped by date:

### 📋 Collapsed View
- 📅 Due date + countdown badge (e.g., `3d`)
- 💰 Total amount due across all cards on that date

### 📂 Expanded View (click to toggle)
- 💳 Individual card rows with amounts
- ✅ **Mark Paid** button per card
- 🏷️ "Last Cycle" / "Current Cycle" badges to show which billing period

### 🎨 Urgency Color Coding

| Condition | Color | Meaning |
|:---------:|:-----:|:--------|
| ≤ 5 days | 🔴 Red | Payment due very soon |
| ≤ 14 days | 🟡 Gold | Payment approaching |
| Marked paid | 🟢 Green | All settled |

### 📊 Cycle Progress

Below the payment groups, **per-card progress bars** show:
- 📏 Day X of Y in the current billing cycle
- 📄 Days until statement generation
- 💸 Days until payment due date
- 🔴 Red highlight when ≤5 days to due, 🟡 gold when ≤14 days

---

## 🔝 Top Transactions & EMI Status

The **right card** in Row 2 contains two sections:

### 🏅 Top Transactions

The **10 largest transactions** ranked by amount:

| Column | Details |
|:-------|:--------|
| 🥇 Rank | Position number (1–10) |
| 🎨 Card dot | Color-coded to the card |
| 🏪 Merchant | Description or merchant name |
| 📅 Date + Category | When and what type |
| 💰 Amount | JetBrains Mono, right-aligned |

**🗓️ Independent month picker:** An `[‹] Feb 2026 [›] [All]` control lets you browse different months or view **all-time** top transactions. The picker syncs with the main month navigator until you manually override it.

### 📦 EMI Status

Visible when active EMIs exist:
- 💰 **Monthly burden** — Total EMI amount across all cards
- 🔢 **Active count** — Number of installment plans
- 📊 **Progress** — Per-EMI rows with progress bars (green at ≥75% completion)
- 🏁 **Next completing** — Highlights the EMI closest to finishing

---

## 🍩 Category & Label Donuts

Two **side-by-side interactive donut charts** in a collapsible section:

![Category & Label Donuts](../public/screenshots/dashboard-donuts.png)

### 🥧 Category Donut (left)

- 📊 Top 6 spending categories + "Other"
- 👆 **Click any slice** to drill into subcategory breakdown
- ⬅️ A **Back** button returns to the main category view
- 🏷️ In drill-down mode, connected labels appear as chips below the chart
- 🎯 Center displays the total amount

### 🏷️ Label Donut (right)

- 📊 Top 7 labels + "Other" with a distinct sand/lavender palette
- 👆 **Click any label** to see which categories it connects to
- 🔢 Shows transaction count per label in the legend

> 📈 **Want more detail?** Visit the [Analytics page](./06-Analytics-Deep-Dive.md) for trends, comparisons, and deep breakdowns.

---

## 📋 Recent Transactions

A compact list of the **last 10 transactions** showing:
- 📅 Date (formatted per your settings)
- 📝 Description and merchant
- 💰 Amount (monospace font, right-aligned)
- 🏷️ Category/subcategory badges
- 💳 Card badge (color-coded)

---

## 📏 Budget Strip

A quick-reference bar showing **budget progress per category**:

| Utilization | Color | Meaning |
|:-----------:|:-----:|:--------|
| < 75% | 🟢 Green | On track |
| 75–100% | 🟡 Gold | Approaching limit |
| > 100% | 🔴 Red | Over budget |

> 💡 See [Budgets](./07-Budgets.md) for full budget management — setting limits, editing, and analytics.

---

## 🔄 EMI Summary

A compact strip showing:
- 💰 **Total monthly EMI burden** across all cards
- 🔢 **Count** of active EMIs
- 🏁 **Next completing** — e.g., "Laptop — 2 months left"

> 📖 See [EMI Tracker](./05-EMI-Tracker.md) for full EMI management.

---

## 💳 Credit Overview

Aggregated **credit utilization** across all cards in a collapsible section:

### 📊 Summary Row

| Metric | Description |
|:-------|:------------|
| 🏦 **Total Credit Limit** | Sum of all card limits |
| 📉 **Total Used** | Current cycle spend + EMI installments |
| 💚 **Available Credit** | Limit minus used |

### 🎨 Utilization Thresholds

| Utilization | Color | Visual Effect |
|:-----------:|:-----:|:-------------|
| < 75% | 🟢 Green | Normal display |
| 75–100% | 🟡 Gold | Gold progress bar + warning text |
| ≥ 100% | 🔴 Red | Red danger glow + warning banner |

### 💳 Per-Card Breakdown
Individual progress bars showing each card's usage versus its credit limit.

---

## 🏦 Card Cycle Status

Detailed billing cycle cards for each active credit card (collapsible section):

Each card shows:
- 🏷️ Card name, bank, last 4 digits
- 📅 Current cycle date range (e.g., "Feb 2 → Mar 1")
- 📊 **Purchases vs. EMI breakdown:**
  ```
  New Purchases     AED 1,245
  EMI Installments  AED   650
  ─────────────────────────
  Estimated Bill    AED 1,895
  ```
- 📏 Utilization percentage bar with danger/warning highlighting
- ⏰ Days until statement and days until due date

> ⚠️ Cards with high utilization (≥75%) get **gold borders**; over-limit cards (≥100%) get a **red danger glow**.

---

## 📐 Collapsible Sections

Sections below Row 2 are wrapped in **collapsible containers**:

| Section | Default State |
|:--------|:-------------|
| 🍩 Category & Label Donuts | Collapsed |
| 📋 Recent Transactions | Collapsed |
| 📏 Budget Strip | Collapsed |
| 🔄 EMI Summary | Collapsed |
| 💳 Credit Overview | Collapsed |
| 🏦 Card Cycle Status | Collapsed |

👆 **Click any section header** to expand or collapse. This keeps the dashboard clean and focused while giving you access to everything in one place.

---

← Previous: [Getting Started](./01-Getting-Started.md) | → Next: [Transaction Entry](./03-Transaction-Entry.md)
