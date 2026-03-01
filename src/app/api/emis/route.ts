import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emis, cards, categories, subcategories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { ApiResponse } from "@/types";

interface EmiData {
  id: number;
  cardId: number;
  cardName: string;
  cardColor: string | null;
  cardLastFour: string | null;
  description: string;
  originalAmount: number;
  monthlyAmount: number;
  totalMonths: number;
  monthsRemaining: number;
  monthsPaid: number;
  startDate: string;
  endDate: string | null;
  categoryId: number | null;
  categoryName: string | null;
  subcategoryId: number | null;
  subcategoryName: string | null;
  labelIds: number[];
  isActive: number;
  autoGenerate: number;
  lastGenerated: string | null;
  notes: string | null;
  progress: number; // 0-100
}

interface EmiInput {
  cardId: number;
  description: string;
  originalAmount: number;
  monthlyAmount: number;
  totalMonths: number;
  monthsRemaining?: number;
  startDate: string;
  categoryId?: number | null;
  subcategoryId?: number | null;
  labelIds?: number[];
  autoGenerate?: number;
  notes?: string | null;
}

function enrichEmi(emi: typeof emis.$inferSelect): EmiData {
  const card = db.select().from(cards).where(eq(cards.id, emi.cardId)).get();
  const cat = emi.categoryId
    ? db.select().from(categories).where(eq(categories.id, emi.categoryId)).get()
    : null;
  const sub = emi.subcategoryId
    ? db.select().from(subcategories).where(eq(subcategories.id, emi.subcategoryId)).get()
    : null;

  let labelIds: number[] = [];
  if (emi.labelIds) {
    try { labelIds = JSON.parse(emi.labelIds); } catch { /* ignore */ }
  }

  const monthsPaid = emi.totalMonths - emi.monthsRemaining;
  const progress = emi.totalMonths > 0
    ? Math.round((monthsPaid / emi.totalMonths) * 100)
    : 0;

  return {
    id: emi.id,
    cardId: emi.cardId,
    cardName: card?.name ?? "Unknown Card",
    cardColor: card?.color ?? null,
    cardLastFour: card?.lastFour ?? null,
    description: emi.description,
    originalAmount: emi.originalAmount,
    monthlyAmount: emi.monthlyAmount,
    totalMonths: emi.totalMonths,
    monthsRemaining: emi.monthsRemaining,
    monthsPaid,
    startDate: emi.startDate,
    endDate: emi.endDate,
    categoryId: emi.categoryId,
    categoryName: cat?.name ?? null,
    subcategoryId: emi.subcategoryId,
    subcategoryName: sub?.name ?? null,
    labelIds,
    isActive: emi.isActive,
    autoGenerate: emi.autoGenerate,
    lastGenerated: emi.lastGenerated,
    notes: emi.notes,
    progress,
  };
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<EmiData[]>>> {
  try {
    const { searchParams } = new URL(request.url);
    const includeCompleted = searchParams.get("includeCompleted") === "true";

    let allEmis;
    if (includeCompleted) {
      allEmis = db.select().from(emis).all();
    } else {
      allEmis = db.select().from(emis).where(eq(emis.isActive, 1)).all();
    }

    return NextResponse.json({
      success: true,
      data: allEmis.map(enrichEmi),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch EMIs";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<EmiData>>> {
  try {
    const body = (await request.json()) as EmiInput;

    if (!body.cardId) {
      return NextResponse.json({ success: false, error: "Card is required" }, { status: 400 });
    }
    if (!body.description?.trim()) {
      return NextResponse.json({ success: false, error: "Description is required" }, { status: 400 });
    }
    if (!body.monthlyAmount || body.monthlyAmount <= 0) {
      return NextResponse.json({ success: false, error: "Monthly amount must be > 0" }, { status: 400 });
    }
    if (!body.totalMonths || body.totalMonths <= 0) {
      return NextResponse.json({ success: false, error: "Total months must be > 0" }, { status: 400 });
    }

    const monthsRemaining = body.monthsRemaining ?? body.totalMonths;

    // Calculate end date
    const startDate = new Date(body.startDate + "T00:00:00");
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + body.totalMonths);
    const endDateStr = endDate.toISOString().split("T")[0];

    const labelIdsJson = body.labelIds && body.labelIds.length > 0
      ? JSON.stringify(body.labelIds)
      : null;

    const inserted = db
      .insert(emis)
      .values({
        cardId: body.cardId,
        description: body.description.trim(),
        originalAmount: body.originalAmount || body.monthlyAmount * body.totalMonths,
        monthlyAmount: body.monthlyAmount,
        totalMonths: body.totalMonths,
        monthsRemaining,
        startDate: body.startDate,
        endDate: endDateStr,
        categoryId: body.categoryId ?? null,
        subcategoryId: body.subcategoryId ?? null,
        labelIds: labelIdsJson,
        isActive: 1,
        autoGenerate: body.autoGenerate ?? 1,
        notes: body.notes ?? null,
      })
      .returning()
      .get();

    return NextResponse.json({ success: true, data: enrichEmi(inserted) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create EMI";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest
): Promise<NextResponse<ApiResponse<EmiData>>> {
  try {
    const body = (await request.json()) as EmiInput & { id: number };

    if (!body.id) {
      return NextResponse.json({ success: false, error: "EMI ID is required" }, { status: 400 });
    }

    const existing = db.select().from(emis).where(eq(emis.id, body.id)).get();
    if (!existing) {
      return NextResponse.json({ success: false, error: "EMI not found" }, { status: 404 });
    }

    const labelIdsJson = body.labelIds !== undefined
      ? (body.labelIds && body.labelIds.length > 0 ? JSON.stringify(body.labelIds) : null)
      : existing.labelIds;

    const updated = db
      .update(emis)
      .set({
        cardId: body.cardId ?? existing.cardId,
        description: body.description?.trim() || existing.description,
        originalAmount: body.originalAmount ?? existing.originalAmount,
        monthlyAmount: body.monthlyAmount ?? existing.monthlyAmount,
        totalMonths: body.totalMonths ?? existing.totalMonths,
        monthsRemaining: body.monthsRemaining ?? existing.monthsRemaining,
        startDate: body.startDate || existing.startDate,
        categoryId: body.categoryId !== undefined ? body.categoryId : existing.categoryId,
        subcategoryId: body.subcategoryId !== undefined ? body.subcategoryId : existing.subcategoryId,
        labelIds: labelIdsJson,
        autoGenerate: body.autoGenerate !== undefined ? body.autoGenerate : existing.autoGenerate,
        notes: body.notes !== undefined ? body.notes : existing.notes,
        updatedAt: new Date().toISOString().replace("T", " ").slice(0, 19),
      })
      .where(eq(emis.id, body.id))
      .returning()
      .get();

    return NextResponse.json({ success: true, data: enrichEmi(updated) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update EMI";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/emis — Mark complete or reactivate.
 * Body: { id: number, isActive: 0 | 1 }
 */
export async function PATCH(
  request: NextRequest
): Promise<NextResponse<ApiResponse<EmiData>>> {
  try {
    const body = (await request.json()) as { id: number; isActive: number };

    if (!body.id) {
      return NextResponse.json({ success: false, error: "EMI ID is required" }, { status: 400 });
    }

    const existing = db.select().from(emis).where(eq(emis.id, body.id)).get();
    if (!existing) {
      return NextResponse.json({ success: false, error: "EMI not found" }, { status: 404 });
    }

    const updated = db
      .update(emis)
      .set({
        isActive: body.isActive,
        monthsRemaining: body.isActive === 0 ? 0 : existing.monthsRemaining,
        updatedAt: new Date().toISOString().replace("T", " ").slice(0, 19),
      })
      .where(eq(emis.id, body.id))
      .returning()
      .get();

    return NextResponse.json({ success: true, data: enrichEmi(updated) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update EMI";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
