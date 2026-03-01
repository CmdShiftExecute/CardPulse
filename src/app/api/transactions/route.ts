import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  transactions,
  transactionLabels,
  categories,
  subcategories,
  cards,
  labels,
} from "@/lib/db/schema";
import { eq, and, gte, lte, like, sql } from "drizzle-orm";
import type { ApiResponse } from "@/types";

interface TransactionInput {
  amount: number;
  description: string;
  merchant?: string | null;
  transactionDate: string;
  categoryId: number;
  subcategoryId: number;
  cardId?: number | null;
  notes?: string | null;
  isRecurring?: number;
  labelIds?: number[];
}

interface TransactionRow {
  id: number;
  amount: number;
  description: string;
  merchant: string | null;
  transactionDate: string;
  categoryId: number | null;
  subcategoryId: number | null;
  cardId: number | null;
  notes: string | null;
  isRecurring: number;
  createdAt: string;
  updatedAt: string;
  categoryName: string | null;
  subcategoryName: string | null;
  cardName: string | null;
  cardColor: string | null;
  labels: { id: number; name: string }[];
}

function enrichTransaction(
  tx: typeof transactions.$inferSelect
): TransactionRow {
  const cat = tx.categoryId
    ? db.select().from(categories).where(eq(categories.id, tx.categoryId)).get()
    : null;
  const sub = tx.subcategoryId
    ? db
        .select()
        .from(subcategories)
        .where(eq(subcategories.id, tx.subcategoryId))
        .get()
    : null;
  const card = tx.cardId
    ? db.select().from(cards).where(eq(cards.id, tx.cardId)).get()
    : null;

  const txLabels = db
    .select({ id: labels.id, name: labels.name })
    .from(transactionLabels)
    .innerJoin(labels, eq(transactionLabels.labelId, labels.id))
    .where(eq(transactionLabels.transactionId, tx.id))
    .all();

  return {
    id: tx.id,
    amount: tx.amount,
    description: tx.description,
    merchant: tx.merchant,
    transactionDate: tx.transactionDate,
    categoryId: tx.categoryId,
    subcategoryId: tx.subcategoryId,
    cardId: tx.cardId,
    notes: tx.notes,
    isRecurring: tx.isRecurring,
    createdAt: tx.createdAt,
    updatedAt: tx.updatedAt,
    categoryName: cat?.name ?? null,
    subcategoryName: sub?.name ?? null,
    cardName: card?.name ?? null,
    cardColor: card?.color ?? null,
    labels: txLabels,
  };
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<TransactionRow[]>>> {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const categoryId = searchParams.get("categoryId");
    const subcategoryId = searchParams.get("subcategoryId");
    const cardId = searchParams.get("cardId");
    const labelId = searchParams.get("labelId");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "date";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const limit = searchParams.get("limit");

    // Build conditions
    const conditions = [];

    if (dateFrom) {
      conditions.push(gte(transactions.transactionDate, dateFrom));
    }
    if (dateTo) {
      conditions.push(lte(transactions.transactionDate, dateTo));
    }
    if (categoryId) {
      conditions.push(eq(transactions.categoryId, parseInt(categoryId, 10)));
    }
    if (subcategoryId) {
      conditions.push(
        eq(transactions.subcategoryId, parseInt(subcategoryId, 10))
      );
    }
    if (cardId) {
      conditions.push(eq(transactions.cardId, parseInt(cardId, 10)));
    }
    if (search) {
      conditions.push(like(transactions.description, `%${search}%`));
    }

    // Build sort
    const sortColumn =
      sortBy === "amount"
        ? transactions.amount
        : sortBy === "category"
          ? transactions.categoryId
          : transactions.transactionDate;

    const orderFn = sortOrder === "asc" ? sql`${sortColumn} ASC` : sql`${sortColumn} DESC`;

    let query = db
      .select()
      .from(transactions)
      .orderBy(orderFn);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    let results = query.all();

    // Filter by label (post-query since it's a many-to-many)
    if (labelId) {
      const labelIdNum = parseInt(labelId, 10);
      const txIdsWithLabel = db
        .select({ transactionId: transactionLabels.transactionId })
        .from(transactionLabels)
        .where(eq(transactionLabels.labelId, labelIdNum))
        .all()
        .map((r) => r.transactionId);

      results = results.filter((tx) => txIdsWithLabel.includes(tx.id));
    }

    if (limit) {
      results = results.slice(0, parseInt(limit, 10));
    }

    const enriched = results.map(enrichTransaction);

    return NextResponse.json({ success: true, data: enriched });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch transactions";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<TransactionRow>>> {
  try {
    const body = (await request.json()) as TransactionInput;

    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }
    if (!body.transactionDate) {
      return NextResponse.json(
        { success: false, error: "Transaction date is required" },
        { status: 400 }
      );
    }
    if (!body.categoryId || !body.subcategoryId) {
      return NextResponse.json(
        { success: false, error: "Category and subcategory are required" },
        { status: 400 }
      );
    }

    const inserted = db
      .insert(transactions)
      .values({
        amount: body.amount,
        description: body.description || "Manual entry",
        merchant: body.merchant ?? null,
        transactionDate: body.transactionDate,
        categoryId: body.categoryId,
        subcategoryId: body.subcategoryId,
        cardId: body.cardId ?? null,
        notes: body.notes ?? null,
        isRecurring: body.isRecurring ?? 0,
      })
      .returning()
      .get();

    // Insert label associations
    if (body.labelIds && body.labelIds.length > 0) {
      const uniqueIds = Array.from(new Set(body.labelIds));
      for (const lid of uniqueIds) {
        db.insert(transactionLabels)
          .values({ transactionId: inserted.id, labelId: lid })
          .run();
      }
    }

    const enriched = enrichTransaction(inserted);
    return NextResponse.json({ success: true, data: enriched });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create transaction";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest
): Promise<NextResponse<ApiResponse<TransactionRow>>> {
  try {
    const body = (await request.json()) as TransactionInput & { id: number };

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "Transaction ID is required" },
        { status: 400 }
      );
    }
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }
    if (!body.categoryId || !body.subcategoryId) {
      return NextResponse.json(
        { success: false, error: "Category and subcategory are required" },
        { status: 400 }
      );
    }

    const existing = db
      .select()
      .from(transactions)
      .where(eq(transactions.id, body.id))
      .get();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404 }
      );
    }

    const updated = db
      .update(transactions)
      .set({
        amount: body.amount,
        description: body.description || existing.description,
        merchant: body.merchant ?? existing.merchant,
        transactionDate: body.transactionDate || existing.transactionDate,
        categoryId: body.categoryId,
        subcategoryId: body.subcategoryId,
        cardId: body.cardId ?? null,
        notes: body.notes ?? null,
        isRecurring: body.isRecurring ?? existing.isRecurring,
        updatedAt: new Date().toISOString().replace("T", " ").slice(0, 19),
      })
      .where(eq(transactions.id, body.id))
      .returning()
      .get();

    // Replace label associations
    db.delete(transactionLabels)
      .where(eq(transactionLabels.transactionId, body.id))
      .run();

    if (body.labelIds && body.labelIds.length > 0) {
      const uniqueIds = Array.from(new Set(body.labelIds));
      for (const lid of uniqueIds) {
        db.insert(transactionLabels)
          .values({ transactionId: body.id, labelId: lid })
          .run();
      }
    }

    const enriched = enrichTransaction(updated);
    return NextResponse.json({ success: true, data: enriched });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update transaction";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const body = (await request.json()) as { ids: number[] };

    if (!body.ids || body.ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "Transaction IDs are required" },
        { status: 400 }
      );
    }

    // transaction_labels cascade-deletes automatically
    for (const id of body.ids) {
      db.delete(transactions).where(eq(transactions.id, id)).run();
    }

    return NextResponse.json({ success: true, data: null });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete transactions";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
