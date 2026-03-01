import { NextResponse } from "next/server";
import { getCardCycleData, getTopLabelSpends } from "@/lib/db/queries";
import type { CardCycleSpend } from "@/lib/db/queries";
import type { ApiResponse } from "@/types";

interface TickerData {
  cards: CardCycleSpend[];
  topLabels: { labelName: string; total: number }[];
}

export async function GET(): Promise<NextResponse<ApiResponse<TickerData>>> {
  try {
    const now = new Date();
    const cards = getCardCycleData();
    const topLabels = getTopLabelSpends(now.getFullYear(), now.getMonth() + 1, 6);

    return NextResponse.json({
      success: true,
      data: { cards, topLabels },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch ticker data";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
