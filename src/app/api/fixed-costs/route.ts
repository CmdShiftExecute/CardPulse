import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fixedCosts } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export interface FixedCost {
  id: number;
  name: string;
  monthlyAmount: number;
  icon: string | null;
  color: string | null;
  notes: string | null;
  sortOrder: number;
  isActive: number;
  createdAt: string;
  updatedAt: string;
}

// GET /api/fixed-costs — list all active fixed costs sorted by sort_order
export async function GET() {
  try {
    const rows = db
      .select()
      .from(fixedCosts)
      .where(eq(fixedCosts.isActive, 1))
      .orderBy(asc(fixedCosts.sortOrder), asc(fixedCosts.id))
      .all();
    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch fixed costs";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/fixed-costs — create a new fixed cost
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json({ success: false, error: "name is required" }, { status: 400 });
    }
    if (typeof body.monthlyAmount !== "number" || body.monthlyAmount < 0) {
      return NextResponse.json({ success: false, error: "monthlyAmount must be a non-negative number" }, { status: 400 });
    }

    const maxOrder = db
      .select({ max: fixedCosts.sortOrder })
      .from(fixedCosts)
      .orderBy(asc(fixedCosts.sortOrder))
      .all()
      .reduce((acc, row) => Math.max(acc, row.max), -1);

    const inserted = db
      .insert(fixedCosts)
      .values({
        name: body.name.trim(),
        monthlyAmount: body.monthlyAmount,
        icon: body.icon || null,
        color: body.color || null,
        notes: body.notes || null,
        sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : maxOrder + 1,
        isActive: 1,
      })
      .returning()
      .get();

    return NextResponse.json({ success: true, data: inserted });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create fixed cost";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PATCH /api/fixed-costs — update an existing fixed cost
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    if (typeof body.id !== "number") {
      return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
    }

    const updates: Partial<typeof fixedCosts.$inferInsert> = {
      updatedAt: new Date().toISOString().replace("T", " ").slice(0, 19),
    };
    if (typeof body.name === "string") updates.name = body.name.trim();
    if (typeof body.monthlyAmount === "number") updates.monthlyAmount = body.monthlyAmount;
    if (body.icon !== undefined) updates.icon = body.icon || null;
    if (body.color !== undefined) updates.color = body.color || null;
    if (body.notes !== undefined) updates.notes = body.notes || null;
    if (typeof body.sortOrder === "number") updates.sortOrder = body.sortOrder;
    if (body.isActive === 0 || body.isActive === 1) updates.isActive = body.isActive;

    const updated = db
      .update(fixedCosts)
      .set(updates)
      .where(eq(fixedCosts.id, body.id))
      .returning()
      .get();

    if (!updated) {
      return NextResponse.json({ success: false, error: "Fixed cost not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update fixed cost";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/fixed-costs?id=N — hard delete a fixed cost
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const idParam = url.searchParams.get("id");
    if (!idParam) {
      return NextResponse.json({ success: false, error: "id query param is required" }, { status: 400 });
    }
    const id = parseInt(idParam, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: "id must be a number" }, { status: 400 });
    }
    db.delete(fixedCosts).where(eq(fixedCosts.id, id)).run();
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete fixed cost";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
