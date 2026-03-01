import { NextRequest, NextResponse } from "next/server";
import { sqlite } from "@/lib/db";
import { getCardCycleData } from "@/lib/db/queries";
import type { CardCycleSpend } from "@/lib/db/queries";
import type { ApiResponse } from "@/types";

interface CategorySpend {
  categoryId: number;
  categoryName: string;
  total: number;
}

interface SubcategorySpend {
  categoryId: number;
  categoryName: string;
  subcategoryId: number;
  subcategoryName: string;
  total: number;
}

interface LabelSpend {
  labelId: number;
  labelName: string;
  total: number;
  transactionCount: number;
}

interface CategoryLabelLink {
  categoryId: number;
  categoryName: string;
  labelId: number;
  labelName: string;
  total: number;
}

interface RecentTransaction {
  id: number;
  amount: number;
  description: string;
  merchant: string | null;
  transactionDate: string;
  categoryName: string | null;
  subcategoryName: string | null;
  cardName: string | null;
  cardColor: string | null;
}

interface TopTransaction {
  id: number;
  amount: number;
  description: string;
  merchant: string | null;
  transactionDate: string;
  categoryName: string | null;
  cardName: string | null;
  cardColor: string | null;
}

interface CardMonthSpend {
  cardId: number;
  cardName: string;
  lastFour: string | null;
  color: string | null;
  total: number;
  transactionCount: number;
}

interface DashboardData {
  monthTotal: number;
  prevMonthTotal: number;
  percentChange: number;
  categoryBreakdown: CategorySpend[];
  subcategoryBreakdown: SubcategorySpend[];
  labelBreakdown: LabelSpend[];
  categoryLabelLinks: CategoryLabelLink[];
  cardCycleData: CardCycleSpend[];
  recentTransactions: RecentTransaction[];
  topTransactions: TopTransaction[];
  cardSpend: CardMonthSpend[];
}

function getMonthRange(year: number, month: number): { start: string; end: string } {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<DashboardData>>> {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()), 10);
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1), 10);

    const { start, end } = getMonthRange(year, month);

    // 1. Monthly total
    const monthTotalRow = sqlite
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE transaction_date >= ? AND transaction_date <= ?`
      )
      .get(start, end) as { total: number };
    const monthTotal = monthTotalRow.total;

    // 2. Previous month total
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevRange = getMonthRange(prevYear, prevMonth);
    const prevTotalRow = sqlite
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE transaction_date >= ? AND transaction_date <= ?`
      )
      .get(prevRange.start, prevRange.end) as { total: number };
    const prevMonthTotal = prevTotalRow.total;

    const percentChange =
      prevMonthTotal > 0
        ? ((monthTotal - prevMonthTotal) / prevMonthTotal) * 100
        : monthTotal > 0
          ? 100
          : 0;

    // 3. Category breakdown
    const catRows = sqlite
      .prepare(
        `SELECT c.id as categoryId, c.name as categoryName, COALESCE(SUM(t.amount), 0) as total
         FROM transactions t
         JOIN categories c ON t.category_id = c.id
         WHERE t.transaction_date >= ? AND t.transaction_date <= ?
         GROUP BY c.id, c.name
         ORDER BY total DESC`
      )
      .all(start, end) as CategorySpend[];

    // 3b. Subcategory breakdown (for drill-down)
    const subRows = sqlite
      .prepare(
        `SELECT c.id as categoryId, c.name as categoryName,
                s.id as subcategoryId, s.name as subcategoryName,
                COALESCE(SUM(t.amount), 0) as total
         FROM transactions t
         JOIN categories c ON t.category_id = c.id
         JOIN subcategories s ON t.subcategory_id = s.id
         WHERE t.transaction_date >= ? AND t.transaction_date <= ?
         GROUP BY c.id, c.name, s.id, s.name
         ORDER BY total DESC`
      )
      .all(start, end) as SubcategorySpend[];

    // 3c. Label breakdown
    const labelRows = sqlite
      .prepare(
        `SELECT l.id as labelId, l.name as labelName,
                COALESCE(SUM(t.amount), 0) as total,
                COUNT(DISTINCT t.id) as transactionCount
         FROM transaction_labels tl
         JOIN labels l ON tl.label_id = l.id
         JOIN transactions t ON tl.transaction_id = t.id
         WHERE t.transaction_date >= ? AND t.transaction_date <= ?
         GROUP BY l.id, l.name
         ORDER BY total DESC`
      )
      .all(start, end) as LabelSpend[];

    // 3d. Category-label links (which labels are associated with which categories)
    const catLabelRows = sqlite
      .prepare(
        `SELECT c.id as categoryId, c.name as categoryName,
                l.id as labelId, l.name as labelName,
                COALESCE(SUM(t.amount), 0) as total
         FROM transaction_labels tl
         JOIN labels l ON tl.label_id = l.id
         JOIN transactions t ON tl.transaction_id = t.id
         JOIN categories c ON t.category_id = c.id
         WHERE t.transaction_date >= ? AND t.transaction_date <= ?
         GROUP BY c.id, c.name, l.id, l.name
         ORDER BY total DESC`
      )
      .all(start, end) as CategoryLabelLink[];

    // 4. Card cycle data (using shared utility)
    const cardCycleData = getCardCycleData();

    // 5. Recent 10 transactions
    const recentRows = sqlite
      .prepare(
        `SELECT t.id, t.amount, t.description, t.merchant, t.transaction_date as transactionDate,
                c.name as categoryName, s.name as subcategoryName,
                cr.name as cardName, cr.color as cardColor
         FROM transactions t
         LEFT JOIN categories c ON t.category_id = c.id
         LEFT JOIN subcategories s ON t.subcategory_id = s.id
         LEFT JOIN cards cr ON t.card_id = cr.id
         ORDER BY t.transaction_date DESC, t.id DESC
         LIMIT 10`
      )
      .all() as RecentTransaction[];

    // 6. Per-card spend for the selected month
    const cardSpendRows = sqlite
      .prepare(
        `SELECT cr.id as cardId, cr.name as cardName, cr.last_four as lastFour, cr.color,
                COALESCE(SUM(t.amount), 0) as total, COUNT(*) as transactionCount
         FROM transactions t
         JOIN cards cr ON t.card_id = cr.id
         WHERE t.transaction_date >= ? AND t.transaction_date <= ?
         GROUP BY cr.id, cr.name, cr.last_four, cr.color
         ORDER BY total DESC`
      )
      .all(start, end) as CardMonthSpend[];

    // 7. Top 10 transactions by amount for the current month
    const topTxnRows = sqlite
      .prepare(
        `SELECT t.id, t.amount, t.description, t.merchant, t.transaction_date as transactionDate,
                c.name as categoryName,
                cr.name as cardName, cr.color as cardColor
         FROM transactions t
         LEFT JOIN categories c ON t.category_id = c.id
         LEFT JOIN cards cr ON t.card_id = cr.id
         WHERE t.transaction_date >= ? AND t.transaction_date <= ?
         ORDER BY t.amount DESC
         LIMIT 10`
      )
      .all(start, end) as TopTransaction[];

    return NextResponse.json({
      success: true,
      data: {
        monthTotal,
        prevMonthTotal,
        percentChange,
        categoryBreakdown: catRows,
        subcategoryBreakdown: subRows,
        labelBreakdown: labelRows,
        categoryLabelLinks: catLabelRows,
        cardCycleData,
        recentTransactions: recentRows,
        topTransactions: topTxnRows,
        cardSpend: cardSpendRows,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch analytics";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
