<div align="center">

<img src="public/screenshots/banner.png" alt="CardPulse" width="100%" />

<br />

### *A quieter view of your spending.*

A privacy-first credit card expense tracker with **smart NLP entry**, **multi-card billing cycle management**, **6 color themes**, and **deep analytics** — built entirely offline with no cloud dependencies.

[![Next.js](https://img.shields.io/badge/Next.js-14.2-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-Local--First-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![Recharts](https://img.shields.io/badge/Recharts-3.7-22B5BF?style=for-the-badge)](https://recharts.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-7EB89E?style=for-the-badge)](./LICENSE)
[![Version](https://img.shields.io/badge/v2.1.0-CardPulse-C4AA78?style=for-the-badge)](./package.json)

<br />

[![Live Demo](https://img.shields.io/badge/▶_Live_Demo-CardPulse-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://cardpulse-lilac.vercel.app)

**See CardPulse in action with sample data**

<br />

[![Deploy Your Own](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/CmdShiftExecute/CardPulse)

<br />

> 🔒 **Your financial data never leaves your machine.** No cloud. No API calls. No telemetry. Just you and your SQLite database.

</div>

---

## ✨ Key Features

<table>
<tr>
<td width="50%" valign="top">

### 🧠 Smart Transaction Entry
- **NLP Quick Add** — type `"enoc 200 fab card yesterday"` and the offline parser extracts amount, category, card, date, and labels
- **Manual Entry** — full form with dropdowns for when you want control
- **Self-Learning** — correct a parse and it remembers for next time
- **91 pre-seeded keyword rules** for popular merchants

### 💳 Multi-Card Management
- Track 5+ credit cards with real billing cycles
- Statement dates, due dates, credit limits
- **Credit utilization tracking** with color-coded thresholds
- **Card aliases** for NLP recognition

### 🏠 Smart Dashboard
- Per-card spending breakdown
- Payment ticker with due date countdowns
- Category & label donuts with click-to-drill
- Credit utilization overview
- **💚 Financial Health Card** with 6-level mood face based on debt-to-income ratio

### 📊 Rich Analytics (7 tabs)
- **Trends** — overall, category, and label spending over time
- **Compare** — month-vs-month grouped bars and delta tables
- **Monthly Drilldown** — interactive donut charts
- **Cycles** — 3-cycle billing timeline per card
- **Cards** — per-card area charts and grouped bars
- **EMIs** — installment landscape view
- **Budgets** — budget vs. actual progress

### 🎨 Theme System
- **6 themes** — Sage, Midnight, Cyberpunk, Molten, Mono, Terminal
- **Dark + Light modes** — 12 visual combinations
- CSS variable architecture with instant switching
- Flash-prevention for seamless page loads

</td>
<td width="50%" valign="top">

### 📦 EMI Tracker
- Manage installment plans across cards
- **Auto-generation prompts** each billing cycle
- Progress tracking with completion dates
- EMI amounts reflected in card cycle estimates

### 🌱 Survival Summary
- EMI-page tab: monthly cost-of-living floor
- **EMI burden + fixed costs** combined into one number
- **18-month projection chart** as installments roll off
- Closure schedule of when each EMI ends

### 🎯 Budget Management
- Set monthly budgets per category or subcategory
- Visual progress bars (🟢 green / 🟡 gold / 🔴 red)
- Dashboard strip + analytics tab

### 📥 Export Reports
- **Styled XLSX** with blue headers, green amounts, label summaries
- Month selector + currency conversion rate
- Professional formatting ready for sharing

### ⚙️ Full Settings
- Currency, date format, number format
- 6 color themes × 2 modes
- PIN security (enable/disable/change)
- **Database backup & restore**
- Keyword rules, labels, and categories management

</td>
</tr>
</table>

---

## 📸 Screenshots

### 🏠 Dashboard

The home view leads with a **Financial Health Card** that condenses your monthly commitments into a single survival figure, followed by the Monthly Hero and per-card breakdown.

<img src="public/screenshots/dashboard-1-survival.png" alt="Dashboard — Financial Health Card and Monthly Hero" width="100%" />

<br /><br />

<img src="public/screenshots/dashboard-2-upcoming-payments.png" alt="Dashboard — Upcoming Payments, Top Transactions and EMI Status" width="100%" />

<details>
<summary><b>More from Dashboard</b></summary>
<br />
<img src="public/screenshots/dashboard-3-category-label-donuts.png" alt="Dashboard — Spend by Category and Label donuts, Recent Transactions" width="100%" />
<br /><br />
<img src="public/screenshots/dashboard-4-budget-tracking.png" alt="Dashboard — Budget Tracking strip and EMI burden summary" width="100%" />
<br /><br />
<img src="public/screenshots/dashboard-5-credit-overview.png" alt="Dashboard — Credit Overview and Card Cycle Status" width="100%" />
</details>

---

### ✏️ Transactions

Add by typing — the offline NLP parser extracts amount, category, card, date, and labels. Switch to manual entry whenever you want full control.

<img src="public/screenshots/transactions-1-list.png" alt="Transactions list with Quick Add input and filters" width="100%" />

<br /><br />

<img src="public/screenshots/transactions-2-manual-entry.png" alt="Manual Entry form with amount, date, category, card, labels and notes" width="100%" />

---

### 💳 Cards

<img src="public/screenshots/cards.png" alt="Cards page — billing cycles, credit limits, utilization per card" width="100%" />

---

### 📦 EMIs — Survival & Tracker

A two-tab page. **Survival** turns active installments and fixed costs into a monthly cost-of-living number and projects when each EMI rolls off. **EMI Tracker** manages the installments themselves.

<img src="public/screenshots/emis-1-cost-of-living.png" alt="EMIs — Monthly Cost of Living, EMI Burden by Card, Fixed Monthly Costs" width="100%" />

<br /><br />

<img src="public/screenshots/emis-2-burden-projection.png" alt="EMIs — 18-month Burden Projection chart and Closure Schedule" width="100%" />

<details>
<summary><b>More from EMIs</b></summary>
<br />
<img src="public/screenshots/emis-3-emi-tracker.png" alt="EMI Tracker tab — Generate transactions banner, Cycle Timeline, EMI by Card" width="100%" />
<br /><br />
<img src="public/screenshots/emis-4-active-installments.png" alt="EMI Tracker — Active Installments grid" width="100%" />
</details>

---

### 📊 Analytics (7 tabs)

Seven views over the same dataset: long-term trends, month-vs-month comparison, monthly drilldown donuts, billing-cycle timelines, per-card bars, EMI distribution, and budget vs actual.

<img src="public/screenshots/analytics-1-trends.png" alt="Analytics — Trends tab with Overall Spending Trend chart" width="100%" />

<br /><br />

<img src="public/screenshots/analytics-2-compare.png" alt="Analytics — Compare tab with month-vs-month bars and delta table" width="100%" />

<details>
<summary><b>More from Analytics</b></summary>
<br />
<img src="public/screenshots/analytics-3-monthly.png" alt="Analytics — Monthly Drilldown with category and label donuts" width="100%" />
<br /><br />
<img src="public/screenshots/analytics-4-cycles.png" alt="Analytics — Cycles tab with three-cycle timeline per card" width="100%" />
<br /><br />
<img src="public/screenshots/analytics-5-cards.png" alt="Analytics — Cards tab with card-wise spending bars" width="100%" />
<br /><br />
<img src="public/screenshots/analytics-6-emi.png" alt="Analytics — EMIs tab with EMI Distribution by Card and Timeline Horizon" width="100%" />
<br /><br />
<img src="public/screenshots/analytics-7-budget.png" alt="Analytics — Budgets tab with Budget vs Actual progress bars" width="100%" />
</details>

---

### 🎯 Budgets

<img src="public/screenshots/budgets-1-set-budget.png" alt="Budgets page with Set Budget modal" width="100%" />

---

### ⚙️ Settings

Nine sections covering currency, fixed costs, appearance, security, cards, NLP keyword rules, labels, categories, and database export/import. Defaults are sensible; nothing leaves your machine.

<img src="public/screenshots/settings-1-general.png" alt="Settings — General: currency, date format, number format, household income" width="100%" />

<br /><br />

<img src="public/screenshots/settings-5-fixed-costs.png" alt="Settings — Fixed Costs: add monthly obligations with icon and color" width="100%" />

<details>
<summary><b>More from Settings</b></summary>
<br />
<img src="public/screenshots/settings-2-labels.png" alt="Settings — Labels manager" width="100%" />
<br /><br />
<img src="public/screenshots/settings-3-categories.png" alt="Settings — Categories tree (read-only)" width="100%" />
<br /><br />
<img src="public/screenshots/settings-4-data-management.png" alt="Settings — Data Management: export, import, reset" width="100%" />
</details>

---

### 💚 Financial Health Card — close-up

A standalone view of the dashboard's signature card. Six mood faces map the ratio of monthly commitments to income, from *Thriving* to *Underwater*.

<img src="public/screenshots/dashboard-6-financial-health-card.png" alt="Financial Health Card close-up showing Required to survive next month, card bills, fixed monthly costs and per-card outstanding" width="100%" />

---

## 🚀 Quick Start

### Option 1: npm (requires Node.js)

```bash
# Clone the repository
git clone https://github.com/CmdShiftExecute/CardPulse.git
cd CardPulse

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Option 2: Docker (no Node.js required)

```bash
# Clone the repository
git clone https://github.com/CmdShiftExecute/CardPulse.git
cd CardPulse

# Build and run
docker build -t cardpulse .
docker run -p 3000:3000 -v $(pwd)/data:/app/data cardpulse
```

Open **http://localhost:3000** — you'll be guided through PIN setup on first launch.

> The `-v` flag mounts the `data/` folder so your SQLite database persists across container restarts.

### 🎬 First Run

| Step | What Happens |
|------|-------------|
| 1️⃣ | Database auto-created with categories, labels, keyword rules |
| 2️⃣ | Create your PIN (4–6 digits, bcrypt-hashed) |
| 3️⃣ | Dashboard loads — add your first transaction via Quick Add |
| 4️⃣ | Explore Analytics once you have a few transactions |

> 💡 **Tip:** The PIN can be disabled from Settings > Security if you're running locally. See the [Getting Started guide](./docs/01-Getting-Started.md) for details.

---

## 📚 Documentation Portal

For detailed information, refer to the guides in the [`docs/`](./docs/) folder:

| Document | Target Audience | Description |
|----------|----------------|-------------|
| [🚀 Getting Started](./docs/01-Getting-Started.md) | New Users | Installation, first run, PIN setup, your first transaction |
| [🏠 Dashboard Guide](./docs/02-Dashboard-Guide.md) | All Users | Every dashboard section explained with interactions |
| [✏️ Transaction Entry](./docs/03-Transaction-Entry.md) | All Users | NLP quick-add, manual entry, learning, bulk operations |
| [💳 Card Management](./docs/04-Card-Management.md) | All Users | Credit cards, billing cycles, aliases, utilization |
| [📦 EMI Tracker](./docs/05-EMI-Tracker.md) | All Users | Installment plans, auto-generation, progress tracking |
| [📊 Analytics Deep Dive](./docs/06-Analytics-Deep-Dive.md) | All Users | All 7 analytics tabs in detail |
| [🎯 Budgets](./docs/07-Budgets.md) | All Users | Setting and tracking monthly spending limits |
| [⚙️ Settings Reference](./docs/08-Settings-Reference.md) | All Users | All 8 settings sections (themes, currency, backup, etc.) |
| [📥 Export Reports](./docs/09-Export-Reports.md) | All Users | XLSX export format and options |
| [🏗️ Architecture Overview](./docs/10-Architecture-Overview.md) | Developers | Tech stack, DB schema, API routes, system design |
| [🚢 Deployment Guide](./docs/11-Deployment-Guide.md) | Developers | Local dev, production, VPS, SQLite considerations |
| [🌱 Survival Summary](./docs/12-Survival-Summary.md) | All Users | Monthly cost-of-living floor + 18-month EMI closure projection |
| [💚 Financial Health Card](./docs/13-Financial-Health.md) | All Users | Dashboard mood-face card based on debt-to-income ratio |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router) | Full-stack React with API routes |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (strict mode) | Type safety for financial data |
| **Styling** | [Tailwind CSS 3.4](https://tailwindcss.com/) | Utility-first with CSS variable themes |
| **Database** | [SQLite](https://sqlite.org/) via `better-sqlite3` | Zero config, local-first, single file |
| **ORM** | [Drizzle ORM](https://orm.drizzle.team/) | Lightweight, type-safe, SQLite-native |
| **Charts** | [Recharts](https://recharts.org/) | Composable React-native charting |
| **NLP/Matching** | [Fuse.js](https://www.fusejs.io/) + custom rules | Offline fuzzy matching, no LLM |
| **Export** | [ExcelJS](https://github.com/exceljs/exceljs) | Styled XLSX with formatting |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) | Subtle micro-interactions |
| **Icons** | [Lucide React](https://lucide.dev/) | Clean, consistent iconography |
| **Fonts** | Inter + JetBrains Mono | Via `next/font/google` |

---

## 📁 Project Structure

```
cardpulse/
├── 📂 src/app/                    # Pages + API routes
│   ├── dashboard/                 #   Main dashboard
│   ├── transactions/              #   Transaction list + entry
│   ├── cards/                     #   Card management
│   ├── emis/                      #   EMI tracker
│   ├── analytics/                 #   7-tab analytics
│   ├── budgets/                   #   Budget management
│   ├── settings/                  #   9-section settings (incl. Fixed Costs)
│   └── api/                       #   20 API endpoints
│
├── 📂 src/components/             # React components
│   ├── ui/                        #   Reusable primitives
│   ├── layout/                    #   Sidebar, header, ticker
│   ├── providers/                 #   Theme context
│   ├── dashboard/                 #   Dashboard sections
│   ├── analytics/                 #   Charts and insight cards
│   └── ...                        #   Cards, EMIs, budgets, etc.
│
├── 📂 src/lib/                    # Core logic
│   ├── db/                        #   Schema, seed, queries
│   ├── nlp/                       #   4-stage NLP parser
│   ├── export/                    #   XLSX generator
│   ├── format.ts                  #   Currency/date formatting
│   ├── cycle-utils.ts             #   Billing cycle math
│   └── chart-utils.ts             #   Shared chart helpers
│
├── 📂 docs/                       # Documentation (13 guides)
├── 📂 data/                       # SQLite database (gitignored)
└── 📂 drizzle/                    # Generated migrations
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_PATH` | `./data/cardpulse.db` | Path to the SQLite database file |

Set in `.env.local`:
```bash
DB_PATH=./data/cardpulse.db
```

No other environment variables needed. No API keys, no cloud services.

### Application Settings

All settings are configurable from the Settings page:

| Setting | Default | Options |
|---------|---------|---------|
| Currency | USD | USD, EUR, GBP, INR, AED, SAR, ... (or any custom 3-letter code) |
| Household Income (monthly) | — | Optional number used by the Financial Health Card to compute commitment ratio |
| Date Format | DD/MM | DD/MM, MM/DD |
| Number Format | 1,234.56 | comma_period, period_comma |
| Theme | Sage | Sage, Midnight, Cyberpunk, Molten, Mono, Terminal |
| Color Mode | Dark | Dark, Light |
| PIN | Enabled | Enable/Disable/Change |

---

## 📊 At a Glance

| Metric | Count |
|--------|-------|
| 📄 Pages | **9** (Dashboard, Transactions, Cards, EMIs, Analytics, Budgets, Settings, Lock, Setup) |
| 🔌 API Routes | **20** (CRUD + analytics + exports + NLP + auth + settings + fixed-costs) |
| 🧩 Components | **70+** (UI primitives, page sections, charts, forms) |
| 🗄️ DB Tables | **12** (cards, transactions, categories, subcategories, labels, keyword_rules, emis, budgets, settings, cycle_payments, transaction_labels, fixed_costs) |
| 🔍 Keyword Rules | **91** pre-seeded (popular merchants, banks, services) |
| 🏷️ Labels | **25** system labels + unlimited custom |
| 📂 Categories | **11** main → **68** subcategories |
| 🎨 Themes | **6** themes × **2** modes = **12** combinations |

---

## 🤝 Contributing

CardPulse is a personal project built as a portfolio piece. Contributions, suggestions, and bug reports are welcome! Feel free to open an issue or submit a pull request.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

---

<div align="center">

*CardPulse v2.1 — fueled by ☕ and a healthy fear of 💳 statements.*

<br />

[![Made with Next.js](https://img.shields.io/badge/Made_with-Next.js-000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Styled with Tailwind](https://img.shields.io/badge/Styled_with-Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Powered by SQLite](https://img.shields.io/badge/Powered_by-SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://sqlite.org/)

</div>
