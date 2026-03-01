/**
 * Shared billing cycle utilities.
 *
 * KEY INSIGHT: The "due date" is NOT relative to the current cycle — it's
 * for the PREVIOUS cycle's statement. When the statement is generated at
 * cycleEnd, the payment is due ~N days later (typically in the next month).
 *
 * For EIB cards (cycle 1-31, statement 31, dueDay 25):
 *   - Jan 1-31 cycle → statement Jan 31 → due Feb 25
 *   - Feb 1-28 cycle → statement Feb 28 → due Mar 25
 *
 * So the "due date" shown alongside the CURRENT cycle should be the due
 * date for the current cycle's bill — which falls AFTER the statement date.
 */

interface CardCycleConfig {
  cycleStart: number;
  cycleEnd: number;
  statementDay: number;
  dueDay: number;
}

function capDay(day: number, year: number, month: number): number {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return Math.min(day, lastDay);
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function diffDays(a: Date, b: Date): number {
  return Math.ceil((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate the current billing cycle dates for a card.
 */
function getCurrentCycleDates(card: CardCycleConfig): {
  cycleStartDate: Date;
  cycleEndDate: Date;
} {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let cycleStartDate: Date;
  let cycleEndDate: Date;

  if (currentDay >= card.cycleStart) {
    const startDay = capDay(card.cycleStart, currentYear, currentMonth);
    cycleStartDate = new Date(currentYear, currentMonth, startDay);

    if (card.cycleEnd < card.cycleStart) {
      const nextMonth = currentMonth + 1;
      const nextYear = nextMonth > 11 ? currentYear + 1 : currentYear;
      const adjMonth = nextMonth > 11 ? 0 : nextMonth;
      const endDay = capDay(card.cycleEnd, nextYear, adjMonth);
      cycleEndDate = new Date(nextYear, adjMonth, endDay);
    } else {
      const endDay = capDay(card.cycleEnd, currentYear, currentMonth);
      cycleEndDate = new Date(currentYear, currentMonth, endDay);
    }
  } else {
    const prevMonth = currentMonth - 1;
    const prevYear = prevMonth < 0 ? currentYear - 1 : currentYear;
    const adjMonth = prevMonth < 0 ? 11 : prevMonth;
    const startDay = capDay(card.cycleStart, prevYear, adjMonth);
    cycleStartDate = new Date(prevYear, adjMonth, startDay);

    const endDay = capDay(card.cycleEnd, currentYear, currentMonth);
    cycleEndDate = new Date(currentYear, currentMonth, endDay);
  }

  return { cycleStartDate, cycleEndDate };
}

/**
 * Calculate the statement date for a given cycle.
 * The statement is generated on statementDay, but it's tied to the cycle end.
 * For a cycle ending Jan 31 with statementDay=31 → statement is Jan 31.
 * For a cycle ending Feb 9 with statementDay=9 → statement is Feb 9.
 */
function getStatementDateForCycle(
  card: CardCycleConfig,
  cycleEndDate: Date
): Date {
  // The statement is generated on the statementDay in the same month as cycleEnd
  const stmtMonth = cycleEndDate.getMonth();
  const stmtYear = cycleEndDate.getFullYear();
  const stmtDay = capDay(card.statementDay, stmtYear, stmtMonth);
  return new Date(stmtYear, stmtMonth, stmtDay);
}

/**
 * Calculate the payment due date for a given cycle's statement.
 *
 * The due date always falls AFTER the statement date.
 * If dueDay > statementDay in the same month, it's the same month.
 * If dueDay < statementDay, it's the NEXT month (most common case).
 *
 * Examples from CLAUDE.md:
 *   - EIB: statement 31st, due 25th → due is NEXT month 25th
 *   - ENBD: statement 9th, due 3rd → due is NEXT month 3rd
 *   - Mashreq: statement 23rd, due 19th → due is NEXT month 19th
 *   - FAB: statement 1st, due 26th → due is SAME month 26th
 */
function getDueDateForCycle(
  card: CardCycleConfig,
  statementDate: Date
): Date {
  const stmtMonth = statementDate.getMonth();
  const stmtYear = statementDate.getFullYear();

  if (card.dueDay > card.statementDay) {
    // Due date is in the same month as statement (e.g., FAB: stmt 1st, due 26th)
    const dDay = capDay(card.dueDay, stmtYear, stmtMonth);
    return new Date(stmtYear, stmtMonth, dDay);
  } else {
    // Due date is in the NEXT month after statement (most cards)
    const nextMonth = stmtMonth + 1;
    const nextYear = nextMonth > 11 ? stmtYear + 1 : stmtYear;
    const adjMonth = nextMonth > 11 ? 0 : nextMonth;
    const dDay = capDay(card.dueDay, nextYear, adjMonth);
    return new Date(nextYear, adjMonth, dDay);
  }
}

export interface CycleInfo {
  cycleRange: string;
  cycleStartDate: Date;
  cycleEndDate: Date;
  // Statement for CURRENT cycle
  statementDate: Date;
  statementDateStr: string;
  daysUntilStatement: number;
  // Due date for CURRENT cycle (falls after statement)
  dueDate: Date;
  dueDateStr: string;
  daysUntilDue: number;
  // Due date for PREVIOUS cycle (may be upcoming or past)
  prevCycleDueDate: Date;
  prevCycleDueDateStr: string;
  daysUntilPrevDue: number;
}

/**
 * Full cycle info calculation with correct due date logic.
 */
export function getCycleInfo(card: CardCycleConfig): CycleInfo {
  const now = new Date();
  const { cycleStartDate, cycleEndDate } = getCurrentCycleDates(card);

  // Statement date for the current cycle
  const statementDate = getStatementDateForCycle(card, cycleEndDate);

  // Due date for the CURRENT cycle (payment due after current cycle's statement)
  const dueDate = getDueDateForCycle(card, statementDate);

  // Previous cycle's statement & due date (for showing "previous cycle due" info)
  // Previous cycle ended one day before current cycle started
  const prevCycleEnd = new Date(cycleStartDate);
  prevCycleEnd.setDate(prevCycleEnd.getDate() - 1);
  const prevStatement = getStatementDateForCycle(card, prevCycleEnd);
  const prevCycleDueDate = getDueDateForCycle(card, prevStatement);

  const daysUntilStatement = Math.max(0, diffDays(statementDate, now));
  const daysUntilDue = diffDays(dueDate, now); // Can be negative if past
  const daysUntilPrevDue = diffDays(prevCycleDueDate, now); // Can be negative if past

  return {
    cycleRange: `${formatShortDate(cycleStartDate)} — ${formatShortDate(cycleEndDate)}`,
    cycleStartDate,
    cycleEndDate,
    statementDate,
    statementDateStr: formatShortDate(statementDate),
    daysUntilStatement,
    dueDate,
    dueDateStr: formatShortDate(dueDate),
    daysUntilDue,
    prevCycleDueDate,
    prevCycleDueDateStr: formatShortDate(prevCycleDueDate),
    daysUntilPrevDue,
  };
}

export { capDay, formatShortDate, diffDays, getStatementDateForCycle, getDueDateForCycle };
export type { CardCycleConfig };
