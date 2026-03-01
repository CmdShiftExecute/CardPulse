import { NextRequest, NextResponse } from "next/server";
import { db, sqlite } from "@/lib/db";
import { budgets, categories, subcategories } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { ApiResponse } from "@/types";

interface BudgetData {
  id: number;
  categoryId: number;
  categoryName: string;
  subcategoryId: number | null;
  subcategoryName: string | null;
  month: number;
  year: number;
  amount: number;
  spent: number;
  remaining: number;
  percent: number;
}

interface BudgetInput {
  categoryId: number;
  subcategoryId?: number | null;
  month: number;
  year: number;
  amount: number;
}

function enrichBudget(budget: typeof budgets.$inferSelect, year: number, month: number): BudgetData {
  const cat = db.select().from(categories).where(eq(categories.id, budget.categoryId)).get();
  const sub = budget.subcategoryId
    ? db.select().from(subcategories).where(eq(subcategories.id, budget.subcategoryId)).get()
    : null;

  // Calculate how much has been spent
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  let spent = 0;
  if (budget.subcategoryId) {
    const row = sqlite
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
         WHERE subcategory_id = ? AND transaction_date >= ? AND transaction_date <= ?`
      )
      .get(budget.subcategoryId, start, end) as { total: number };
    spent = row.total;
  } else {
    const row = sqlite
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
         WHERE category_id = ? AND transaction_date >= ? AND transaction_date <= ?`
      )
      .get(budget.categoryId, start, end) as { total: number };
    spent = row.total;
  }

  const remaining = budget.amount - spent;
  const percent = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;

  return {
    id: budget.id,
    categoryId: budget.categoryId,
    categoryName: cat?.name ?? "Unknown",
    subcategoryId: budget.subcategoryId ?? null,
    subcategoryName: sub?.name ?? null,
    month: budget.month,
    year: budget.year,
    amount: budget.amount,
    spent,
    remaining,
    percent,
  };
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<BudgetData[]>>> {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()), 10);
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1), 10);

    const allBudgets = db
      .select()
      .from(budgets)
      .where(and(eq(budgets.year, year), eq(budgets.month, month)))
      .all();

    return NextResponse.json({
      success: true,
      data: allBudgets.map((b) => enrichBudget(b, year, month)),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch budgets";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<BudgetData>>> {
  try {
    const body = (await request.json()) as BudgetInput;

    if (!body.categoryId) {
      return NextResponse.json({ success: false, error: "Category is required" }, { status: 400 });
    }
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json({ success: false, error: "Amount must be > 0" }, { status: 400 });
    }
    if (!body.month || body.month < 1 || body.month > 12) {
      return NextResponse.json({ success: false, error: "Valid month (1-12) is required" }, { status: 400 });
    }
    if (!body.year || body.year < 2020) {
      return NextResponse.json({ success: false, error: "Valid year is required" }, { status: 400 });
    }

    // Check for existing budget with same category/subcategory/month/year
    const existing = sqlite
      .prepare(
        `SELECT id FROM budgets WHERE category_id = ? AND ${
          body.subcategoryId ? "subcategory_id = ?" : "subcategory_id IS NULL"
        } AND month = ? AND year = ?`
      )
      .get(
        ...(body.subcategoryId
          ? [body.categoryId, body.subcategoryId, body.month, body.year]
          : [body.categoryId, body.month, body.year])
      ) as { id: number } | undefined;

    if (existing) {
      // Update existing budget
      const updated = db
        .update(budgets)
        .set({ amount: body.amount })
        .where(eq(budgets.id, existing.id))
        .returning()
        .get();

      return NextResponse.json({
        success: true,
        data: enrichBudget(updated, body.year, body.month),
      });
    }

    const inserted = db
      .insert(budgets)
      .values({
        categoryId: body.categoryId,
        subcategoryId: body.subcategoryId ?? null,
        month: body.month,
        year: body.year,
        amount: body.amount,
      })
      .returning()
      .get();

    return NextResponse.json({
      success: true,
      data: enrichBudget(inserted, body.year, body.month),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create budget";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest
): Promise<NextResponse<ApiResponse<BudgetData>>> {
  try {
    const body = (await request.json()) as BudgetInput & { id: number };

    if (!body.id) {
      return NextResponse.json({ success: false, error: "Budget ID is required" }, { status: 400 });
    }

    const existing = db.select().from(budgets).where(eq(budgets.id, body.id)).get();
    if (!existing) {
      return NextResponse.json({ success: false, error: "Budget not found" }, { status: 404 });
    }

    const updated = db
      .update(budgets)
      .set({
        categoryId: body.categoryId ?? existing.categoryId,
        subcategoryId: body.subcategoryId !== undefined ? body.subcategoryId : existing.subcategoryId,
        amount: body.amount ?? existing.amount,
      })
      .where(eq(budgets.id, body.id))
      .returning()
      .get();

    return NextResponse.json({
      success: true,
      data: enrichBudget(updated, updated.year, updated.month),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update budget";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ deleted: boolean }>>> {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "0", 10);

    if (!id) {
      return NextResponse.json({ success: false, error: "Budget ID is required" }, { status: 400 });
    }

    const existing = db.select().from(budgets).where(eq(budgets.id, id)).get();
    if (!existing) {
      return NextResponse.json({ success: false, error: "Budget not found" }, { status: 404 });
    }

    db.delete(budgets).where(eq(budgets.id, id)).run();

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete budget";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
