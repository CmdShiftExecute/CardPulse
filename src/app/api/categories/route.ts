import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories, subcategories } from "@/lib/db/schema";
import type { ApiResponse } from "@/types";

interface CategoryWithSubs {
  id: number;
  name: string;
  subcategories: { id: number; name: string }[];
}

export async function GET(): Promise<NextResponse<ApiResponse<CategoryWithSubs[]>>> {
  try {
    const allCategories = db.select().from(categories).all();
    const allSubcategories = db.select().from(subcategories).all();

    const result: CategoryWithSubs[] = allCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      subcategories: allSubcategories
        .filter((sub) => sub.categoryId === cat.id)
        .map((sub) => ({ id: sub.id, name: sub.name })),
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch categories";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
