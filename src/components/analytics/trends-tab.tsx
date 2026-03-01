"use client";

import { useState, useMemo } from "react";
import { DollarSign, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { formatAmount } from "@/lib/utils";
import { formatPercentChange } from "@/lib/chart-utils";
import { InsightCardRow } from "./insight-card";
import { TrendAreaChart } from "./trend-area-chart";
import { motion, AnimatePresence } from "framer-motion";

/* ── Types ──────────────────────────────────── */

interface MonthPoint {
  year: number;
  month: number;
  label: string;
  total: number;
}

interface CategoryTrend {
  categoryId: number;
  categoryName: string;
  months: MonthPoint[];
}

interface LabelTrend {
  labelId: number;
  labelName: string;
  months: MonthPoint[];
}

interface SubcategoryTrend {
  subcategoryId: number;
  subcategoryName: string;
  categoryId: number;
  months: MonthPoint[];
}

interface InsightStats {
  latestMonthTotal: number;
  latestMonthLabel: string;
  averageMonthlySpending: number;
  monthsTracked: number;
  mostSpentCategory: { name: string; total: number };
  biggestCategoryGainer: { name: string; percentChange: number };
  biggestCategorySaver: { name: string; percentChange: number };
  mostSpentLabel: { name: string; total: number };
  biggestLabelGainer: { name: string; percentChange: number };
  biggestLabelSaver: { name: string; percentChange: number };
}

interface TrendsTabProps {
  monthlyTrends: MonthPoint[];
  categoryTrends: CategoryTrend[];
  labelTrends: LabelTrend[];
  subcategoryTrends: SubcategoryTrend[];
  insightStats: InsightStats;
}

/* ── Section divider ─────────────────────────── */

function SectionHeader({ title, color }: { title: string; color: string }) {
  return (
    <div className="flex items-center gap-3 mt-4 first:mt-0">
      <div className="h-1 w-6 rounded-full" style={{ backgroundColor: color }} />
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
    </div>
  );
}

/* ── Main Component ──────────────────────────── */

export function TrendsTab({
  monthlyTrends,
  categoryTrends,
  labelTrends,
  subcategoryTrends,
  insightStats,
}: TrendsTabProps) {
  const colors = useThemeColors();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");
  const [selectedLabel, setSelectedLabel] = useState<string>("all");

  /* ── Overall chart data ────────────────────── */
  const overallData = useMemo(
    () => monthlyTrends.map((m) => ({ label: m.label, total: m.total })),
    [monthlyTrends]
  );

  /* ── Category chart data ───────────────────── */
  const categoryDropdownOptions = useMemo(() => {
    const opts = [{ value: "all", label: "All Categories" }];
    // Sort by total spend (sum across all months) descending
    const sorted = [...categoryTrends].sort((a, b) => {
      const aTotal = a.months.reduce((s, m) => s + m.total, 0);
      const bTotal = b.months.reduce((s, m) => s + m.total, 0);
      return bTotal - aTotal;
    });
    for (const cat of sorted) {
      opts.push({ value: String(cat.categoryId), label: cat.categoryName });
    }
    return opts;
  }, [categoryTrends]);

  const categoryChartData = useMemo(() => {
    if (selectedCategory === "all") {
      // Show total across all categories (= monthlyTrends)
      return monthlyTrends.map((m) => ({ label: m.label, total: m.total }));
    }
    const cat = categoryTrends.find((c) => String(c.categoryId) === selectedCategory);
    return cat?.months.map((m) => ({ label: m.label, total: m.total })) || [];
  }, [selectedCategory, categoryTrends, monthlyTrends]);

  /* ── Subcategory chart data ────────────────── */
  const selectedCatName = useMemo(() => {
    if (selectedCategory === "all") return null;
    return categoryTrends.find((c) => String(c.categoryId) === selectedCategory)?.categoryName || null;
  }, [selectedCategory, categoryTrends]);

  const filteredSubcategories = useMemo(() => {
    if (selectedCategory === "all") return [];
    return subcategoryTrends.filter((s) => String(s.categoryId) === selectedCategory);
  }, [selectedCategory, subcategoryTrends]);

  const subcategoryDropdownOptions = useMemo(() => {
    const opts = [{ value: "all", label: "All Subcategories" }];
    const sorted = [...filteredSubcategories].sort((a, b) => {
      const aTotal = a.months.reduce((s, m) => s + m.total, 0);
      const bTotal = b.months.reduce((s, m) => s + m.total, 0);
      return bTotal - aTotal;
    });
    for (const sub of sorted) {
      opts.push({ value: String(sub.subcategoryId), label: sub.subcategoryName });
    }
    return opts;
  }, [filteredSubcategories]);

  const subcategoryChartData = useMemo(() => {
    if (selectedSubcategory === "all") {
      // Show total for the parent category
      return categoryChartData;
    }
    const sub = filteredSubcategories.find((s) => String(s.subcategoryId) === selectedSubcategory);
    return sub?.months.map((m) => ({ label: m.label, total: m.total })) || [];
  }, [selectedSubcategory, filteredSubcategories, categoryChartData]);

  /* ── Label chart data ──────────────────────── */
  const labelDropdownOptions = useMemo(() => {
    const opts = [{ value: "all", label: "All Labels" }];
    const sorted = [...labelTrends].sort((a, b) => {
      const aTotal = a.months.reduce((s, m) => s + m.total, 0);
      const bTotal = b.months.reduce((s, m) => s + m.total, 0);
      return bTotal - aTotal;
    });
    for (const lbl of sorted) {
      opts.push({ value: String(lbl.labelId), label: lbl.labelName });
    }
    return opts;
  }, [labelTrends]);

  const labelChartData = useMemo(() => {
    if (selectedLabel === "all") {
      // Aggregate all label spend per month (note: may double-count since txns can have multiple labels)
      // Better to show total spending for context
      return monthlyTrends.map((m) => ({ label: m.label, total: m.total }));
    }
    const lbl = labelTrends.find((l) => String(l.labelId) === selectedLabel);
    return lbl?.months.map((m) => ({ label: m.label, total: m.total })) || [];
  }, [selectedLabel, labelTrends, monthlyTrends]);

  // Reset subcategory when category changes
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setSelectedSubcategory("all");
  };

  const stats = insightStats;

  return (
    <div className="flex flex-col gap-6">
      {/* ═══ OVERALL SPENDING SECTION ═══ */}
      <SectionHeader title="Overall Spending" color={colors.sage400} />

      <InsightCardRow
        cards={[
          {
            title: "Latest Month's Spending",
            value: formatAmount(stats.latestMonthTotal),
            subtitle: stats.latestMonthLabel,
            icon: DollarSign,
          },
          {
            title: "Average Monthly Spending",
            value: formatAmount(stats.averageMonthlySpending),
            subtitle: "Across all tracked months",
            icon: TrendingUp,
          },
          {
            title: "Months Tracked",
            value: String(stats.monthsTracked),
            subtitle: "First to last upload",
            icon: Calendar,
          },
        ]}
      />

      <TrendAreaChart
        data={overallData}
        color={colors.sage400}
        title="Overall Spending Trend"
        subtitle="Your total spending over the last several months."
      />

      {/* ═══ CATEGORY SPENDING SECTION ═══ */}
      <SectionHeader title="Category Spending" color={colors.seafoam400} />

      <InsightCardRow
        cards={[
          {
            title: "Most Spent Category",
            value: stats.mostSpentCategory.name,
            subtitle: `Spent ${formatAmount(stats.mostSpentCategory.total)} in latest month`,
            icon: DollarSign,
          },
          {
            title: "Biggest Gainer",
            value: stats.biggestCategoryGainer.name,
            subtitle: `${formatPercentChange(stats.biggestCategoryGainer.percentChange)} vs previous month`,
            icon: TrendingUp,
            valueColor: colors.danger,
          },
          {
            title: "Biggest Saver",
            value: stats.biggestCategorySaver.name,
            subtitle: `${formatPercentChange(stats.biggestCategorySaver.percentChange)} MoM vs previous month`,
            icon: TrendingDown,
            valueColor: colors.success,
          },
        ]}
      />

      <TrendAreaChart
        data={categoryChartData}
        color={colors.seafoam400}
        title="Category Spending Chart"
        subtitle="Analyze spending trends for specific categories over time."
        dropdownOptions={categoryDropdownOptions}
        selectedOption={selectedCategory}
        onSelect={handleCategoryChange}
      />

      {/* Subcategory chart — shown only when a specific category is selected */}
      <AnimatePresence>
        {selectedCategory !== "all" && filteredSubcategories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <TrendAreaChart
              data={subcategoryChartData}
              color={colors.chartColors[3]}
              title={`Subcategory Trends: ${selectedCatName}`}
              subtitle="Breakdown within the selected category."
              dropdownOptions={subcategoryDropdownOptions}
              selectedOption={selectedSubcategory}
              onSelect={setSelectedSubcategory}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ LABEL SPENDING SECTION ═══ */}
      <SectionHeader title="Label Spending" color={colors.sand400} />

      <InsightCardRow
        cards={[
          {
            title: "Most Spent Label",
            value: stats.mostSpentLabel.name,
            subtitle: `Spent ${formatAmount(stats.mostSpentLabel.total)} in latest month`,
            icon: DollarSign,
          },
          {
            title: "Biggest Gainer",
            value: stats.biggestLabelGainer.name,
            subtitle: `${formatPercentChange(stats.biggestLabelGainer.percentChange)} vs previous month`,
            icon: TrendingUp,
            valueColor: colors.danger,
          },
          {
            title: "Biggest Saver",
            value: stats.biggestLabelSaver.name,
            subtitle: `${formatPercentChange(stats.biggestLabelSaver.percentChange)} MoM vs previous month`,
            icon: TrendingDown,
            valueColor: colors.success,
          },
        ]}
      />

      <TrendAreaChart
        data={labelChartData}
        color={colors.sand400}
        title="Label Spending Chart"
        subtitle="Analyze spending trends for specific labels over time."
        dropdownOptions={labelDropdownOptions}
        selectedOption={selectedLabel}
        onSelect={setSelectedLabel}
      />
    </div>
  );
}
