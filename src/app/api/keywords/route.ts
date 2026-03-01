import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { keywordRules } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { ApiResponse } from "@/types";

interface KeywordRuleInput {
  keyword: string;
  categoryId: number;
  subcategoryId: number;
  labelIds?: number[];
}

interface KeywordRuleData {
  id: number;
  keyword: string;
  categoryId: number | null;
  subcategoryId: number | null;
  labelIds: string | null;
  priority: number;
  isSystem: number;
}

// GET — list all keyword rules
export async function GET(): Promise<NextResponse<ApiResponse<KeywordRuleData[]>>> {
  try {
    const rules = db
      .select()
      .from(keywordRules)
      .orderBy(keywordRules.keyword)
      .all();

    return NextResponse.json({
      success: true,
      data: rules.map((r) => ({
        id: r.id,
        keyword: r.keyword,
        categoryId: r.categoryId,
        subcategoryId: r.subcategoryId,
        labelIds: r.labelIds,
        priority: r.priority,
        isSystem: r.isSystem,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch keyword rules";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE — delete a user-created keyword rule by id
export async function DELETE(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ deleted: boolean }>>> {
  try {
    const { searchParams } = new URL(request.url);
    const idStr = searchParams.get("id");
    if (!idStr) {
      return NextResponse.json(
        { success: false, error: "Missing id parameter" },
        { status: 400 }
      );
    }

    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid id parameter" },
        { status: 400 }
      );
    }

    // Only allow deleting user-created rules (isSystem = 0)
    const rule = db
      .select()
      .from(keywordRules)
      .where(eq(keywordRules.id, id))
      .get();

    if (!rule) {
      return NextResponse.json(
        { success: false, error: "Rule not found" },
        { status: 404 }
      );
    }

    if (rule.isSystem) {
      return NextResponse.json(
        { success: false, error: "Cannot delete system rules" },
        { status: 403 }
      );
    }

    db.delete(keywordRules).where(eq(keywordRules.id, id)).run();

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete keyword rule";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<KeywordRuleData>>> {
  try {
    const body = (await request.json()) as KeywordRuleInput;

    if (!body.keyword || body.keyword.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Keyword is required" },
        { status: 400 }
      );
    }
    if (!body.categoryId || !body.subcategoryId) {
      return NextResponse.json(
        { success: false, error: "Category and subcategory are required" },
        { status: 400 }
      );
    }

    const labelIdsJson = body.labelIds && body.labelIds.length > 0
      ? JSON.stringify(body.labelIds)
      : null;

    const result = db
      .insert(keywordRules)
      .values({
        keyword: body.keyword.trim().toLowerCase(),
        categoryId: body.categoryId,
        subcategoryId: body.subcategoryId,
        labelIds: labelIdsJson,
        priority: 10, // User-created rules get higher priority
        isSystem: 0,
      })
      .returning()
      .get();

    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        keyword: result.keyword,
        categoryId: result.categoryId,
        subcategoryId: result.subcategoryId,
        labelIds: result.labelIds,
        priority: result.priority,
        isSystem: result.isSystem,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create keyword rule";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
