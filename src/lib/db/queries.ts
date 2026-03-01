import { db, sqlite } from "@/lib/db";
import { cards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface CyclePaymentStatus {
  id: number;
  isPaid: boolean;
  amount: number;
  paidAt: string | null;
}

export interface CardCycleSpend {
  cardId: number;
  cardName: string;
  bank: string;
  lastFour: string | null;
  color: string | null;
  creditLimit: number | null;
  cycleStart: number;
  cycleEnd: number;
  statementDay: number;
  dueDay: number;
  cycleSpend: number;
  emiMonthly: number;
  transactionCount: number;
  currentCyclePayment: CyclePaymentStatus | null;
  prevCyclePayment: CyclePaymentStatus | null;
}

export interface LabelSpend {
  labelId: number;
  labelName: string;
  total: number;
  transactionCount: number;
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

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

  return { start: fmtDate(startDate), end: fmtDate(endDate) };
}

export function getCardCycleData(): CardCycleSpend[] {
  const activeCards = db
    .select()
    .from(cards)
    .where(eq(cards.isActive, 1))
    .all();

  const paymentLookupStmt = sqlite.prepare(
    `SELECT id, is_paid as isPaid, amount, paid_at as paidAt
     FROM cycle_payments
     WHERE card_id = ? AND cycle_start = ? AND cycle_end = ?`
  );

  return activeCards.map((card) => {
    const cycleDates = getCycleDates(card);

    const cycleSpendRow = sqlite
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as cnt
         FROM transactions
         WHERE card_id = ? AND transaction_date >= ? AND transaction_date <= ?`
      )
      .get(card.id, cycleDates.start, cycleDates.end) as {
      total: number;
      cnt: number;
    };

    const emiRow = sqlite
      .prepare(
        `SELECT COALESCE(SUM(monthly_amount), 0) as total
         FROM emis
         WHERE card_id = ? AND is_active = 1`
      )
      .get(card.id) as { total: number };

    // Payment status for current cycle
    const currentPaymentRow = paymentLookupStmt.get(
      card.id, cycleDates.start, cycleDates.end
    ) as { id: number; isPaid: number; amount: number; paidAt: string | null } | undefined;

    const currentCyclePayment: CyclePaymentStatus | null = currentPaymentRow
      ? { id: currentPaymentRow.id, isPaid: currentPaymentRow.isPaid === 1, amount: currentPaymentRow.amount, paidAt: currentPaymentRow.paidAt }
      : null;

    // Previous cycle dates
    const prevCycleStartDate = new Date(cycleDates.start);
    prevCycleStartDate.setDate(prevCycleStartDate.getDate() - 1);
    const prevEndStr = fmtDate(prevCycleStartDate);
    const prevStartDate = new Date(prevCycleStartDate);
    if (card.cycleEnd < card.cycleStart) {
      prevStartDate.setMonth(prevStartDate.getMonth() - 1);
    }
    const capDay = (day: number, y: number, m: number) => {
      const lastDay = new Date(y, m + 1, 0).getDate();
      return Math.min(day, lastDay);
    };
    const prevStartActualDay = capDay(card.cycleStart, prevStartDate.getFullYear(), prevStartDate.getMonth());
    const prevStartStr = fmtDate(new Date(prevStartDate.getFullYear(), prevStartDate.getMonth(), prevStartActualDay));

    const prevPaymentRow = paymentLookupStmt.get(
      card.id, prevStartStr, prevEndStr
    ) as { id: number; isPaid: number; amount: number; paidAt: string | null } | undefined;

    const prevCyclePayment: CyclePaymentStatus | null = prevPaymentRow
      ? { id: prevPaymentRow.id, isPaid: prevPaymentRow.isPaid === 1, amount: prevPaymentRow.amount, paidAt: prevPaymentRow.paidAt }
      : null;

    return {
      cardId: card.id,
      cardName: card.name,
      bank: card.bank,
      lastFour: card.lastFour,
      color: card.color,
      creditLimit: card.creditLimit,
      cycleStart: card.cycleStart,
      cycleEnd: card.cycleEnd,
      statementDay: card.statementDay,
      dueDay: card.dueDay,
      cycleSpend: cycleSpendRow.total,
      emiMonthly: emiRow.total,
      transactionCount: cycleSpendRow.cnt,
      currentCyclePayment,
      prevCyclePayment,
    };
  });
}

export function getTopLabelSpends(year: number, month: number, limit: number = 6): { labelName: string; total: number }[] {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const rows = sqlite
    .prepare(
      `SELECT l.name as labelName, COALESCE(SUM(t.amount), 0) as total
       FROM transaction_labels tl
       JOIN labels l ON tl.label_id = l.id
       JOIN transactions t ON tl.transaction_id = t.id
       WHERE t.transaction_date >= ? AND t.transaction_date <= ?
       GROUP BY l.id, l.name
       ORDER BY total DESC
       LIMIT ?`
    )
    .all(start, end, limit) as { labelName: string; total: number }[];

  return rows;
}
