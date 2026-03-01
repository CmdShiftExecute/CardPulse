import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emis, transactions, transactionLabels, cards } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { ApiResponse } from "@/types";

interface PendingEmi {
  id: number;
  description: string;
  monthlyAmount: number;
  cardName: string;
  monthsRemaining: number;
}

interface GenerateResult {
  generated: number;
  completed: string[]; // descriptions of EMIs that hit 0 remaining
}

/**
 * GET /api/emis/generate — check which EMIs need generating for current month.
 * Returns the list of EMIs that haven't been generated yet this month.
 */
export async function GET(): Promise<NextResponse<ApiResponse<PendingEmi[]>>> {
  try {
    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const activeEmis = db
      .select()
      .from(emis)
      .where(and(eq(emis.isActive, 1), eq(emis.autoGenerate, 1)))
      .all();

    const pending: PendingEmi[] = [];
    for (const emi of activeEmis) {
      // Skip if already generated this month
      if (emi.lastGenerated === currentYM) continue;

      const card = db.select().from(cards).where(eq(cards.id, emi.cardId)).get();
      pending.push({
        id: emi.id,
        description: emi.description,
        monthlyAmount: emi.monthlyAmount,
        cardName: card?.name ?? "Unknown Card",
        monthsRemaining: emi.monthsRemaining,
      });
    }

    return NextResponse.json({ success: true, data: pending });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to check EMIs";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/emis/generate — generate transactions for all pending EMIs.
 * Creates one transaction per EMI with "[EMI]" prefix in description.
 * Decrements months_remaining. Sets is_active=0 when it hits 0.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<GenerateResult>>> {
  try {
    const body = (await request.json()) as { emiIds?: number[] };
    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const todayStr = now.toISOString().split("T")[0];

    const activeEmis = db
      .select()
      .from(emis)
      .where(and(eq(emis.isActive, 1), eq(emis.autoGenerate, 1)))
      .all();

    let generated = 0;
    const completed: string[] = [];

    for (const emi of activeEmis) {
      // Skip if already generated this month
      if (emi.lastGenerated === currentYM) continue;

      // If specific IDs provided, only generate those
      if (body.emiIds && body.emiIds.length > 0 && !body.emiIds.includes(emi.id)) {
        continue;
      }

      // Create the transaction
      const inserted = db
        .insert(transactions)
        .values({
          amount: emi.monthlyAmount,
          description: `[EMI] ${emi.description}`,
          merchant: null,
          transactionDate: todayStr,
          categoryId: emi.categoryId,
          subcategoryId: emi.subcategoryId,
          cardId: emi.cardId,
          notes: `Auto-generated EMI installment for ${currentYM}`,
          isRecurring: 1,
        })
        .returning()
        .get();

      // Add labels if present
      if (emi.labelIds) {
        try {
          const labelIdArr = JSON.parse(emi.labelIds) as number[];
          for (const lid of labelIdArr) {
            db.insert(transactionLabels)
              .values({ transactionId: inserted.id, labelId: lid })
              .run();
          }
        } catch { /* ignore */ }
      }

      // Decrement months_remaining
      const newRemaining = Math.max(0, emi.monthsRemaining - 1);
      const isNowComplete = newRemaining === 0;

      db.update(emis)
        .set({
          lastGenerated: currentYM,
          monthsRemaining: newRemaining,
          isActive: isNowComplete ? 0 : 1,
          updatedAt: new Date().toISOString().replace("T", " ").slice(0, 19),
        })
        .where(eq(emis.id, emi.id))
        .run();

      generated++;

      if (isNowComplete) {
        completed.push(emi.description);
      }
    }

    return NextResponse.json({
      success: true,
      data: { generated, completed },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate EMI transactions";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
