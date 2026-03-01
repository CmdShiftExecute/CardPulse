import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { labels } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { ApiResponse } from "@/types";

interface LabelData {
  id: number;
  name: string;
  isSystem: number;
}

export async function GET(): Promise<NextResponse<ApiResponse<LabelData[]>>> {
  try {
    const allLabels = db
      .select({ id: labels.id, name: labels.name, isSystem: labels.isSystem })
      .from(labels)
      .all();

    return NextResponse.json({ success: true, data: allLabels });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch labels";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<LabelData>>> {
  try {
    const body = await request.json();
    const { name } = body as { name?: string };

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Label name is required" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    // Check for duplicate
    const existing = db
      .select()
      .from(labels)
      .where(eq(labels.name, trimmedName))
      .get();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "A label with this name already exists" },
        { status: 409 }
      );
    }

    const result = db
      .insert(labels)
      .values({ name: trimmedName, isSystem: 0 })
      .returning()
      .get();

    return NextResponse.json({
      success: true,
      data: { id: result.id, name: result.name, isSystem: result.isSystem },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create label";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Label ID is required" },
        { status: 400 }
      );
    }

    const label = db
      .select()
      .from(labels)
      .where(eq(labels.id, parseInt(id, 10)))
      .get();

    if (!label) {
      return NextResponse.json(
        { success: false, error: "Label not found" },
        { status: 404 }
      );
    }

    if (label.isSystem === 1) {
      return NextResponse.json(
        { success: false, error: "Cannot delete system labels" },
        { status: 403 }
      );
    }

    db.delete(labels).where(eq(labels.id, parseInt(id, 10))).run();

    return NextResponse.json({ success: true, data: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete label";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
