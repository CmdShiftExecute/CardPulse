# 📦 05: EMI Tracker

> Manage installment plans across all your credit cards — track progress, auto-generate monthly transactions, and never miss a payment.

---

![EMI Tracker](../public/screenshots/emis.png)

---

## 📑 Table of Contents

- [What Are EMIs?](#-what-are-emis)
- [EMI Page Layout](#-emi-page-layout)
- [Adding an EMI](#-adding-an-emi)
- [EMI Form Fields](#-emi-form-fields)
- [Auto-Generation System](#-auto-generation-system)
- [EMI Progress Tracking](#-emi-progress-tracking)
- [EMIs on the Dashboard](#-emis-on-the-dashboard)
- [EMIs in Card Cycle Cards](#-emis-in-card-cycle-cards)
- [Completing an EMI](#-completing-an-emi)

---

## 💡 What Are EMIs?

EMIs (**Equated Monthly Installments**) are recurring monthly payments for a purchase split over time — for example, a phone bought on 12-month installments or a laptop on a 24-month plan.

CardPulse tracks EMIs separately from regular transactions because they have unique characteristics:

- 🔄 **Recurring schedule** — same amount charged every billing cycle
- 💳 **Card-specific** — each EMI is tied to a particular credit card
- 📊 **Affects billing** — EMI amounts are added to your card's estimated bill alongside regular purchases
- 📅 **Defined timeline** — clear start date, end date, and progress tracking
- ⚙️ **Optional auto-generation** — CardPulse can prompt you to create transaction entries each month

---

## 🏗️ EMI Page Layout

The EMI page (`/emis`) is organized into four distinct sections:

### 📊 Summary Strip

A compact overview bar at the top showing:

| Metric | Description |
|--------|-------------|
| 💰 **Total Monthly Burden** | Sum of all active EMI monthly amounts |
| 🔢 **Active EMI Count** | How many installment plans are currently running |
| ⏳ **Next Completing** | The EMI closest to finishing (e.g., "Laptop — 2 months left") |

### 🔄 Cycle Visualization

A premium vertical timeline showing EMIs grouped by billing cycle:

- **This Cycle** — EMIs charging in the current billing period, grouped by card with per-card subtotals
- **Next Cycle** — EMIs charging in the following period

Each group displays visual orbs **sized by amount**, giving you an instant sense of relative impact across cards.

### 🟢 Active EMI Cards

Individual display cards for each active EMI, each showing:

- 📱 Description (e.g., "Laptop Purchase")
- 💳 Assigned card with color indicator
- 💵 Monthly installment amount
- 📊 Progress bar with months paid / total months
- ⏳ Months remaining and expected completion date

### ✅ Completed EMIs

A collapsed section at the bottom showing finished EMIs with their completion dates. Expand to review historical installment plans — useful for tracking past purchases and their total costs.

---

## ➕ Adding an EMI

1. Navigate to the EMI page (`/emis`)
2. Click the **Add EMI** button
3. Fill in the required fields (see table below)
4. Click **Save**

> 💡 **Tip:** If you know the total purchase price, enter it as "Original Amount" for reference. The monthly installment amount is what gets tracked and potentially auto-generated as a transaction.

---

## 📋 EMI Form Fields

| Field | Required | Description |
|-------|----------|-------------|
| 💳 **Card** | Yes | Which credit card the EMI is charged to |
| 📝 **Description** | Yes | Name of the purchase (e.g., "Laptop", "Smart Device") |
| 💵 **Monthly Amount** | Yes | The installment amount charged each billing cycle |
| 📅 **Total Months** | Yes | Total tenure of the plan (e.g., 12, 24, 36) |
| 🔢 **Months Remaining** | Auto | Defaults to total months for new EMIs. Decrements as transactions are generated |
| 📆 **Start Date** | Yes | When the EMI plan started (YYYY-MM-DD) |
| 💰 **Original Amount** | No | Total purchase price for reference (not used in calculations) |
| 📂 **Category** | No | Auto-categorize generated transactions (e.g., Shopping > Electronics) |
| 📁 **Subcategory** | No | Filtered by the selected category |
| 🏷️ **Labels** | No | Auto-label generated transactions (e.g., "Buy Now Pay Later") |
| 📄 **Notes** | No | Additional context or details |
| ⚙️ **Auto-generate** | Toggle | Default **ON**. When enabled, CardPulse prompts you each month to generate a transaction entry |

---

## 🔄 Auto-Generation System

When **auto-generate is ON**, CardPulse checks on page load whether any EMIs need transactions generated for the current month. Here's the complete 5-step flow:

### Step-by-Step Flow

```
┌───────────────┐
│  1️⃣  CHECK     │  On dashboard/transactions page load,
│               │  check if last_generated < current month
└───────┬───────┘
        ▼
┌───────────────┐
│  2️⃣  PROMPT    │  Show confirmation dialog listing each
│               │  EMI that needs generating + amounts
└───────┬───────┘
        ▼
┌───────────────┐
│  3️⃣  CONFIRM   │  You review the list and click Confirm
│               │  — one transaction per EMI is created
└───────┬───────┘
        ▼
┌───────────────┐
│  4️⃣  TRACK     │  last_generated → current month
│               │  months_remaining decrements by 1
└───────┬───────┘
        ▼
┌───────────────┐
│  5️⃣  COMPLETE  │  When months_remaining hits 0,
│               │  EMI auto-marks as inactive 🎉
└───────────────┘
```

### What Gets Created

Each auto-generated transaction includes:

| Field | Value |
|-------|-------|
| **Amount** | The EMI's monthly installment amount |
| **Description** | `[EMI] Laptop` — prefixed with `[EMI]` for visual distinction |
| **Category / Subcategory** | From the EMI form (if configured) |
| **Card** | The EMI's assigned credit card |
| **Labels** | From the EMI form (if configured) |
| **Date** | Current date at time of generation |

> ⚠️ **Important: EMIs are NEVER silently auto-generated.** You always see the confirmation prompt first and must explicitly approve. This prevents duplicate entries if you've already manually recorded the payment for that month.

---

## 📊 EMI Progress Tracking

Each EMI card displays a visual progress bar showing how far along the installment plan is:

```
📱 Smart Device
   Example Card  ···XXXX

   AED 400 / month
   Original: AED 5,000

   ████████████░░░░░░  8 of 12 paid
   4 months remaining
   Completes: Jun 2026
```

**How progress is calculated:**

- **Bar fill** = `(total_months - months_remaining) / total_months`
- **Completion date** = start date + total months tenure
- **Color** = green when ≥75% complete, default accent otherwise

---

## 🏠 EMIs on the Dashboard

EMIs surface in two dashboard sections:

### 📊 EMI Summary Strip

A compact collapsible bar in the lower dashboard showing:

- 💰 Total monthly EMI burden across all cards
- 🔢 Count of active installment plans
- ⏳ Next EMI to complete (e.g., "Laptop — 2 months left")

### 📈 EMI Status Section

Located in the **Top Transactions & EMI Status** card (Row 2, right side):

- 💵 **Monthly burden** — total EMI amount across all cards
- 🔢 **Active count** — number of installment plans
- 📊 **Per-EMI progress bars** — individual bars for each EMI with months paid / total
- ⏳ **Next completing** — highlights the EMI closest to finishing
- Progress bars turn green when an EMI reaches ≥75% completion

---

## 💳 EMIs in Card Cycle Cards

On both the **Dashboard** (Card Cycle Status section) and the **Analytics > Cycles** tab, card cycle cards show a **purchase + EMI breakdown**:

```
┌───────────────────────────────────┐
│  Example Card   ···XXXX           │
│  Cycle: 2 Jan → 1 Feb            │
│                                   │
│  🛒 New Purchases     AED X,XXX   │
│  📦 EMI Installments  AED   XXX   │
│  ──────────────────────────       │
│  📋 Estimated Bill    AED X,XXX   │
│                                   │
│  ██████████░░░░  63% of limit     │
└───────────────────────────────────┘
```

This gives you the **complete picture** of what's owed on each card — not just new spending, but the fixed EMI installments that are also billed to that card every cycle.

---

## ✅ Completing an EMI

EMIs can complete in two ways:

### 🤖 Automatic Completion

When `months_remaining` reaches **0** after generating the final transaction:

1. The EMI is automatically marked as `is_active = 0`
2. It moves to the **Completed EMIs** section
3. A celebration toast appears: "🎉 Laptop EMI completed!"
4. The EMI no longer appears in active calculations, billing estimates, or cycle cards

### ✋ Manual Completion

Click **Mark Complete** on any active EMI card to finish it early — useful when you've:

- Paid off the remaining balance in a lump sum
- Cancelled the installment plan with the bank
- Refinanced the remaining amount to a different card

Completed EMIs are preserved for historical reference. All past transactions generated by the EMI remain in your transaction history and continue to appear in analytics.

---

| | |
|---|---|
| ← Previous: [Card Management](./04-Card-Management.md) | → Next: [Analytics Deep Dive](./06-Analytics-Deep-Dive.md) |
