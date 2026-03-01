"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { BudgetCard, type BudgetCardData } from "@/components/budgets/budget-card";
import { BudgetOverview, type BudgetSummary } from "@/components/budgets/budget-overview";
import { BudgetForm } from "@/components/budgets/budget-form";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { SkeletonGrid, SkeletonCard } from "@/components/ui/skeleton";
import { PageTransition } from "@/components/ui/page-transition";

interface Category {
  id: number;
  name: string;
  subcategories: { id: number; name: string }[];
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function BudgetsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [budgets, setBudgets] = useState<BudgetCardData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<{
    id: number;
    categoryId: number;
    subcategoryId: number | null;
    amount: number;
  } | null>(null);

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const fetchBudgets = useCallback(async (y: number, m: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/budgets?year=${y}&month=${m}`);
      const json = await res.json();
      if (json.success) {
        setBudgets(json.data);
      } else {
        setError(json.error || "Failed to load budgets");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      const json = await res.json();
      if (json.success) {
        setCategories(json.data);
      }
    } catch {
      // Silently fail — categories are non-critical for display
    }
  }, []);

  useEffect(() => {
    fetchBudgets(year, month);
    fetchCategories();
  }, [year, month, fetchBudgets, fetchCategories]);

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
    setMonth((prev) => {
      if (prev === 12) {
        setYear((y) => y + 1);
        return 1;
      }
      return prev + 1;
    });
  }

  async function handleSaveBudget(data: {
    categoryId: number;
    subcategoryId: number | null;
    amount: number;
  }) {
    const payload = {
      ...data,
      month,
      year,
      ...(editData ? { id: editData.id } : {}),
    };

    const res = await fetch("/api/budgets", {
      method: editData ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error);
    }

    await fetchBudgets(year, month);
  }

  async function handleDeleteBudget(id: number) {
    try {
      const res = await fetch(`/api/budgets?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setBudgets((prev) => prev.filter((b) => b.id !== id));
      }
    } catch {
      // Silently fail
    }
  }

  function handleEditBudget(budget: BudgetCardData) {
    setEditData({
      id: budget.id,
      categoryId: budget.categoryId,
      subcategoryId: budget.subcategoryId,
      amount: budget.amount,
    });
    setFormOpen(true);
  }

  function handleAddBudget() {
    setEditData(null);
    setFormOpen(true);
  }

  // Compute summary
  const summary: BudgetSummary = {
    totalBudget: budgets.reduce((s, b) => s + b.amount, 0),
    totalSpent: budgets.reduce((s, b) => s + b.spent, 0),
    overBudgetCount: budgets.filter((b) => b.percent >= 100).length,
    approachingCount: budgets.filter((b) => b.percent >= 75 && b.percent < 100).length,
    onTrackCount: budgets.filter((b) => b.percent < 75).length,
  };

  // Sort budgets: over budget first, then approaching, then on track
  const sortedBudgets = [...budgets].sort((a, b) => b.percent - a.percent);

  return (
    <AppShell>
      <PageTransition>
      <div className="flex flex-col gap-6">
        {/* Page header with month nav */}
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
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-button transition-all duration-150",
                isCurrentMonth
                  ? "text-text-muted/30 cursor-not-allowed"
                  : "text-text-muted hover:text-text-primary hover:bg-surface-3"
              )}
              aria-label="Next month"
              disabled={isCurrentMonth}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <Button size="sm" onClick={handleAddBudget}>
            <Plus size={16} />
            Set Budget
          </Button>
        </div>

        {/* Content */}
        {loading && budgets.length === 0 ? (
          <div className="flex flex-col gap-6">
            <SkeletonCard />
            <SkeletonGrid count={3} />
          </div>
        ) : error && budgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-14 w-14 rounded-full bg-danger/[0.08] flex items-center justify-center mb-3">
              <span className="text-danger text-xl">!</span>
            </div>
            <p className="text-sm text-danger">{error}</p>
            <button
              onClick={() => fetchBudgets(year, month)}
              className="mt-3 text-sm text-seafoam-400 hover:text-seafoam-300 transition-colors"
            >
              Try again
            </button>
          </div>
        ) : budgets.length === 0 ? (
          <div className="rounded-card border border-border bg-surface-1 p-6">
            <div className="flex flex-col items-center py-12">
              <div className="h-16 w-16 rounded-full bg-sage-400/10 flex items-center justify-center mb-4">
                <Target size={28} className="text-sage-400/40" />
              </div>
              <h3 className="text-base font-semibold text-text-primary mb-1">No budgets set</h3>
              <p className="text-sm text-text-muted mb-6 text-center max-w-xs">
                Set monthly budgets per category to track your spending and stay on top of your finances.
              </p>
              <Button size="sm" onClick={handleAddBudget}>
                <Plus size={16} />
                Set Your First Budget
              </Button>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-6"
          >
            {/* Overview strip */}
            <BudgetOverview summary={summary} />

            {/* Budget cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {sortedBudgets.map((budget, i) => (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
                  index={i}
                  onEdit={handleEditBudget}
                  onDelete={handleDeleteBudget}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>
      </PageTransition>

      {/* Budget form modal */}
      <BudgetForm
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditData(null);
        }}
        onSave={handleSaveBudget}
        categories={categories}
        editData={editData}
      />
    </AppShell>
  );
}
