"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { MonthlyDrilldown } from "@/components/analytics/monthly-drilldown";
import { CycleTimeline } from "@/components/analytics/cycle-timeline";
import { TrendsTab } from "@/components/analytics/trends-tab";
import { CompareTab } from "@/components/analytics/compare-tab";
import { CardBreakdown } from "@/components/analytics/card-breakdown";
import { EmiLandscape } from "@/components/analytics/emi-landscape";
import { BudgetVsActual } from "@/components/analytics/budget-vs-actual";
import {
  PieChart as PieIcon,
  TrendingUp,
  CreditCard,
  Timer,
  Layers,
  Target,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { SkeletonChart, SkeletonCard } from "@/components/ui/skeleton";
import { PageTransition } from "@/components/ui/page-transition";

/* ── Types ─────────────────────────────────────────────── */

interface MonthlyTrend {
  year: number;
  month: number;
  label: string;
  total: number;
}

interface CategoryTrend {
  categoryId: number;
  categoryName: string;
  months: { year: number; month: number; label: string; total: number }[];
}

interface LabelTrend {
  labelId: number;
  labelName: string;
  months: { year: number; month: number; label: string; total: number }[];
}

interface SubcategoryTrend {
  subcategoryId: number;
  subcategoryName: string;
  categoryId: number;
  months: { year: number; month: number; label: string; total: number }[];
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

interface SubcategoryRow {
  subcategoryId: number;
  subcategoryName: string;
  total: number;
}

interface CategoryDrilldown {
  categoryId: number;
  categoryName: string;
  total: number;
  percent: number;
  subcategories: SubcategoryRow[];
}

interface CardMonthlySpend {
  cardId: number;
  cardName: string;
  color: string;
  months: { year: number; month: number; label: string; total: number }[];
}

interface CycleTimelineEvent {
  type: "expense" | "emi";
  cardId: number;
  cardName: string;
  cardColor: string;
  amount: number;
  description: string;
  date: string;
  categoryName: string | null;
}

interface CyclePeriod {
  start: string;
  end: string;
  expenses: number;
  emiTotal: number;
  total: number;
  events: CycleTimelineEvent[];
  paymentDueDate: string;
}

interface CycleForecast {
  cardId: number;
  cardName: string;
  cardColor: string;
  bank: string;
  lastFour: string | null;
  creditLimit: number | null;
  previousCycle: CyclePeriod;
  currentCycle: CyclePeriod;
  nextCycle: {
    start: string;
    end: string;
    emiTotal: number;
    paymentDueDate: string;
  };
  statementDay: number;
  dueDay: number;
}

interface EmiLandscapeItem {
  id: number;
  description: string;
  cardId: number;
  cardName: string;
  cardColor: string;
  monthlyAmount: number;
  originalAmount: number;
  totalMonths: number;
  monthsRemaining: number;
  monthsPaid: number;
  progress: number;
  startDate: string;
  endDate: string | null;
  categoryName: string | null;
  isActive: number;
}

interface LabelDrilldown {
  labelId: number;
  labelName: string;
  total: number;
  percent: number;
  transactionCount: number;
}

interface CategoryLabelLink {
  categoryId: number;
  categoryName: string;
  labelId: number;
  labelName: string;
  total: number;
}

interface AnalyticsData {
  monthlyTrends: MonthlyTrend[];
  categoryTrends: CategoryTrend[];
  labelTrends: LabelTrend[];
  subcategoryTrends: SubcategoryTrend[];
  insightStats: InsightStats;
  categoryDrilldown: CategoryDrilldown[];
  labelDrilldown: LabelDrilldown[];
  categoryLabelLinks: CategoryLabelLink[];
  cardMonthlySpend: CardMonthlySpend[];
  cycleForecast: CycleForecast[];
  emiLandscape: EmiLandscapeItem[];
}

/* ── Tab definitions ───────────────────────────────────── */

type TabId = "trends" | "compare" | "drilldown" | "cycles" | "cards" | "emis" | "budgets";

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

const TABS: TabDef[] = [
  { id: "trends", label: "Trends", icon: TrendingUp },
  { id: "compare", label: "Compare", icon: ArrowLeftRight },
  { id: "drilldown", label: "Monthly", icon: PieIcon },
  { id: "cycles", label: "Cycles", icon: Timer },
  { id: "cards", label: "Cards", icon: CreditCard },
  { id: "emis", label: "EMIs", icon: Layers },
  { id: "budgets", label: "Budgets", icon: Target },
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/* ── Page ──────────────────────────────────────────────── */

export default function AnalyticsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [activeTab, setActiveTab] = useState<TabId>("trends");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  const fetchData = useCallback(async (y: number, m: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics/detailed?year=${y}&month=${m}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || "Failed to load analytics");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(year, month);
  }, [year, month, fetchData]);

  function handlePrevMonth() {
    setMonth((prev) => {
      if (prev === 1) {
        setYear((y) => y - 1);
        return 12;
      }
      return prev - 1;
    });
  }

  function handleNextMonth() {
    if (isCurrentMonth) return;
    setMonth((prev) => {
      if (prev === 12) {
        setYear((y) => y + 1);
        return 1;
      }
      return prev + 1;
    });
  }

  // Compare tab has its own month pickers, so we hide the global month nav for it
  const showMonthNav = activeTab !== "compare";

  return (
    <AppShell>
      <PageTransition>
      <div className="flex flex-col gap-6">
        {/* Page header with month nav + tabs */}
        <div className="flex flex-col gap-4">
          {/* Month navigator — hidden for Compare tab */}
          {showMonthNav && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrevMonth}
                  className="flex h-8 w-8 items-center justify-center rounded-button text-text-muted hover:text-text-primary hover:bg-surface-3 transition-all duration-150"
                  aria-label="Previous month"
                >
                  <ChevronLeft size={18} />
                </button>
                <AnimatePresence mode="wait">
                  <motion.h2
                    key={`${year}-${month}`}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                    className="text-xl font-bold text-text-primary"
                  >
                    {MONTH_NAMES[month - 1]}
                    <span className="ml-2 text-text-muted font-normal text-lg">{year}</span>
                  </motion.h2>
                </AnimatePresence>
                <button
                  onClick={handleNextMonth}
                  disabled={isCurrentMonth}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-button transition-all duration-150",
                    isCurrentMonth
                      ? "text-text-muted/30 cursor-not-allowed"
                      : "text-text-muted hover:text-text-primary hover:bg-surface-3"
                  )}
                  aria-label="Next month"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Tab bar */}
          <div className="flex items-center gap-1 rounded-card bg-surface-1 border border-border p-1 overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-button px-4 py-2 text-sm font-medium transition-all duration-150 whitespace-nowrap",
                    isActive
                      ? "bg-sage-400/15 text-sage-300"
                      : "text-text-muted hover:text-text-secondary hover:bg-surface-2"
                  )}
                  aria-label={tab.label}
                >
                  <Icon size={16} />
                  <span className="max-md:hidden">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        {activeTab === "compare" ? (
          /* Compare tab manages its own data fetching */
          <AnimatePresence mode="wait">
            <motion.div
              key="compare"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <CompareTab />
            </motion.div>
          </AnimatePresence>
        ) : loading && !data ? (
          <div className="flex flex-col gap-6">
            <SkeletonChart />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        ) : error && !data ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-14 w-14 rounded-full bg-danger/[0.08] flex items-center justify-center mb-3">
              <span className="text-danger text-xl">!</span>
            </div>
            <p className="text-sm text-danger">{error}</p>
            <button
              onClick={() => fetchData(year, month)}
              className="mt-3 text-sm text-seafoam-400 hover:text-seafoam-300 transition-colors"
            >
              Try again
            </button>
          </div>
        ) : data ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "trends" && (
                <TrendsTab
                  monthlyTrends={data.monthlyTrends}
                  categoryTrends={data.categoryTrends}
                  labelTrends={data.labelTrends}
                  subcategoryTrends={data.subcategoryTrends}
                  insightStats={data.insightStats}
                />
              )}

              {activeTab === "drilldown" && (
                <MonthlyDrilldown
                  data={data.categoryDrilldown}
                  labelData={data.labelDrilldown}
                  categoryLabelLinks={data.categoryLabelLinks}
                  monthTotal={data.monthlyTrends.find(
                    (t) => t.year === year && t.month === month
                  )?.total || 0}
                  monthLabel={monthLabel}
                />
              )}

              {activeTab === "cycles" && (
                <CycleTimeline data={data.cycleForecast} />
              )}

              {activeTab === "cards" && (
                <CardBreakdown data={data.cardMonthlySpend} />
              )}

              {activeTab === "emis" && (
                <EmiLandscape data={data.emiLandscape} />
              )}

              {activeTab === "budgets" && (
                <BudgetVsActual
                  year={year}
                  month={month}
                  monthLabel={monthLabel}
                />
              )}
            </motion.div>
          </AnimatePresence>
        ) : null}
      </div>
      </PageTransition>
    </AppShell>
  );
}
