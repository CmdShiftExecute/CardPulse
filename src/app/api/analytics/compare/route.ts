import { NextRequest, NextResponse } from "next/server";
import { sqlite } from "@/lib/db";
import type { ApiResponse } from "@/types";

/* ── Types ────────────────────────────────────────────── */

interface MonthSummary {
  year: number;
  month: number;
  label: string;
  total: number;
  txnCount: number;
  avgTxn: number;
}

interface CategoryComparisonRow {
  categoryId: number;
  categoryName: string;
  month1Total: number;
  month2Total: number;
  delta: number;
  percentChange: number;
  subcategories: SubcategoryComparisonRow[];
}

interface SubcategoryComparisonRow {
  subcategoryId: number;
  subcategoryName: string;
  month1Total: number;
  month2Total: number;
  delta: number;
  percentChange: number;
}

interface LabelComparisonRow {
  labelId: number;
  labelName: string;
  month1Total: number;
  month2Total: number;
  delta: number;
  percentChange: number;
}

interface CompareData {
  month1: MonthSummary;
  month2: MonthSummary;
  categoryComparison: CategoryComparisonRow[];
  labelComparison: LabelComparisonRow[];
}

/* ── Helpers ──────────────────────────────────────────── */

function getMonthLabel(year: number, month: number): string {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function getMonthRange(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

function pctChange(curr: number, prev: number): number {
  if (prev === 0 && curr === 0) return 0;
  if (prev === 0) return Infinity;
  return ((curr - prev) / prev) * 100;
}

/* ── Handler ──────────────────────────────────────────── */

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<CompareData>>> {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();

    const year1 = parseInt(searchParams.get("year1") || String(now.getFullYear()), 10);
    const month1 = parseInt(searchParams.get("month1") || String(now.getMonth()), 10); // prev month default
    const year2 = parseInt(searchParams.get("year2") || String(now.getFullYear()), 10);
    const month2 = parseInt(searchParams.get("month2") || String(now.getMonth() + 1), 10); // current month default

    const range1 = getMonthRange(year1, month1);
    const range2 = getMonthRange(year2, month2);

    /* ── Month summaries ──────────────────────────────── */
    const getMonthSummary = (year: number, month: number, start: string, end: string): MonthSummary => {
      const row = sqlite
        .prepare(`SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as cnt FROM transactions WHERE transaction_date >= ? AND transaction_date <= ?`)
        .get(start, end) as { total: number; cnt: number };
      return {
        year,
        month,
        label: getMonthLabel(year, month),
        total: row.total,
        txnCount: row.cnt,
        avgTxn: row.cnt > 0 ? row.total / row.cnt : 0,
      };
    }

    const m1Summary = getMonthSummary(year1, month1, range1.start, range1.end);
    const m2Summary = getMonthSummary(year2, month2, range2.start, range2.end);

    /* ── Category comparison ──────────────────────────── */
    const catRows1 = sqlite
      .prepare(`
        SELECT c.id as categoryId, c.name as categoryName, COALESCE(SUM(t.amount), 0) as total
        FROM transactions t JOIN categories c ON t.category_id = c.id
        WHERE t.transaction_date >= ? AND t.transaction_date <= ?
        GROUP BY c.id, c.name
      `)
      .all(range1.start, range1.end) as { categoryId: number; categoryName: string; total: number }[];

    const catRows2 = sqlite
      .prepare(`
        SELECT c.id as categoryId, c.name as categoryName, COALESCE(SUM(t.amount), 0) as total
        FROM transactions t JOIN categories c ON t.category_id = c.id
        WHERE t.transaction_date >= ? AND t.transaction_date <= ?
        GROUP BY c.id, c.name
      `)
      .all(range2.start, range2.end) as { categoryId: number; categoryName: string; total: number }[];

    // Merge both months' categories
    const allCatIds = new Set([...catRows1.map(c => c.categoryId), ...catRows2.map(c => c.categoryId)]);
    const catMap1 = new Map(catRows1.map(c => [c.categoryId, c]));
    const catMap2 = new Map(catRows2.map(c => [c.categoryId, c]));

    // Subcategory breakdown for comparison
    const subRows1 = sqlite
      .prepare(`
        SELECT s.id as subcategoryId, s.name as subcategoryName, c.id as categoryId,
               COALESCE(SUM(t.amount), 0) as total
        FROM transactions t
        JOIN subcategories s ON t.subcategory_id = s.id
        JOIN categories c ON t.category_id = c.id
        WHERE t.transaction_date >= ? AND t.transaction_date <= ?
        GROUP BY s.id, s.name, c.id
      `)
      .all(range1.start, range1.end) as { subcategoryId: number; subcategoryName: string; categoryId: number; total: number }[];

    const subRows2 = sqlite
      .prepare(`
        SELECT s.id as subcategoryId, s.name as subcategoryName, c.id as categoryId,
               COALESCE(SUM(t.amount), 0) as total
        FROM transactions t
        JOIN subcategories s ON t.subcategory_id = s.id
        JOIN categories c ON t.category_id = c.id
        WHERE t.transaction_date >= ? AND t.transaction_date <= ?
        GROUP BY s.id, s.name, c.id
      `)
      .all(range2.start, range2.end) as { subcategoryId: number; subcategoryName: string; categoryId: number; total: number }[];

    const subMap1 = new Map<number, Map<number, { subcategoryId: number; subcategoryName: string; total: number }>>();
    for (const r of subRows1) {
      if (!subMap1.has(r.categoryId)) subMap1.set(r.categoryId, new Map());
      subMap1.get(r.categoryId)!.set(r.subcategoryId, r);
    }
    const subMap2 = new Map<number, Map<number, { subcategoryId: number; subcategoryName: string; total: number }>>();
    for (const r of subRows2) {
      if (!subMap2.has(r.categoryId)) subMap2.set(r.categoryId, new Map());
      subMap2.get(r.categoryId)!.set(r.subcategoryId, r);
    }

    const categoryComparison: CategoryComparisonRow[] = Array.from(allCatIds).map((catId) => {
      const c1 = catMap1.get(catId);
      const c2 = catMap2.get(catId);
      const m1Total = c1?.total || 0;
      const m2Total = c2?.total || 0;
      const name = c2?.categoryName || c1?.categoryName || "Unknown";

      // Build subcategory comparison for this category
      const subs1 = subMap1.get(catId) || new Map();
      const subs2 = subMap2.get(catId) || new Map();
      const allSubIds = new Set([...Array.from(subs1.keys()), ...Array.from(subs2.keys())]);

      const subcategories: SubcategoryComparisonRow[] = Array.from(allSubIds).map((subId) => {
        const s1 = subs1.get(subId);
        const s2 = subs2.get(subId);
        const s1Total = s1?.total || 0;
        const s2Total = s2?.total || 0;
        return {
          subcategoryId: subId,
          subcategoryName: s2?.subcategoryName || s1?.subcategoryName || "Unknown",
          month1Total: s1Total,
          month2Total: s2Total,
          delta: s2Total - s1Total,
          percentChange: pctChange(s2Total, s1Total),
        };
      }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

      return {
        categoryId: catId,
        categoryName: name,
        month1Total: m1Total,
        month2Total: m2Total,
        delta: m2Total - m1Total,
        percentChange: pctChange(m2Total, m1Total),
        subcategories,
      };
    }).sort((a, b) => Math.max(b.month1Total, b.month2Total) - Math.max(a.month1Total, a.month2Total));

    /* ── Label comparison ─────────────────────────────── */
    const lblRows1 = sqlite
      .prepare(`
        SELECT l.id as labelId, l.name as labelName, COALESCE(SUM(t.amount), 0) as total
        FROM transaction_labels tl
        JOIN labels l ON tl.label_id = l.id
        JOIN transactions t ON tl.transaction_id = t.id
        WHERE t.transaction_date >= ? AND t.transaction_date <= ?
        GROUP BY l.id, l.name
      `)
      .all(range1.start, range1.end) as { labelId: number; labelName: string; total: number }[];

    const lblRows2 = sqlite
      .prepare(`
        SELECT l.id as labelId, l.name as labelName, COALESCE(SUM(t.amount), 0) as total
        FROM transaction_labels tl
        JOIN labels l ON tl.label_id = l.id
        JOIN transactions t ON tl.transaction_id = t.id
        WHERE t.transaction_date >= ? AND t.transaction_date <= ?
        GROUP BY l.id, l.name
      `)
      .all(range2.start, range2.end) as { labelId: number; labelName: string; total: number }[];

    const allLblIds = new Set([...lblRows1.map(l => l.labelId), ...lblRows2.map(l => l.labelId)]);
    const lblMap1 = new Map(lblRows1.map(l => [l.labelId, l]));
    const lblMap2 = new Map(lblRows2.map(l => [l.labelId, l]));

    const labelComparison: LabelComparisonRow[] = Array.from(allLblIds).map((lblId) => {
      const l1 = lblMap1.get(lblId);
      const l2 = lblMap2.get(lblId);
      const m1Total = l1?.total || 0;
      const m2Total = l2?.total || 0;
      return {
        labelId: lblId,
        labelName: l2?.labelName || l1?.labelName || "Unknown",
        month1Total: m1Total,
        month2Total: m2Total,
        delta: m2Total - m1Total,
        percentChange: pctChange(m2Total, m1Total),
      };
    }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    return NextResponse.json({
      success: true,
      data: {
        month1: m1Summary,
        month2: m2Summary,
        categoryComparison,
        labelComparison,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch comparison data";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
