import { NextRequest, NextResponse } from "next/server";
import { db, sqlite } from "@/lib/db";
import { cards, labels } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { ApiResponse } from "@/types";

interface CardData {
  id: number;
  name: string;
  labelName: string;
  bank: string;
  lastFour: string | null;
  cycleStart: number;
  cycleEnd: number;
  statementDay: number;
  dueDay: number;
  creditLimit: number | null;
  color: string | null;
  aliases: string[];
  isActive: number;
  cycleSpend?: number;
  emiMonthly?: number;
  prevCyclePaid?: boolean;
}

interface CardInput {
  name: string;
  bank: string;
  lastFour?: string | null;
  cycleStart: number;
  cycleEnd: number;
  statementDay: number;
  dueDay: number;
  creditLimit?: number | null;
  color?: string | null;
  aliases?: string[];
}

function mapCard(c: typeof cards.$inferSelect): CardData {
  let aliases: string[] = [];
  if (c.aliases) {
    try { aliases = JSON.parse(c.aliases) as string[]; } catch { aliases = []; }
  }
  return {
    id: c.id,
    name: c.name,
    labelName: c.labelName,
    bank: c.bank,
    lastFour: c.lastFour,
    cycleStart: c.cycleStart,
    cycleEnd: c.cycleEnd,
    statementDay: c.statementDay,
    dueDay: c.dueDay,
    creditLimit: c.creditLimit,
    color: c.color,
    aliases,
    isActive: c.isActive,
  };
}

/** Generate default aliases from card name and bank name */
function suggestAliases(cardName: string, bankName: string): string[] {
  const aliases: string[] = [];
  const nameLower = cardName.toLowerCase();
  const bankLower = bankName.toLowerCase();

  // Full name
  aliases.push(nameLower);

  // Name without " Card" suffix
  const withoutCard = nameLower.replace(/\s+card$/i, "").trim();
  if (withoutCard !== nameLower) aliases.push(withoutCard);

  // Individual significant words from card name (skip common words)
  const skipWords = new Set(["card", "credit", "debit", "the", "a", "an"]);
  const nameWords = withoutCard.split(/\s+/).filter(w => !skipWords.has(w) && w.length > 2);
  for (const word of nameWords) {
    if (!aliases.includes(word)) aliases.push(word);
  }

  // Bank name and abbreviation
  if (!aliases.includes(bankLower)) aliases.push(bankLower);
  const bankWords = bankLower.split(/\s+/).filter(w => w.length > 2 && !skipWords.has(w));
  if (bankWords.length > 1) {
    const abbr = bankWords.map(w => w[0]).join("");
    if (abbr.length >= 2 && !aliases.includes(abbr)) aliases.push(abbr);
  }

  return aliases;
}

/**
 * Compute the current billing cycle date range for a card.
 */
function getCycleDates(card: { cycleStart: number; cycleEnd: number }) {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  function capDay(day: number, year: number, month: number): number {
    const lastDay = new Date(year, month + 1, 0).getDate();
    return Math.min(day, lastDay);
  }

  let startDate: Date;
  let endDate: Date;

  if (currentDay >= card.cycleStart) {
    const startDay = capDay(card.cycleStart, currentYear, currentMonth);
    startDate = new Date(currentYear, currentMonth, startDay);

    if (card.cycleEnd < card.cycleStart) {
      const nextMonth = currentMonth + 1;
      const nextYear = nextMonth > 11 ? currentYear + 1 : currentYear;
      const adjMonth = nextMonth > 11 ? 0 : nextMonth;
      const endDay = capDay(card.cycleEnd, nextYear, adjMonth);
      endDate = new Date(nextYear, adjMonth, endDay);
    } else {
      const endDay = capDay(card.cycleEnd, currentYear, currentMonth);
      endDate = new Date(currentYear, currentMonth, endDay);
    }
  } else {
    const prevMonth = currentMonth - 1;
    const prevYear = prevMonth < 0 ? currentYear - 1 : currentYear;
    const adjMonth = prevMonth < 0 ? 11 : prevMonth;
    const startDay = capDay(card.cycleStart, prevYear, adjMonth);
    startDate = new Date(prevYear, adjMonth, startDay);

    const endDay = capDay(card.cycleEnd, currentYear, currentMonth);
    endDate = new Date(currentYear, currentMonth, endDay);
  }

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  return { start: fmt(startDate), end: fmt(endDate) };
}

/**
 * Compute the previous billing cycle date range for a card.
 */
function getPrevCycleDates(card: { cycleStart: number; cycleEnd: number }) {
  const current = getCycleDates(card);
  const currentStart = new Date(current.start + "T00:00:00");

  // Previous cycle ends the day before current cycle starts
  const prevEnd = new Date(currentStart);
  prevEnd.setDate(prevEnd.getDate() - 1);

  // Previous cycle starts one month before current cycle start
  const prevStart = new Date(currentStart);
  prevStart.setMonth(prevStart.getMonth() - 1);

  function capDay(day: number, year: number, month: number): number {
    const lastDay = new Date(year, month + 1, 0).getDate();
    return Math.min(day, lastDay);
  }

  const startDay = capDay(card.cycleStart, prevStart.getFullYear(), prevStart.getMonth());
  const prevStartDate = new Date(prevStart.getFullYear(), prevStart.getMonth(), startDay);

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  return { start: fmt(prevStartDate), end: fmt(prevEnd) };
}

/**
 * GET /api/cards — returns all active cards.
 * Pass ?includeInactive=true to include deactivated cards.
 * Pass ?withSpend=true to include current cycle spend and EMI data.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<CardData[]>>> {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";
    const withSpend = searchParams.get("withSpend") === "true";

    let allCards;
    if (includeInactive) {
      allCards = db.select().from(cards).all();
    } else {
      allCards = db.select().from(cards).where(eq(cards.isActive, 1)).all();
    }

    const mapped = allCards.map(mapCard);

    // Optionally enrich with cycle spend data
    if (withSpend) {
      for (const card of mapped) {
        const cycleDates = getCycleDates({
          cycleStart: card.cycleStart,
          cycleEnd: card.cycleEnd,
        });

        const spendRow = sqlite
          .prepare(
            `SELECT COALESCE(SUM(amount), 0) as total
             FROM transactions
             WHERE card_id = ? AND transaction_date >= ? AND transaction_date <= ?`
          )
          .get(card.id, cycleDates.start, cycleDates.end) as { total: number };

        const emiRow = sqlite
          .prepare(
            `SELECT COALESCE(SUM(monthly_amount), 0) as total
             FROM emis
             WHERE card_id = ? AND is_active = 1`
          )
          .get(card.id) as { total: number };

        card.cycleSpend = spendRow.total;
        card.emiMonthly = emiRow.total;

        // Check if previous cycle is paid
        const prevCycleDates = getPrevCycleDates({
          cycleStart: card.cycleStart,
          cycleEnd: card.cycleEnd,
        });
        const prevPayment = sqlite
          .prepare(
            `SELECT is_paid FROM cycle_payments
             WHERE card_id = ? AND cycle_start = ? AND cycle_end = ?`
          )
          .get(card.id, prevCycleDates.start, prevCycleDates.end) as { is_paid: number } | undefined;
        card.prevCyclePaid = prevPayment?.is_paid === 1;
      }
    }

    return NextResponse.json({
      success: true,
      data: mapped,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch cards";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cards — create a new card.
 * Auto-creates a matching label in the labels table.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<CardData>>> {
  try {
    const body = (await request.json()) as CardInput;

    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Card name is required" },
        { status: 400 }
      );
    }
    if (!body.bank || body.bank.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Bank name is required" },
        { status: 400 }
      );
    }
    if (!body.cycleStart || !body.cycleEnd || !body.statementDay || !body.dueDay) {
      return NextResponse.json(
        { success: false, error: "Billing cycle fields are required" },
        { status: 400 }
      );
    }

    const cardName = body.name.trim();

    // Check for duplicate name
    const existing = db
      .select()
      .from(cards)
      .where(eq(cards.name, cardName))
      .get();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "A card with this name already exists" },
        { status: 409 }
      );
    }

    // Auto-create a matching label if it doesn't exist
    const existingLabel = db
      .select()
      .from(labels)
      .where(eq(labels.name, cardName))
      .get();

    if (!existingLabel) {
      db.insert(labels)
        .values({ name: cardName, isSystem: 1 })
        .run();
    }

    // Use provided aliases or auto-suggest from name + bank
    const bankName = body.bank.trim();
    const aliases = body.aliases && body.aliases.length > 0
      ? body.aliases
      : suggestAliases(cardName, bankName);

    const inserted = db
      .insert(cards)
      .values({
        name: cardName,
        labelName: cardName,
        bank: bankName,
        lastFour: body.lastFour?.trim() || null,
        cycleStart: body.cycleStart,
        cycleEnd: body.cycleEnd,
        statementDay: body.statementDay,
        dueDay: body.dueDay,
        creditLimit: body.creditLimit ?? null,
        color: body.color ?? null,
        aliases: JSON.stringify(aliases),
        isActive: 1,
      })
      .returning()
      .get();

    return NextResponse.json({ success: true, data: mapCard(inserted) });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create card";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cards — update an existing card.
 */
export async function PUT(
  request: NextRequest
): Promise<NextResponse<ApiResponse<CardData>>> {
  try {
    const body = (await request.json()) as CardInput & { id: number };

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "Card ID is required" },
        { status: 400 }
      );
    }

    const existing = db
      .select()
      .from(cards)
      .where(eq(cards.id, body.id))
      .get();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Card not found" },
        { status: 404 }
      );
    }

    const cardName = body.name?.trim() || existing.name;

    // If name changed, update the label too
    if (cardName !== existing.name) {
      const oldLabel = db
        .select()
        .from(labels)
        .where(eq(labels.name, existing.labelName))
        .get();

      if (oldLabel) {
        db.update(labels)
          .set({ name: cardName })
          .where(eq(labels.id, oldLabel.id))
          .run();
      }
    }

    // Handle aliases: use provided, or keep existing
    const aliasesJson = body.aliases !== undefined
      ? JSON.stringify(body.aliases)
      : existing.aliases;

    const updated = db
      .update(cards)
      .set({
        name: cardName,
        labelName: cardName,
        bank: body.bank?.trim() || existing.bank,
        lastFour: body.lastFour?.trim() ?? existing.lastFour,
        cycleStart: body.cycleStart ?? existing.cycleStart,
        cycleEnd: body.cycleEnd ?? existing.cycleEnd,
        statementDay: body.statementDay ?? existing.statementDay,
        dueDay: body.dueDay ?? existing.dueDay,
        creditLimit: body.creditLimit !== undefined ? body.creditLimit : existing.creditLimit,
        color: body.color !== undefined ? body.color : existing.color,
        aliases: aliasesJson,
        updatedAt: new Date().toISOString().replace("T", " ").slice(0, 19),
      })
      .where(eq(cards.id, body.id))
      .returning()
      .get();

    return NextResponse.json({ success: true, data: mapCard(updated) });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update card";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/cards — toggle active/inactive (deactivate or reactivate).
 * Body: { id: number, isActive: 0 | 1 }
 */
export async function PATCH(
  request: NextRequest
): Promise<NextResponse<ApiResponse<CardData>>> {
  try {
    const body = (await request.json()) as { id: number; isActive: number };

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "Card ID is required" },
        { status: 400 }
      );
    }

    const existing = db
      .select()
      .from(cards)
      .where(eq(cards.id, body.id))
      .get();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Card not found" },
        { status: 404 }
      );
    }

    const updated = db
      .update(cards)
      .set({
        isActive: body.isActive,
        updatedAt: new Date().toISOString().replace("T", " ").slice(0, 19),
      })
      .where(eq(cards.id, body.id))
      .returning()
      .get();

    return NextResponse.json({ success: true, data: mapCard(updated) });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update card status";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
