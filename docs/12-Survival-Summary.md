<div align="center">

[<img src="../public/logo/cardpulse_logo_sage.svg" alt="CardPulse" width="64" />](../README.md)

**[CardPulse](../README.md)** &middot; Documentation

</div>

<br />

# 🌱 12: Survival Summary

> A dedicated tab on the EMI page that answers a single question: **how much does my life cost every month, and when do my installments end?** The Survival Summary blends your active EMI burden with your fixed monthly costs to surface a single "cost of living" number — and projects how that number changes as installments close out over the next 18 months.

---

![Survival Summary](../public/screenshots/survival-summary.png)

---

## 📑 Table of Contents

- [Why Survival Summary?](#-why-survival-summary)
- [Page Layout](#-page-layout)
- [Cost of Living Hero](#-cost-of-living-hero)
- [EMI Burden Panel](#-emi-burden-panel)
- [Fixed Costs Panel](#-fixed-costs-panel)
- [18-Month Projection Chart](#-18-month-projection-chart)
- [Closure Schedule](#-closure-schedule)
- [How Fixed Costs Are Managed](#-how-fixed-costs-are-managed)

---

## 💡 Why Survival Summary?

The EMI tracker already tells you *what's running*. The dashboard already tells you *what cards owe what*. But neither answers a more fundamental planning question:

> *"If I lost my income today, what is the smallest amount I need every month to keep the lights on and stay current on my installments?"*

That number is your **monthly cost of living** — the floor below which you cannot drop. Survival Summary surfaces it as one large headline, decomposes it into its two components (EMIs + fixed costs), and visualises how it shrinks over time as installments naturally complete.

It is **not** a budgeting tool — it is a survival-floor tool. Everything discretionary (dining out, shopping, travel) is excluded by design.

---

## 🏗️ Page Layout

Survival Summary lives as the **default tab** on the `/emis` page. A second tab, `EMI Tracker`, retains the original EMI-management UI.

```
/emis
 ├── 🌱  Survival Summary   (default)
 └── 📦  EMI Tracker
```

The page is composed of four stacked sections:

| Section | Purpose |
|--------|---------|
| 🏆 **Cost of Living Hero** | One big number — EMI burden + fixed costs |
| 📊 **EMI + Fixed two-column panel** | Side-by-side breakdown of each component |
| 📈 **18-Month Projection Chart** | Area chart showing the cost curve dropping as EMIs close |
| 📋 **Closure Schedule** | Table of upcoming EMI completions and resulting burden drops |

---

## 🏆 Cost of Living Hero

The hero card displays your **total survival floor** — the sum of:

- **EMI monthly burden** — sum of `monthlyAmount` across all active EMIs
- **Fixed costs** — sum of all entries on the Fixed Costs settings page

Below the headline are two thin meta lines:

- *"X EMIs running · next closes in N months"*
- *"Y fixed cost entries"*

The number animates in with a count-up on load and re-animates whenever the underlying data changes.

---

## 📦 EMI Burden Panel

A scrollable list of every active EMI, sorted by `monthsRemaining` ascending (the ones closing soonest are on top). Each row shows:

| Column | What it shows |
|--------|---------------|
| Description | The EMI name (e.g. "Laptop installment") |
| Card chip | A pill in the card's color showing the card name |
| Months left | `N / total` — e.g. `4 / 12` |
| Monthly amount | The recurring monthly charge |

A subtotal at the bottom shows the total monthly EMI burden across all rows.

> Tap a row to jump to the EMI Tracker tab pre-filtered to that EMI.

---

## 🏠 Fixed Costs Panel

The fixed-costs side of the panel lists every entry from your **Fixed Costs settings** (see [How Fixed Costs Are Managed](#-how-fixed-costs-are-managed) below). Each row shows the icon, name, and monthly amount. The subtotal sums them.

If you haven't added any fixed costs yet, the panel shows an empty-state CTA linking to **Settings → Fixed Costs**.

---

## 📈 18-Month Projection Chart

A theme-coloured area chart projects your monthly cost of living for the next 18 months. Each month, the chart subtracts the monthly amounts of any EMIs that complete in or before that month, leaving you with `(remaining EMIs + fixed costs)`.

| Element | Description |
|---------|-------------|
| 🟢 **Y-axis** | Total monthly cost in your configured currency |
| 📅 **X-axis** | Months ahead (current month → +17 months) |
| 🔻 **Step-downs** | Visible drops mark EMI completion months |
| 💬 **Tooltip** | Hover any month to see the exact figure |

The curve is **monotonic non-increasing** — it can only flatten or drop as EMIs end. The floor it eventually approaches is your **fixed-cost-only** monthly spend.

---

## 📋 Closure Schedule

A chronologically-sorted table of every active EMI's **last installment date**, computed as:

```
lastInstallmentDate = startDate + (totalMonths − 1) months
```

| Column | Description |
|--------|-------------|
| 📅 **Date** | The month and year of the final installment (e.g. *14 Aug 2026*) |
| 💳 **Card** | The card pill |
| 📦 **EMI** | The EMI description |
| − **Amount** | How much your monthly burden drops by once this EMI closes |
| 📉 **Burden after** | Your new total cost of living after this completion |

The "Burden after" column gives you a running ledger — you can see exactly how the floor walks down month-by-month as each EMI retires.

---

## ⚙️ How Fixed Costs Are Managed

Fixed costs are managed from **Settings → Fixed Costs**. Each entry is a simple record:

| Field | Description |
|-------|-------------|
| 🏷️ **Name** | e.g. *Rent*, *Internet*, *Groceries* |
| 💰 **Monthly amount** | The recurring monthly charge in your configured currency |
| 🎨 **Icon** | One of 11 preset Lucide icons (Home, Wifi, Zap, Pill, etc.) |
| 🌈 **Color** | One of 10 preset accent colors |

CRUD is inline — add, edit, and delete without leaving the page. All changes propagate to the Survival Summary on next mount.

> 📌 **Tip:** Keep fixed costs honest. Things like "I might travel next month" don't belong here. Survival Summary only works if its inputs are the **floor**, not the typical spend.

---

## 🔗 Related

- [📦 05: EMI Tracker](./05-EMI-Tracker.md) — the companion tab for managing the EMIs themselves
- [💚 13: Financial Health Card](./13-Financial-Health.md) — uses the same fixed-costs data to compute dashboard sentiment
- [⚙️ 08: Settings Reference](./08-Settings-Reference.md) — full reference for all settings, including Fixed Costs
