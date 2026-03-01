import { NextRequest, NextResponse } from "next/server";
import { parseTransaction } from "@/lib/nlp/parser";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body as { text: string };

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Text is required" },
        { status: 400 }
      );
    }

    const parsed = parseTransaction(text.trim());

    return NextResponse.json({ success: true, data: parsed });
  } catch {
    // Even the endpoint itself should never crash
    return NextResponse.json(
      { success: false, error: "Parse failed" },
      { status: 500 }
    );
  }
}
