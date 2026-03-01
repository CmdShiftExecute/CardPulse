"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { MonthlyHero } from "@/components/dashboard/monthly-hero";
import { CategoryDonut } from "@/components/dashboard/category-donut";
import { LabelDonut } from "@/components/dashboard/label-donut";
import { CardCycleCard } from "@/components/dashboard/card-cycle-card";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { EmiSummaryStrip } from "@/components/emis/emi-summary-strip";
import { BudgetStrip } from "@/components/dashboard/budget-strip";
import { CreditOverview } from "@/components/dashboard/credit-overview";
import { ExportModal } from "@/components/dashboard/export-modal";
import { PaymentDueSummary } from "@/components/dashboard/payment-due-summary";
import { TopTransactionsEmi } from "@/components/dashboard/top-transactions-emi";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { CreditCard, Download, PieChart, Receipt, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { SkeletonDashboard } from "@/components/ui/skeleton";
import { PageTransition } from "@/components/ui/page-transition";

interface CategorySpend {
  categoryId: number;
  categoryName: string;
  total: number;
}

interface SubcategorySpend {
  categoryId: number;
  categoryName: string;
  subcategoryId: number;
  subcategoryName: string;
  total: number;
}

interface LabelSpend {
  labelId: number;
  labelName: string;
  total: number;
  transactionCount: number;
}

interface CategoryLabelLink {
  categoryId: number;
  categoryName: string;
  labelId: number;
  labelName: string;
  total: number;
}

interface CyclePaymentStatus {
  id: number;
  isPaid: boolean;
  amount: number;
  paidAt: string | null;
}

interface CardCycleData {
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

interface RecentTransaction {
  id: number;
  amount: number;
  description: string;
  merchant: string | null;
  transactionDate: string;
  categoryName: string | null;
  subcategoryName: string | null;
  cardName: string | null;
  cardColor: string | null;
}

interface CardMonthSpend {
  cardId: number;
  cardName: string;
  lastFour: string | null;
  color: string | null;
  total: number;
  transactionCount: number;
}

interface DashboardData {
  monthTotal: number;
  prevMonthTotal: number;
  percentChange: number;
  categoryBreakdown: CategorySpend[];
  subcategoryBreakdown: SubcategorySpend[];
  labelBreakdown: LabelSpend[];
  categoryLabelLinks: CategoryLabelLink[];
  cardCycleData: CardCycleData[];
  recentTransactions: RecentTransaction[];
  cardSpend: CardMonthSpend[];
}

export default function DashboardPage() {
  const now = new Date();
  const [period, setPeriod] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const year = period.year;
  const month = period.month;
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const fetchData = useCallback(async (y: number, m: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics?year=${y}&month=${m}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || "Failed to load dashboard data");
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

  const handlePaymentChange = useCallback(() => {
    fetchData(year, month);
  }, [year, month, fetchData]);

  function handlePrevMonth() {
    setPeriod((p) => p.month === 1
      ? { year: p.year - 1, month: 12 }
      : { year: p.year, month: p.month - 1 }
    );
  }

  function handleNextMonth() {
    const isCurrentMonth =
      year === now.getFullYear() && month === now.getMonth() + 1;
    if (isCurrentMonth) return;

    setPeriod((p) => p.month === 12
      ? { year: p.year + 1, month: 1 }
      : { year: p.year, month: p.month + 1 }
    );
  }

  return (
    <AppShell>
      <PageTransition>
      {loading && !data ? (
        <SkeletonDashboard />
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-6"
        >
          {/* First-run welcome state */}
          {data.cardCycleData.length === 0 && data.recentTransactions.length === 0 && data.monthTotal === 0 && (
            <div className="rounded-card border border-border bg-surface-1 p-6">
              <div className="flex flex-col items-center py-10">
                <div className="h-16 w-16 rounded-full bg-sage-400/10 flex items-center justify-center mb-4">
                  <CreditCard size={28} className="text-sage-400/50" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-1">Welcome to CardPulse</h3>
                <p className="text-sm text-text-muted mb-6 text-center max-w-sm">
                  Add your credit cards to start tracking expenses, monitor billing cycles, and stay on top of due dates.
                </p>
                <a
                  href="/cards"
                  className="inline-flex items-center gap-2 rounded-button bg-sage-400 px-4 py-2 text-sm font-medium text-text-on-accent hover:bg-sage-300 transition-colors"
                >
                  <CreditCard size={16} />
                  Add Your First Card
                </a>
              </div>
            </div>
          )}

          {/* Row 1: Monthly Hero + Export Button */}
          <div className="relative">
            <MonthlyHero
              monthTotal={data.monthTotal}
              prevMonthTotal={data.prevMonthTotal}
              percentChange={data.percentChange}
              year={year}
              month={month}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              cardSpend={data.cardSpend}
            />
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              onClick={() => setExportOpen(true)}
              className="absolute right-4 bottom-4 flex items-center gap-2 rounded-button bg-surface-3/80 backdrop-blur border border-border-hover px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-all duration-150"
              aria-label="Export report"
            >
              <Download size={14} />
              Export
            </motion.button>
          </div>

          {/* Row 2: Payment Due Summary + Top Transactions & EMI Status (never collapses) */}
          {data.cardCycleData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PaymentDueSummary
                cards={data.cardCycleData}
                onPaymentChange={handlePaymentChange}
              />
              <TopTransactionsEmi
                initialMonth={month}
                initialYear={year}
              />
            </div>
          )}

          {/* Row 3: Category Donut + Label Donut (collapsible) */}
          <CollapsibleSection
            id="dashboard-charts"
            title="Spending Breakdown"
            icon={<PieChart size={16} />}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CategoryDonut
                data={data.categoryBreakdown}
                subcategoryData={data.subcategoryBreakdown}
                categoryLabelLinks={data.categoryLabelLinks}
                monthTotal={data.monthTotal}
              />
              <LabelDonut
                data={data.labelBreakdown}
                categoryLabelLinks={data.categoryLabelLinks}
                monthTotal={data.monthTotal}
              />
            </div>
          </CollapsibleSection>

          {/* Row 4: Recent Transactions (collapsible) */}
          <CollapsibleSection
            id="dashboard-recent-txns"
            title="Recent Transactions"
            icon={<Receipt size={16} />}
          >
            <RecentTransactions data={data.recentTransactions} />
          </CollapsibleSection>

          {/* Row 5: Budget Tracking Strip (not wrapped) */}
          <BudgetStrip year={year} month={month} />

          {/* Row 6: EMI Summary Strip (not wrapped) */}
          <EmiSummaryStrip />

          {/* Row 7: Credit Overview (collapsible) */}
          {data.cardCycleData.length > 0 && (
            <CollapsibleSection
              id="dashboard-credit"
              title="Credit Overview"
              icon={<ShieldCheck size={16} />}
            >
              <CreditOverview cards={data.cardCycleData} />
            </CollapsibleSection>
          )}

          {/* Row 8: Card Cycle Status (collapsible) */}
          {data.cardCycleData.length > 0 && (
            <CollapsibleSection
              id="dashboard-card-cycles"
              title="Card Cycle Status"
              icon={<CreditCard size={16} />}
            >
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard size={18} className="text-text-muted" />
                  <h3 className="text-lg font-semibold text-text-primary">
                    Card Cycle Status
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {data.cardCycleData.map((card, i) => (
                    <CardCycleCard
                      key={card.cardId}
                      card={card}
                      index={i}
                    />
                  ))}
                </div>
              </div>
            </CollapsibleSection>
          )}
        </motion.div>
      ) : null}
      </PageTransition>

      {/* Export Modal */}
      <ExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        defaultYear={year}
        defaultMonth={month}
      />
    </AppShell>
  );
}
