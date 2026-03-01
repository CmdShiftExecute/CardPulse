import { NextRequest, NextResponse } from "next/server";
import { db, sqlite } from "@/lib/db";
import { cyclePayments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { ApiResponse } from "@/types";

interface CyclePaymentRow {
  id: number;
  cardId: number;
  cycleStart: string;
  cycleEnd: string;
  dueDate: string;
  amount: number;
  isPaid: number;
  paidAt: string | null;
  createdAt: string;
  cardName?: string;
  cardColor?: string;
  lastFour?: string | null;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<CyclePaymentRow[]>>> {
  try {
    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get("cardId");

    if (cardId) {
      const rows = sqlite
        .prepare(
          `SELECT cp.*, c.name as cardName, c.color as cardColor, c.last_four as lastFour
           FROM cycle_payments cp
           JOIN cards c ON cp.card_id = c.id
           WHERE cp.card_id = ?
           ORDER BY cp.due_date DESC`
        )
        .all(parseInt(cardId, 10)) as CyclePaymentRow[];

      return NextResponse.json({ success: true, data: rows });
    }

    // No cardId — return all payments (optionally filter unpaid only)
    const unpaidOnly = searchParams.get("unpaidOnly") === "true";
    const query = unpaidOnly
      ? `SELECT cp.*, c.name as cardName, c.color as cardColor, c.last_four as lastFour
         FROM cycle_payments cp
         JOIN cards c ON cp.card_id = c.id
         WHERE cp.is_paid = 0
         ORDER BY cp.due_date ASC`
      : `SELECT cp.*, c.name as cardName, c.color as cardColor, c.last_four as lastFour
         FROM cycle_payments cp
         JOIN cards c ON cp.card_id = c.id
         ORDER BY cp.due_date DESC`;

    const rows = sqlite.prepare(query).all() as CyclePaymentRow[];
    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch cycle payments";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<CyclePaymentRow>>> {
  try {
    const body = await request.json();
    const { cardId, cycleStart, cycleEnd, dueDate, amount } = body;

    if (!cardId || !cycleStart || !cycleEnd || !dueDate || amount == null) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: cardId, cycleStart, cycleEnd, dueDate, amount" },
        { status: 400 }
      );
    }

    // Upsert: if record exists for this card+cycle, update it
    const existing = db
      .select()
      .from(cyclePayments)
      .where(
        and(
          eq(cyclePayments.cardId, cardId),
          eq(cyclePayments.cycleStart, cycleStart),
          eq(cyclePayments.cycleEnd, cycleEnd)
        )
      )
      .get();

    if (existing) {
      db.update(cyclePayments)
        .set({
          isPaid: 1,
          paidAt: new Date().toISOString(),
          amount,
          dueDate,
        })
        .where(eq(cyclePayments.id, existing.id))
        .run();

      const updated = db
        .select()
        .from(cyclePayments)
        .where(eq(cyclePayments.id, existing.id))
        .get();

      return NextResponse.json({ success: true, data: updated as CyclePaymentRow });
    }

    const result = db
      .insert(cyclePayments)
      .values({
        cardId,
        cycleStart,
        cycleEnd,
        dueDate,
        amount,
        isPaid: 1,
        paidAt: new Date().toISOString(),
      })
      .returning()
      .get();

    return NextResponse.json({ success: true, data: result as CyclePaymentRow });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create cycle payment";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest
): Promise<NextResponse<ApiResponse<CyclePaymentRow>>> {
  try {
    const body = await request.json();
    const { id, isPaid } = body;

    if (!id || isPaid == null) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: id, isPaid" },
        { status: 400 }
      );
    }

    const existing = db
      .select()
      .from(cyclePayments)
      .where(eq(cyclePayments.id, id))
      .get();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Cycle payment not found" },
        { status: 404 }
      );
    }

    db.update(cyclePayments)
      .set({
        isPaid: isPaid ? 1 : 0,
        paidAt: isPaid ? new Date().toISOString() : null,
      })
      .where(eq(cyclePayments.id, id))
      .run();

    const updated = db
      .select()
      .from(cyclePayments)
      .where(eq(cyclePayments.id, id))
      .get();

    return NextResponse.json({ success: true, data: updated as CyclePaymentRow });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update cycle payment";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
