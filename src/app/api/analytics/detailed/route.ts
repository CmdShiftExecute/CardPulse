import { NextRequest, NextResponse } from "next/server";
import { db, sqlite } from "@/lib/db";
import { cards, emis } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { ApiResponse } from "@/types";
import { getStatementDateForCycle, getDueDateForCycle } from "@/lib/cycle-utils";

/* ── Response Interfaces ──────────────────────────────── */

interface MonthlyTrend {
  year: number;
  month: number;
  label: string;
  total: number;
}

interface CategoryTrend {
  categoryId: number;
  categoryName: string;
  months: { year: number; month: number; label: string; total: number }[];
}

interface SubcategoryRow {
  subcategoryId: number;
  subcategoryName: string;
  total: number;
}

interface CategoryDrilldown {
  categoryId: number;
  categoryName: string;
  total: number;
  percent: number;
  subcategories: SubcategoryRow[];
}

interface CardMonthlySpend {
  cardId: number;
  cardName: string;
  color: string;
  months: { year: number; month: number; label: string; total: number }[];
}

interface CycleTimelineEvent {
  type: "expense" | "emi";
  cardId: number;
  cardName: string;
  cardColor: string;
  amount: number;
  description: string;
  date: string;
  categoryName: string | null;
}

interface CyclePeriod {
  start: string;
  end: string;
  expenses: number;
  emiTotal: number;
  total: number;
  events: CycleTimelineEvent[];
  paymentDueDate: string;
  isPaid?: boolean;
  paymentId?: number;
}

interface CycleForecast {
  cardId: number;
  cardName: string;
  cardColor: string;
  bank: string;
  lastFour: string | null;
  creditLimit: number | null;
  previousCycle: CyclePeriod;
  currentCycle: CyclePeriod;
  nextCycle: {
    start: string;
    end: string;
    emiTotal: number;
    paymentDueDate: string;
  };
  statementDay: number;
  dueDay: number;
}

interface EmiLandscapeItem {
  id: number;
  description: string;
  cardId: number;
  cardName: string;
  cardColor: string;
  monthlyAmount: number;
  originalAmount: number;
  totalMonths: number;
  monthsRemaining: number;
  monthsPaid: number;
  progress: number;
  startDate: string;
  endDate: string | null;
  categoryName: string | null;
  isActive: number;
}

interface LabelDrilldown {
  labelId: number;
  labelName: string;
  total: number;
  percent: number;
  transactionCount: number;
}

interface CategoryLabelLink {
  categoryId: number;
  categoryName: string;
  labelId: number;
  labelName: string;
  total: number;
}

interface LabelTrend {
  labelId: number;
  labelName: string;
  months: { year: number; month: number; label: string; total: number }[];
}

interface SubcategoryTrend {
  subcategoryId: number;
  subcategoryName: string;
  categoryId: number;
  months: { year: number; month: number; label: string; total: number }[];
}

interface InsightStats {
  latestMonthTotal: number;
  latestMonthLabel: string;
  averageMonthlySpending: number;
  monthsTracked: number;
  mostSpentCategory: { name: string; total: number };
  biggestCategoryGainer: { name: string; percentChange: number };
  biggestCategorySaver: { name: string; percentChange: number };
  mostSpentLabel: { name: string; total: number };
  biggestLabelGainer: { name: string; percentChange: number };
  biggestLabelSaver: { name: string; percentChange: number };
}

interface AnalyticsDetailed {
  monthlyTrends: MonthlyTrend[];
  categoryTrends: CategoryTrend[];
  labelTrends: LabelTrend[];
  subcategoryTrends: SubcategoryTrend[];
  insightStats: InsightStats;
  categoryDrilldown: CategoryDrilldown[];
  labelDrilldown: LabelDrilldown[];
  categoryLabelLinks: CategoryLabelLink[];
  cardMonthlySpend: CardMonthlySpend[];
  cycleForecast: CycleForecast[];
  emiLandscape: EmiLandscapeItem[];
}

/* ── Helpers ──────────────────────────────────────────── */

function getMonthLabel(year: number, month: number): string {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function getMonthRange(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

function capDay(day: number, year: number, month: number): number {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return Math.min(day, lastDay);
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getCycleDatesForCard(card: { cycleStart: number; cycleEnd: number }, offset: number = 0): { start: string; end: string } {
  const now = new Date();
  const currentDay = now.getDate();

  let startDate: Date;
  let endDate: Date;

  // First determine the current cycle (offset=0)
  const refMonth = now.getMonth();
  const refYear = now.getFullYear();

  if (currentDay >= card.cycleStart) {
    const startDay = capDay(card.cycleStart, refYear, refMonth);
    startDate = new Date(refYear, refMonth, startDay);
    if (card.cycleEnd < card.cycleStart) {
      const nm = refMonth + 1;
      const ny = nm > 11 ? refYear + 1 : refYear;
      const am = nm > 11 ? 0 : nm;
      endDate = new Date(ny, am, capDay(card.cycleEnd, ny, am));
    } else {
      endDate = new Date(refYear, refMonth, capDay(card.cycleEnd, refYear, refMonth));
    }
  } else {
    const pm = refMonth - 1;
    const py = pm < 0 ? refYear - 1 : refYear;
    const am = pm < 0 ? 11 : pm;
    startDate = new Date(py, am, capDay(card.cycleStart, py, am));
    endDate = new Date(refYear, refMonth, capDay(card.cycleEnd, refYear, refMonth));
  }

  if (offset === 0) {
    return { start: fmtDate(startDate), end: fmtDate(endDate) };
  }

  if (offset === 1) {
    // Next cycle: starts day after current cycle ends
    const nextStart = new Date(endDate);
    nextStart.setDate(nextStart.getDate() + 1);
    const nsMonth = nextStart.getMonth();
    const nsYear = nextStart.getFullYear();
    let nextEnd: Date;
    if (card.cycleEnd < card.cycleStart) {
      const nm = nsMonth + 1;
      const ny = nm > 11 ? nsYear + 1 : nsYear;
      const am = nm > 11 ? 0 : nm;
      nextEnd = new Date(ny, am, capDay(card.cycleEnd, ny, am));
    } else {
      nextEnd = new Date(nsYear, nsMonth, capDay(card.cycleEnd, nsYear, nsMonth));
    }
    return { start: fmtDate(nextStart), end: fmtDate(nextEnd) };
  }

  if (offset === -1) {
    // Previous cycle: ends day before current cycle starts
    const prevEnd = new Date(startDate);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const peMonth = prevEnd.getMonth();
    const peYear = prevEnd.getFullYear();
    let prevStart: Date;
    if (card.cycleEnd < card.cycleStart) {
      // Cross-month cycle: go back one more month for the start
      const pm2 = peMonth - 1;
      const py2 = pm2 < 0 ? peYear - 1 : peYear;
      const am2 = pm2 < 0 ? 11 : pm2;
      prevStart = new Date(py2, am2, capDay(card.cycleStart, py2, am2));
    } else {
      prevStart = new Date(peYear, peMonth, capDay(card.cycleStart, peYear, peMonth));
    }
    return { start: fmtDate(prevStart), end: fmtDate(prevEnd) };
  }

  // Fallback for other offsets
  return { start: fmtDate(startDate), end: fmtDate(endDate) };
}

/* ── Cycle Event Builder ─────────────────────────────── */

interface CardRow {
  id: number;
  name: string;
  color: string | null;
}

function buildCycleEvents(
  cardRow: CardRow,
  cycleDates: { start: string; end: string },
  cardEmis: { monthlyAmount: number; description: string }[]
): { events: CycleTimelineEvent[]; expensesTotal: number; emiTotal: number } {
  const expenseRows = sqlite
    .prepare(`
      SELECT t.amount, t.description, t.merchant, t.transaction_date as date, c.name as categoryName
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.card_id = ? AND t.transaction_date >= ? AND t.transaction_date <= ?
      ORDER BY t.transaction_date ASC
    `)
    .all(cardRow.id, cycleDates.start, cycleDates.end) as {
    amount: number;
    description: string;
    merchant: string | null;
    date: string;
    categoryName: string | null;
  }[];

  const expensesTotal = expenseRows.reduce((s, r) => s + r.amount, 0);
  const emiTotal = cardEmis.reduce((s, e) => s + e.monthlyAmount, 0);

  const events: CycleTimelineEvent[] = [];
  for (const row of expenseRows) {
    events.push({
      type: "expense",
      cardId: cardRow.id,
      cardName: cardRow.name,
      cardColor: cardRow.color || "#7EB89E",
      amount: row.amount,
      description: row.merchant || row.description,
      date: row.date,
      categoryName: row.categoryName,
    });
  }
  for (const emi of cardEmis) {
    events.push({
      type: "emi",
      cardId: cardRow.id,
      cardName: cardRow.name,
      cardColor: cardRow.color || "#7EB89E",
      amount: emi.monthlyAmount,
      description: emi.description,
      date: cycleDates.start,
      categoryName: null,
    });
  }
  events.sort((a, b) => a.date.localeCompare(b.date));

  return { events, expensesTotal, emiTotal };
}

/* ── Main Handler ─────────────────────────────────────── */

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<AnalyticsDetailed>>> {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()), 10);
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1), 10);

    /* ── 1. Monthly Trends (last 12 months) ─────────── */
    const trendMonths: { year: number; month: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      let m = month - i;
      let y = year;
      while (m <= 0) { m += 12; y--; }
      trendMonths.push({ year: y, month: m });
    }

    const monthlyTrends: MonthlyTrend[] = trendMonths.map(({ year: y, month: m }) => {
      const range = getMonthRange(y, m);
      const row = sqlite
        .prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE transaction_date >= ? AND transaction_date <= ?`)
        .get(range.start, range.end) as { total: number };
      return { year: y, month: m, label: getMonthLabel(y, m), total: row.total };
    });

    /* ── 2. Category Trends (ALL cats over 12 months) ─── */
    const trendStart = getMonthRange(trendMonths[0].year, trendMonths[0].month).start;
    const trendEnd = getMonthRange(trendMonths[11].year, trendMonths[11].month).end;

    const catTrendRows = sqlite
      .prepare(`
        SELECT c.id as categoryId, c.name as categoryName,
               CAST(strftime('%Y', t.transaction_date) AS INTEGER) as yr,
               CAST(strftime('%m', t.transaction_date) AS INTEGER) as mo,
               COALESCE(SUM(t.amount), 0) as total
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.transaction_date >= ? AND t.transaction_date <= ?
        GROUP BY c.id, c.name, yr, mo
        ORDER BY c.name, yr, mo
      `)
      .all(trendStart, trendEnd) as { categoryId: number; categoryName: string; yr: number; mo: number; total: number }[];

    const catTrendMap = new Map<number, { categoryId: number; categoryName: string; data: Map<string, number> }>();
    for (const row of catTrendRows) {
      if (!catTrendMap.has(row.categoryId)) {
        catTrendMap.set(row.categoryId, { categoryId: row.categoryId, categoryName: row.categoryName, data: new Map() });
      }
      catTrendMap.get(row.categoryId)!.data.set(`${row.yr}-${row.mo}`, row.total);
    }

    const categoryTrends: CategoryTrend[] = Array.from(catTrendMap.values()).map((cat) => {
      const months = trendMonths.map(({ year: y, month: m }) => ({
        year: y,
        month: m,
        label: getMonthLabel(y, m),
        total: cat.data.get(`${y}-${m}`) || 0,
      }));
      return { categoryId: cat.categoryId, categoryName: cat.categoryName, months };
    });

    /* ── 2b. Label Trends (ALL labels over 12 months) ── */
    const labelTrendRows = sqlite
      .prepare(`
        SELECT l.id as labelId, l.name as labelName,
               CAST(strftime('%Y', t.transaction_date) AS INTEGER) as yr,
               CAST(strftime('%m', t.transaction_date) AS INTEGER) as mo,
               COALESCE(SUM(t.amount), 0) as total
        FROM transaction_labels tl
        JOIN labels l ON tl.label_id = l.id
        JOIN transactions t ON tl.transaction_id = t.id
        WHERE t.transaction_date >= ? AND t.transaction_date <= ?
        GROUP BY l.id, l.name, yr, mo
        ORDER BY l.name, yr, mo
      `)
      .all(trendStart, trendEnd) as { labelId: number; labelName: string; yr: number; mo: number; total: number }[];

    const labelTrendMap = new Map<number, { labelId: number; labelName: string; data: Map<string, number> }>();
    for (const row of labelTrendRows) {
      if (!labelTrendMap.has(row.labelId)) {
        labelTrendMap.set(row.labelId, { labelId: row.labelId, labelName: row.labelName, data: new Map() });
      }
      labelTrendMap.get(row.labelId)!.data.set(`${row.yr}-${row.mo}`, row.total);
    }

    const labelTrends: LabelTrend[] = Array.from(labelTrendMap.values()).map((lbl) => {
      const months = trendMonths.map(({ year: y, month: m }) => ({
        year: y,
        month: m,
        label: getMonthLabel(y, m),
        total: lbl.data.get(`${y}-${m}`) || 0,
      }));
      return { labelId: lbl.labelId, labelName: lbl.labelName, months };
    });

    /* ── 2c. Subcategory Trends (per category, 12 months) */
    const subTrendRows = sqlite
      .prepare(`
        SELECT s.id as subcategoryId, s.name as subcategoryName,
               c.id as categoryId,
               CAST(strftime('%Y', t.transaction_date) AS INTEGER) as yr,
               CAST(strftime('%m', t.transaction_date) AS INTEGER) as mo,
               COALESCE(SUM(t.amount), 0) as total
        FROM transactions t
        JOIN subcategories s ON t.subcategory_id = s.id
        JOIN categories c ON t.category_id = c.id
        WHERE t.transaction_date >= ? AND t.transaction_date <= ?
        GROUP BY s.id, s.name, c.id, yr, mo
        ORDER BY c.id, s.name, yr, mo
      `)
      .all(trendStart, trendEnd) as { subcategoryId: number; subcategoryName: string; categoryId: number; yr: number; mo: number; total: number }[];

    const subTrendMap = new Map<number, { subcategoryId: number; subcategoryName: string; categoryId: number; data: Map<string, number> }>();
    for (const row of subTrendRows) {
      if (!subTrendMap.has(row.subcategoryId)) {
        subTrendMap.set(row.subcategoryId, { subcategoryId: row.subcategoryId, subcategoryName: row.subcategoryName, categoryId: row.categoryId, data: new Map() });
      }
      subTrendMap.get(row.subcategoryId)!.data.set(`${row.yr}-${row.mo}`, row.total);
    }

    const subcategoryTrends: SubcategoryTrend[] = Array.from(subTrendMap.values()).map((sub) => {
      const months = trendMonths.map(({ year: y, month: m }) => ({
        year: y,
        month: m,
        label: getMonthLabel(y, m),
        total: sub.data.get(`${y}-${m}`) || 0,
      }));
      return { subcategoryId: sub.subcategoryId, subcategoryName: sub.subcategoryName, categoryId: sub.categoryId, months };
    });

    /* ── 3. Category Drilldown (selected month) ──────── */
    const { start, end } = getMonthRange(year, month);
    const monthTotalRow = sqlite
      .prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE transaction_date >= ? AND transaction_date <= ?`)
      .get(start, end) as { total: number };
    const monthTotal = monthTotalRow.total;

    const catBreakdown = sqlite
      .prepare(`
        SELECT c.id as categoryId, c.name as categoryName, COALESCE(SUM(t.amount), 0) as total
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.transaction_date >= ? AND t.transaction_date <= ?
        GROUP BY c.id, c.name
        ORDER BY total DESC
      `)
      .all(start, end) as { categoryId: number; categoryName: string; total: number }[];

    const categoryDrilldown: CategoryDrilldown[] = catBreakdown.map((cat) => {
      const subs = sqlite
        .prepare(`
          SELECT s.id as subcategoryId, s.name as subcategoryName, COALESCE(SUM(t.amount), 0) as total
          FROM transactions t
          JOIN subcategories s ON t.subcategory_id = s.id
          WHERE t.category_id = ? AND t.transaction_date >= ? AND t.transaction_date <= ?
          GROUP BY s.id, s.name
          ORDER BY total DESC
        `)
        .all(cat.categoryId, start, end) as SubcategoryRow[];

      return {
        ...cat,
        percent: monthTotal > 0 ? (cat.total / monthTotal) * 100 : 0,
        subcategories: subs,
      };
    });

    /* ── 3b. Label Drilldown (selected month) ─────────── */
    const labelRows = sqlite
      .prepare(`
        SELECT l.id as labelId, l.name as labelName,
               COALESCE(SUM(t.amount), 0) as total,
               COUNT(DISTINCT t.id) as transactionCount
        FROM transaction_labels tl
        JOIN labels l ON tl.label_id = l.id
        JOIN transactions t ON tl.transaction_id = t.id
        WHERE t.transaction_date >= ? AND t.transaction_date <= ?
        GROUP BY l.id, l.name
        ORDER BY total DESC
      `)
      .all(start, end) as { labelId: number; labelName: string; total: number; transactionCount: number }[];

    const labelDrilldown: LabelDrilldown[] = labelRows.map((label) => ({
      ...label,
      percent: monthTotal > 0 ? (label.total / monthTotal) * 100 : 0,
    }));

    /* ── 3c. Category-Label Links ────────────────────── */
    const categoryLabelLinks = sqlite
      .prepare(`
        SELECT c.id as categoryId, c.name as categoryName,
               l.id as labelId, l.name as labelName,
               COALESCE(SUM(t.amount), 0) as total
        FROM transaction_labels tl
        JOIN labels l ON tl.label_id = l.id
        JOIN transactions t ON tl.transaction_id = t.id
        JOIN categories c ON t.category_id = c.id
        WHERE t.transaction_date >= ? AND t.transaction_date <= ?
        GROUP BY c.id, c.name, l.id, l.name
        ORDER BY total DESC
      `)
      .all(start, end) as CategoryLabelLink[];

    /* ── 3d. Insight Stats ────────────────────────────── */
    // Compute previous month range for comparison
    let prevMonthNum = month - 1;
    let prevYearNum = year;
    if (prevMonthNum <= 0) { prevMonthNum = 12; prevYearNum--; }
    const prevRange = getMonthRange(prevYearNum, prevMonthNum);

    // Current month category totals
    const currCatTotals = catBreakdown;
    // Previous month category totals
    const prevCatTotals = sqlite
      .prepare(`
        SELECT c.id as categoryId, c.name as categoryName, COALESCE(SUM(t.amount), 0) as total
        FROM transactions t JOIN categories c ON t.category_id = c.id
        WHERE t.transaction_date >= ? AND t.transaction_date <= ?
        GROUP BY c.id, c.name
      `)
      .all(prevRange.start, prevRange.end) as { categoryId: number; categoryName: string; total: number }[];

    const prevCatMap = new Map(prevCatTotals.map(c => [c.categoryId, c.total]));

    // Current month label totals (already have labelRows)
    const prevLabelTotals = sqlite
      .prepare(`
        SELECT l.id as labelId, l.name as labelName, COALESCE(SUM(t.amount), 0) as total
        FROM transaction_labels tl
        JOIN labels l ON tl.label_id = l.id
        JOIN transactions t ON tl.transaction_id = t.id
        WHERE t.transaction_date >= ? AND t.transaction_date <= ?
        GROUP BY l.id, l.name
      `)
      .all(prevRange.start, prevRange.end) as { labelId: number; labelName: string; total: number }[];

    const prevLabelMap = new Map(prevLabelTotals.map(l => [l.labelId, l.total]));

    // Helper for percent change
    const pctChange = (curr: number, prev: number): number => {
      if (prev === 0 && curr === 0) return 0;
      if (prev === 0) return Infinity;
      return ((curr - prev) / prev) * 100;
    }

    // Category insights
    const mostSpentCat = currCatTotals[0] || { categoryName: "None", total: 0 };
    let bigCatGainer = { name: "None", percentChange: -Infinity };
    let bigCatSaver = { name: "None", percentChange: Infinity };

    for (const cat of currCatTotals) {
      const prev = prevCatMap.get(cat.categoryId) || 0;
      const pct = pctChange(cat.total, prev);
      if (pct > bigCatGainer.percentChange) bigCatGainer = { name: cat.categoryName, percentChange: pct };
      if (pct < bigCatSaver.percentChange) bigCatSaver = { name: cat.categoryName, percentChange: pct };
    }
    // Also check categories that existed in prev month but not current (= -100%)
    for (const prev of prevCatTotals) {
      if (!currCatTotals.find(c => c.categoryId === prev.categoryId) && prev.total > 0) {
        if (-100 < bigCatSaver.percentChange) bigCatSaver = { name: prev.categoryName, percentChange: -100 };
      }
    }

    // Label insights
    const mostSpentLbl = labelRows[0] || { labelName: "None", total: 0 };
    let bigLblGainer = { name: "None", percentChange: -Infinity };
    let bigLblSaver = { name: "None", percentChange: Infinity };

    for (const lbl of labelRows) {
      const prev = prevLabelMap.get(lbl.labelId) || 0;
      const pct = pctChange(lbl.total, prev);
      if (pct > bigLblGainer.percentChange) bigLblGainer = { name: lbl.labelName, percentChange: pct };
      if (pct < bigLblSaver.percentChange) bigLblSaver = { name: lbl.labelName, percentChange: pct };
    }
    for (const prev of prevLabelTotals) {
      if (!labelRows.find(l => l.labelId === prev.labelId) && prev.total > 0) {
        if (-100 < bigLblSaver.percentChange) bigLblSaver = { name: prev.labelName, percentChange: -100 };
      }
    }

    // Months tracked: count distinct months with transactions
    const monthsTrackedRow = sqlite
      .prepare(`SELECT COUNT(DISTINCT strftime('%Y-%m', transaction_date)) as cnt FROM transactions`)
      .get() as { cnt: number };

    // Average monthly spending across all tracked months
    const allMonthsTotalRow = sqlite
      .prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions`)
      .get() as { total: number };

    const insightStats: InsightStats = {
      latestMonthTotal: monthTotal,
      latestMonthLabel: getMonthLabel(year, month),
      averageMonthlySpending: monthsTrackedRow.cnt > 0 ? allMonthsTotalRow.total / monthsTrackedRow.cnt : 0,
      monthsTracked: monthsTrackedRow.cnt,
      mostSpentCategory: { name: mostSpentCat.categoryName, total: mostSpentCat.total },
      biggestCategoryGainer: bigCatGainer.percentChange === -Infinity ? { name: "None", percentChange: 0 } : bigCatGainer,
      biggestCategorySaver: bigCatSaver.percentChange === Infinity ? { name: "None", percentChange: 0 } : bigCatSaver,
      mostSpentLabel: { name: mostSpentLbl.labelName, total: mostSpentLbl.total },
      biggestLabelGainer: bigLblGainer.percentChange === -Infinity ? { name: "None", percentChange: 0 } : bigLblGainer,
      biggestLabelSaver: bigLblSaver.percentChange === Infinity ? { name: "None", percentChange: 0 } : bigLblSaver,
    };

    /* ── 4. Card Monthly Spend (last 12 months) ──────── */
    const activeCards = db.select().from(cards).where(eq(cards.isActive, 1)).all();

    const cardMonthlySpend: CardMonthlySpend[] = activeCards.map((card) => {
      const months = trendMonths.map(({ year: y, month: m }) => {
        const range = getMonthRange(y, m);
        const row = sqlite
          .prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE card_id = ? AND transaction_date >= ? AND transaction_date <= ?`)
          .get(card.id, range.start, range.end) as { total: number };
        return { year: y, month: m, label: getMonthLabel(y, m), total: row.total };
      });
      return { cardId: card.id, cardName: card.name, color: card.color || "#7EB89E", months };
    });

    /* ── 5. Cycle Forecast (previous + current + next per card) */
    const cycleForecast: CycleForecast[] = activeCards.map((card) => {
      const prevCycleDates = getCycleDatesForCard(card, -1);
      const currentCycleDates = getCycleDatesForCard(card, 0);
      const nextCycleDates = getCycleDatesForCard(card, 1);

      const cardEmis = db.select().from(emis).where(eq(emis.cardId, card.id)).all().filter(e => e.isActive === 1);
      const emiList = cardEmis.map(e => ({ monthlyAmount: e.monthlyAmount, description: e.description }));
      const emiMonthly = emiList.reduce((s, e) => s + e.monthlyAmount, 0);

      const prev = buildCycleEvents(card, prevCycleDates, emiList);
      const curr = buildCycleEvents(card, currentCycleDates, emiList);

      // Calculate payment due dates for each cycle
      // Due date = after the cycle's statement date
      const prevEndDate = new Date(prevCycleDates.end + "T00:00:00");
      const prevStmt = getStatementDateForCycle(card, prevEndDate);
      const prevDue = getDueDateForCycle(card, prevStmt);

      const currEndDate = new Date(currentCycleDates.end + "T00:00:00");
      const currStmt = getStatementDateForCycle(card, currEndDate);
      const currDue = getDueDateForCycle(card, currStmt);

      const nextEndDate = new Date(nextCycleDates.end + "T00:00:00");
      const nextStmt = getStatementDateForCycle(card, nextEndDate);
      const nextDue = getDueDateForCycle(card, nextStmt);

      // Look up payment status for previous and current cycles
      const paymentLookup = sqlite.prepare(
        `SELECT id, is_paid FROM cycle_payments WHERE card_id = ? AND cycle_start = ? AND cycle_end = ?`
      );

      const prevPayment = paymentLookup.get(card.id, prevCycleDates.start, prevCycleDates.end) as
        { id: number; is_paid: number } | undefined;
      const currPayment = paymentLookup.get(card.id, currentCycleDates.start, currentCycleDates.end) as
        { id: number; is_paid: number } | undefined;

      const previousCycle: CyclePeriod = {
        start: prevCycleDates.start,
        end: prevCycleDates.end,
        expenses: prev.expensesTotal,
        emiTotal: prev.emiTotal,
        total: prev.expensesTotal + prev.emiTotal,
        events: prev.events,
        paymentDueDate: fmtDate(prevDue),
      };
      if (prevPayment && prevPayment.is_paid === 1) {
        previousCycle.isPaid = true;
        previousCycle.paymentId = prevPayment.id;
      }

      const currentCycle: CyclePeriod = {
        start: currentCycleDates.start,
        end: currentCycleDates.end,
        expenses: curr.expensesTotal,
        emiTotal: curr.emiTotal,
        total: curr.expensesTotal + curr.emiTotal,
        events: curr.events,
        paymentDueDate: fmtDate(currDue),
      };
      if (currPayment && currPayment.is_paid === 1) {
        currentCycle.isPaid = true;
        currentCycle.paymentId = currPayment.id;
      }

      return {
        cardId: card.id,
        cardName: card.name,
        cardColor: card.color || "#7EB89E",
        bank: card.bank,
        lastFour: card.lastFour,
        creditLimit: card.creditLimit,
        previousCycle,
        currentCycle,
        nextCycle: {
          start: nextCycleDates.start,
          end: nextCycleDates.end,
          emiTotal: emiMonthly,
          paymentDueDate: fmtDate(nextDue),
        },
        statementDay: card.statementDay,
        dueDay: card.dueDay,
      };
    });

    /* ── 6. EMI Landscape ────────────────────────────── */
    const allEmis = db.select().from(emis).all();
    const emiLandscape: EmiLandscapeItem[] = allEmis.map((e) => {
      const card = activeCards.find(c => c.id === e.cardId);
      const catRow = e.categoryId
        ? sqlite.prepare(`SELECT name FROM categories WHERE id = ?`).get(e.categoryId) as { name: string } | undefined
        : undefined;
      const monthsPaid = e.totalMonths - e.monthsRemaining;
      return {
        id: e.id,
        description: e.description,
        cardId: e.cardId,
        cardName: card?.name ?? "Unknown",
        cardColor: card?.color ?? "#7EB89E",
        monthlyAmount: e.monthlyAmount,
        originalAmount: e.originalAmount,
        totalMonths: e.totalMonths,
        monthsRemaining: e.monthsRemaining,
        monthsPaid,
        progress: e.totalMonths > 0 ? Math.round((monthsPaid / e.totalMonths) * 100) : 0,
        startDate: e.startDate,
        endDate: e.endDate,
        categoryName: catRow?.name ?? null,
        isActive: e.isActive,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        monthlyTrends,
        categoryTrends,
        labelTrends,
        subcategoryTrends,
        insightStats,
        categoryDrilldown,
        labelDrilldown,
        categoryLabelLinks,
        cardMonthlySpend,
        cycleForecast,
        emiLandscape,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch analytics";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
