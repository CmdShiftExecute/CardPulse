# 🎯 07: Budgets

> Set monthly spending limits by category, track progress with visual indicators, and catch overspending before it happens.

---

![Budgets Page](../public/screenshots/budgets.png)

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Creating a Budget](#-creating-a-budget)
- [Budget Progress Display](#-budget-progress-display)
- [Budget Thresholds](#-budget-thresholds)
- [Budgets on the Dashboard](#-budgets-on-the-dashboard)
- [Budgets in Analytics](#-budgets-in-analytics)
- [Editing and Deleting Budgets](#%EF%B8%8F-editing-and-deleting-budgets)

---

## 🗺️ Overview

The Budgets page (`/budgets`) lets you set **monthly spending limits** per category or subcategory. CardPulse automatically tracks your actual spending against these limits and provides visual progress indicators across the app.

**Key characteristics:**

- 📅 **Monthly scope** — budgets are set for a specific month and year
- 📂 **Category or subcategory level** — set a broad limit on "Food & Drinks" or a specific limit on "Groceries"
- 🔄 **Month navigator** — browse different months to set or review budgets
- 📊 **Live tracking** — progress bars update as new transactions are added
- 🌐 **Cross-app visibility** — budgets appear on the Dashboard, Analytics page, and the Budgets page itself

---

## ➕ Creating a Budget

1. Navigate to `/budgets`
2. Click **Add Budget**
3. Fill in the form:

| Field | Required | Description |
|-------|----------|-------------|
| 📂 **Category** | Yes | Main spending category (e.g., Food & Drinks, Shopping, Vehicle) |
| 📁 **Subcategory** | No | Optional subcategory for more specific limits (e.g., Groceries, Fuel). Leave empty to set a **category-level** budget that covers all subcategories |
| 💰 **Amount** | Yes | Monthly spending limit in your configured currency. Must be a positive number |

4. Click **Save**

> 💡 **Tip:** Each (category, subcategory, month, year) combination is unique. If a budget already exists for the same combination, the existing budget will be updated with the new amount rather than creating a duplicate.

### 📋 Example Budgets

| Category | Subcategory | Amount | What It Tracks |
|----------|-------------|--------|----------------|
| Food & Drinks | — | AED 2,000 | All food spending combined |
| Food & Drinks | Groceries | AED 800 | Grocery spending only |
| Vehicle | Fuel | AED 500 | Fuel expenses only |
| Life & Entertainment | — | AED 1,000 | All entertainment spending |

---

## 📊 Budget Progress Display

Each budget appears as a card with a visual progress indicator:

```
┌──────────────────────────────────────────┐
│  🍽️  Food & Drinks                       │
│  Groceries                    AED 800    │
│                                          │
│  ████████░░░░░░░░░░░░  62% spent         │
│  AED 496 / AED 800                       │
│                                          │
│  AED 304 remaining                       │
└──────────────────────────────────────────┘
```

**What's shown on each budget card:**

- 📂 **Category** and subcategory (if set)
- 💰 **Budget amount** — the spending limit you defined
- 📊 **Progress bar** — fills based on `actual spending / budget amount`
- 🔢 **Spent vs budget** — e.g., "AED 496 / AED 800"
- 💵 **Remaining** — how much headroom is left

The progress bar color changes dynamically based on how close you are to the limit (see thresholds below).

---

## 🚦 Budget Thresholds

Visual thresholds are **consistent everywhere** budgets appear — the Budgets page, Dashboard strip, and Analytics tab all use the same color rules:

| Utilization | Color | Visual Indicator | Meaning |
|-------------|-------|------------------|---------|
| **< 75%** | 🟢 Green (`#7DD3A8`) | Green progress bar | ✅ On track — spending is well within limits |
| **75–100%** | 🟡 Gold (`#D4B878`) | Gold progress bar | ⚠️ Approaching limit — be mindful of remaining spending |
| **≥ 100%** | 🔴 Red (`#C87070`) | Red progress bar, may overflow past 100% | 🚨 Over budget — spending has exceeded the limit |

---

## 🏠 Budgets on the Dashboard

The **Budget Strip** appears as a collapsible section in the lower dashboard. It provides a compact at-a-glance view of all active budgets for the current month.

**What you see:**

- 📂 Category name
- 📊 Mini progress bar with threshold colors
- 🔢 Spent amount vs budget amount
- 📈 Percentage spent

This gives you a quick budget health check without leaving the dashboard. Click the section header to expand or collapse.

> 💡 **Tip:** If no budgets are set for the current month, the Budget Strip won't appear. Set at least one budget from the Budgets page to see it on the dashboard.

---

## 📈 Budgets in Analytics

The **Budgets tab** (tab 7) in the Analytics page shows the same budget-vs-actual progress bars in a dedicated view. This is functionally identical to the Budgets page but integrated into the analytics context, making it easy to review budgets alongside spending trends, card breakdowns, and other analytical data.

See [Analytics Deep Dive > Budgets](./06-Analytics-Deep-Dive.md#7--budgets) for details.

---

## ✏️ Editing and Deleting Budgets

### ✏️ Editing

- Click the **edit button** on any budget card
- Modify the amount (category and subcategory cannot be changed — delete and recreate instead)
- Click **Save** to apply the updated limit

### 🗑️ Deleting

- Click the **delete button** on any budget card
- A **confirmation prompt** appears before deletion
- Confirm to remove the budget

> ⚠️ **Note:** Deleting a budget removes only the spending limit — it does **not** affect any transactions. Your transaction history and analytics remain unchanged. You can always recreate a budget for the same category/subcategory/month combination.

---

| | |
|---|---|
| ← Previous: [Analytics Deep Dive](./06-Analytics-Deep-Dive.md) | → Next: [Settings Reference](./08-Settings-Reference.md) |
