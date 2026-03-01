import { NextRequest, NextResponse } from "next/server";
import { sqlite } from "@/lib/db";
import { generateXlsx } from "@/lib/export/xlsx-generator";

interface TransactionRow {
  date: string;
  mainCategory: string;
  subCategory: string;
  amount: number;
  label: string;
}

interface LabelSummaryRow {
  label: string;
  total: number;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()), 10);
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1), 10);
    const conversionRate = parseFloat(searchParams.get("rate") || "1");

    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    // 1. Fetch all transactions for the month with category info
    const rawTransactions = sqlite
      .prepare(
        `SELECT t.transaction_date as date,
                COALESCE(c.name, 'Uncategorized') as mainCategory,
                COALESCE(s.name, '') as subCategory,
                t.amount,
                t.id as transactionId
         FROM transactions t
         LEFT JOIN categories c ON t.category_id = c.id
         LEFT JOIN subcategories s ON t.subcategory_id = s.id
         WHERE t.transaction_date >= ? AND t.transaction_date <= ?
         ORDER BY c.name, t.transaction_date`
      )
      .all(start, end) as (TransactionRow & { transactionId: number })[];

    // 2. For each transaction, get its labels
    const getLabelsStmt = sqlite.prepare(
      `SELECT l.name FROM transaction_labels tl
       JOIN labels l ON tl.label_id = l.id
       WHERE tl.transaction_id = ?`
    );

    const transactions: TransactionRow[] = rawTransactions.map((t) => {
      const labels = getLabelsStmt.all(t.transactionId) as { name: string }[];
      return {
        date: t.date,
        mainCategory: t.mainCategory,
        subCategory: t.subCategory,
        amount: t.amount,
        label: labels.map((l) => l.name).join(", "),
      };
    });

    // 3. Build label summaries
    const labelTotals = sqlite
      .prepare(
        `SELECT l.name as label, COALESCE(SUM(t.amount), 0) as total
         FROM transaction_labels tl
         JOIN labels l ON tl.label_id = l.id
         JOIN transactions t ON tl.transaction_id = t.id
         WHERE t.transaction_date >= ? AND t.transaction_date <= ?
         GROUP BY l.name
         ORDER BY total DESC`
      )
      .all(start, end) as LabelSummaryRow[];

    // 4. Calculate total credit card purchases (all card-linked transactions)
    const cardPurchaseRow = sqlite
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
         WHERE card_id IS NOT NULL AND transaction_date >= ? AND transaction_date <= ?`
      )
      .get(start, end) as { total: number };

    // 5. Generate XLSX
    const buffer = await generateXlsx({
      year,
      month,
      conversionRate,
      transactions,
      labelSummaries: labelTotals,
      cardPurchaseTotal: cardPurchaseRow.total,
    });

    const monthName = MONTH_NAMES[month - 1];
    const filename = `CardPulse_${monthName}_${year}.xlsx`;

    // Convert Buffer to Uint8Array for NextResponse compatibility
    const uint8 = new Uint8Array(buffer);

    return new NextResponse(uint8, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate export";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
