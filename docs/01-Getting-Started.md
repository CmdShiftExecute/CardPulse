# 🚀 01: Getting Started

> **CardPulse** — Feel your spending rhythm. A local-first credit card expense tracker that runs entirely on your machine, with no cloud dependencies, no external APIs, and no data leaving your browser.

---

## 📑 Table of Contents

- 🔧 [Prerequisites](#-prerequisites)
- 📦 [Installation](#-installation)
- 🌱 [First Run](#-first-run)
- 🔐 [Creating Your PIN](#-creating-your-pin)
- 🔓 [Disabling the PIN](#-disabling-the-pin)
- ⚡ [Your First Transaction](#-your-first-transaction)
- 🗄️ [Understanding the Database](#️-understanding-the-database)
- 🗺️ [Next Steps](#️-next-steps)

---

## 🔧 Prerequisites

| Requirement | Version | Notes |
|:-----------:|:-------:|:------|
| **Node.js** | 18+ | [Download here](https://nodejs.org/) |
| **npm** | 9+ | Included with Node.js |
| **Git** | Any | To clone the repository |

> 💡 **Zero external dependencies.** No cloud services, API keys, databases, or accounts needed. CardPulse runs 100% on your machine.

---

## 📦 Installation

```bash
# 1️⃣ Clone the repository
git clone https://github.com/CmdShiftExecute/Personal-Projects.git
cd Personal-Projects/cardpulse

# 2️⃣ Install dependencies
npm install

# 3️⃣ Start the development server
npm run dev
```

🌐 Open **http://localhost:3000** in your browser.

> 🏗️ **Production build:** Run `npm run build` followed by `npm start` for an optimized production server.

---

## 🌱 First Run

When CardPulse starts for the very first time, it automatically bootstraps everything you need:

| Step | What Happens | Details |
|:----:|:-------------|:--------|
| 1️⃣ | **Creates the SQLite database** | Single file at `data/cardpulse.db` |
| 2️⃣ | **Seeds reference data** | 11 categories, 68 subcategories, 29 system labels, 91+ keyword rules for the NLP engine |
| 3️⃣ | **Applies default settings** | AED currency, DD/MM date format, Sage theme, dark mode |

> ✅ **No manual migration steps.** The entire setup happens automatically on the first page load — just install and go.

---

## 🔐 Creating Your PIN

On your first visit, the **PIN Setup** screen appears:

1. 🔢 Enter a **4–6 digit PIN**
2. 🔒 The PIN is hashed with **bcrypt** and stored in the database — never in plaintext
3. 🎯 After setup, you're redirected straight to the dashboard

Every time you open CardPulse in a new browser tab, you'll need to enter your PIN. The session persists until the tab is closed (stored as an `httpOnly` cookie).

> 🛡️ **Security features:**
> - 🚫 3 incorrect attempts trigger a **30-second cooldown** with a visible countdown
> - 🧂 PIN hash uses bcrypt with automatic salt rounds
> - 🎲 Session tokens are cryptographically random UUIDs

---

## 🔓 Disabling the PIN

If you prefer to skip the lock screen (e.g., running locally on a trusted machine):

1. ⚙️ Go to **Settings > Security**
2. 🔑 Enter your current PIN to confirm
3. 🔄 Toggle **PIN Protection** off

> 💡 With PIN disabled, CardPulse creates an automatic session on load — no lock screen appears. You can re-enable PIN protection at any time from the same settings section. See the [Settings Reference](./08-Settings-Reference.md) for details.

---

## ⚡ Your First Transaction

CardPulse offers **two ways** to add transactions — both use the exact same form underneath.

![NLP Quick Add Entry](../public/screenshots/nlp-entry.png)

### 🧠 Quick Add (NLP)

Type a natural-language description and let the parser extract structured data:

```
fuel 200 mycard yesterday
```

✨ This auto-fills:
- 💰 **Amount** → AED 200
- 📂 **Category** → Vehicle > Fuel
- 💳 **Card** → My Card (matched from alias)
- 📅 **Date** → Yesterday
- 🏷️ **Labels** → Vehicle Expenses, My Card

### 📝 Manual Entry

Switch to the **Manual Entry** tab and fill in each field by hand using dropdowns and inputs. Every field is blank and ready for your input.

> 🎯 **Both modes, one form.** Fields auto-filled by the parser show confidence indicators:
> - 🟢 **Green dot** — High confidence, auto-filled correctly
> - 🟡 **Amber dot** — Low confidence, might need correction
> - ⚪ **No dot** — Not auto-filled, you fill it in

> 📖 **Deep dive:** For the full NLP pipeline, example parses, and teaching the system, see [Transaction Entry](./03-Transaction-Entry.md).

---

## 🗄️ Understanding the Database

CardPulse uses a **single SQLite file** at `data/cardpulse.db`. This one file contains all your data — transactions, cards, settings, budgets, and EMIs.

| Fact | Detail |
|:-----|:-------|
| 📁 **Location** | `data/cardpulse.db` |
| 🚫 **Git status** | Gitignored — never committed to version control |
| 💾 **Backup** | Export from Settings > Data Management |
| 📤 **Restore** | Upload a `.db` file from the same section |
| 🔄 **Reset** | Clear transactional data while keeping settings, categories, and labels |

> ⚠️ **Treat this file as your data.** Back it up regularly. For the complete database schema, see [Architecture Overview](./10-Architecture-Overview.md).

---

## 🗺️ Next Steps

| Guide | What You'll Learn |
|:------|:------------------|
| 📊 [Dashboard Guide](./02-Dashboard-Guide.md) | What each dashboard section shows and how to interact with it |
| ⚡ [Transaction Entry](./03-Transaction-Entry.md) | Master the NLP quick-add system and form fields |
| 💳 [Card Management](./04-Card-Management.md) | Set up credit cards, billing cycles, and aliases |
| 📈 [Analytics Deep Dive](./06-Analytics-Deep-Dive.md) | Trends, comparisons, and category breakdowns |
| ⚙️ [Settings Reference](./08-Settings-Reference.md) | Configure currency, themes, PIN, and more |

---

← Previous: [README](../README.md) | → Next: [Dashboard Guide](./02-Dashboard-Guide.md)
