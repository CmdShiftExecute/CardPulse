import { NextRequest, NextResponse } from "next/server";
import { sqlite } from "@/lib/db";
import type { ApiResponse } from "@/types";

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

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<TopTransaction[]>>> {
  try {
    const { searchParams } = new URL(request.url);
    const isAll = searchParams.get("all") === "true";
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()), 10);
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1), 10);

    let rows: TopTransaction[];

    if (isAll) {
      rows = sqlite
        .prepare(
          `SELECT t.id, t.amount, t.description, t.merchant, t.transaction_date as transactionDate,
                  c.name as categoryName,
                  cr.name as cardName, cr.color as cardColor
           FROM transactions t
           LEFT JOIN categories c ON t.category_id = c.id
           LEFT JOIN cards cr ON t.card_id = cr.id
           ORDER BY t.amount DESC
           LIMIT 10`
        )
        .all() as TopTransaction[];
    } else {
      const start = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      rows = sqlite
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
    }

    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch top transactions";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
