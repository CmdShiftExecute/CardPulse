"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { EmiCard, type EmiCardData } from "@/components/emis/emi-card";
import { EmiForm } from "@/components/emis/emi-form";
import { EmiGeneratePrompt } from "@/components/emis/emi-generate-prompt";
import { EmiSummaryStrip } from "@/components/emis/emi-summary-strip";
import { SurvivalSummary } from "@/components/emis/survival-summary";
import { cn, formatAmount } from "@/lib/utils";
import {
  Plus,
  CalendarClock,
  TrendingUp,
  ArrowRight,
  CreditCard,
  Wallet,
  Layers,
} from "lucide-react";
import { SkeletonGrid } from "@/components/ui/skeleton";
import { PageTransition } from "@/components/ui/page-transition";
import { motion, AnimatePresence } from "framer-motion";

/** Extended data from the API with fields needed for cycle grouping */
interface EmiFullData extends EmiCardData {
  cardId: number;
  categoryId: number | null;
  subcategoryId: number | null;
  labelIds: number[];
  autoGenerate: number;
  lastGenerated: string | null;
  notes: string | null;
}

type TabId = "survival" | "tracker";

interface TabDef {
  id: TabId;
  label: string;
  icon: typeof Wallet;
}

const TABS: TabDef[] = [
  { id: "survival", label: "Survival", icon: Wallet },
  { id: "tracker", label: "EMI Tracker", icon: Layers },
];

/**
 * Groups EMIs by their charging timeline relative to the current billing cycle.
 */
function groupEmisByCycle(emis: EmiFullData[]) {
  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const thisCycle: EmiFullData[] = [];
  const nextCycle: EmiFullData[] = [];

  for (const emi of emis) {
    if (!emi.isActive) continue;
    if (emi.lastGenerated !== currentYM) {
      thisCycle.push(emi);
    } else {
      nextCycle.push(emi);
    }
  }

  return { thisCycle, nextCycle };
}

function groupByCard(emis: EmiFullData[]) {
  const map: Record<string, { cardName: string; cardColor: string; emis: EmiFullData[]; total: number }> = {};
  for (const emi of emis) {
    const key = emi.cardName;
    if (!map[key]) {
      map[key] = { cardName: emi.cardName, cardColor: emi.cardColor || "#7EB89E", emis: [], total: 0 };
    }
    map[key].emis.push(emi);
    map[key].total += emi.monthlyAmount;
  }
  return Object.values(map).sort((a, b) => b.total - a.total);
}

/**
 * CycleVisualization — vertical timeline showing EMIs grouped by upcoming vs next cycle.
 */
function CycleVisualization({ thisCycle, nextCycle }: { thisCycle: EmiFullData[]; nextCycle: EmiFullData[] }) {
  if (thisCycle.length === 0 && nextCycle.length === 0) return null;

  const thisCycleTotal = thisCycle.reduce((s, e) => s + e.monthlyAmount, 0);
  const nextCycleTotal = nextCycle.reduce((s, e) => s + e.monthlyAmount, 0);
  const grandTotal = thisCycleTotal + nextCycleTotal;

  const now = new Date();
  const thisMonthName = now.toLocaleDateString("en-US", { month: "long" });
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthName = nextMonth.toLocaleDateString("en-US", { month: "long" });

  return (
    <div className="relative overflow-hidden rounded-card border border-border bg-surface-1">
      <div className="h-1 w-full bg-gradient-to-r from-sage-400 via-seafoam-400 to-sand-400" />

      <div className="p-5">
        <h3 className="text-base font-semibold text-text-primary mb-1">
          Cycle Timeline
        </h3>
        <p className="text-xs text-text-muted mb-5">
          EMI charges across your upcoming billing cycles
        </p>

        <div className="relative">
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-sage-400/60 via-border to-sand-400/60" />

          {thisCycle.length > 0 && (
            <div className="relative mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sage-400 to-seafoam-400 shadow-lg shadow-sage-400/20">
                  <CalendarClock size={18} className="text-white" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-text-primary">
                    This Cycle — {thisMonthName}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-sage-400 tabular-nums">
                      {formatAmount(thisCycleTotal)}
                    </span>
                    <span className="text-xs text-text-muted">
                      · {thisCycle.length} EMI{thisCycle.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>

              <div className="ml-[19px] pl-6 flex flex-col gap-3">
                {thisCycle.map((emi) => {
                  const orbSize = grandTotal > 0
                    ? Math.max(16, Math.min(40, (emi.monthlyAmount / grandTotal) * 120))
                    : 24;
                  return (
                    <div key={emi.id} className="flex items-center gap-3">
                      <div
                        className="rounded-full shrink-0 shadow-sm"
                        style={{
                          width: `${orbSize}px`,
                          height: `${orbSize}px`,
                          background: `linear-gradient(135deg, ${emi.cardColor || "#7EB89E"}, ${emi.cardColor || "#7EB89E"}88)`,
                          boxShadow: `0 0 ${orbSize / 2}px ${emi.cardColor || "#7EB89E"}20`,
                        }}
                        title={emi.description}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-text-primary truncate">
                            {emi.description}
                          </span>
                          <span className="font-mono text-sm font-semibold text-text-primary tabular-nums shrink-0">
                            {formatAmount(emi.monthlyAmount)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-text-muted">
                          <CreditCard size={10} style={{ color: emi.cardColor || "#7EB89E" }} />
                          <span>{emi.cardName}</span>
                          <span>·</span>
                          <span>{emi.monthsRemaining} month{emi.monthsRemaining !== 1 ? "s" : ""} left</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {thisCycle.length > 0 && nextCycle.length > 0 && (
            <div className="relative flex items-center gap-3 my-4 ml-[19px] pl-6">
              <div className="h-px flex-1 bg-gradient-to-r from-sage-400/30 via-sand-400/40 to-transparent" />
              <div className="flex items-center gap-1.5 rounded-full bg-surface-2 border border-border/60 px-3 py-1">
                <ArrowRight size={12} className="text-text-muted" />
                <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
                  Next Cycle
                </span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-l from-sand-400/30 via-sage-400/40 to-transparent" />
            </div>
          )}

          {nextCycle.length > 0 && (
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sand-400 to-[#D4B878] shadow-lg shadow-sand-400/20">
                  <TrendingUp size={18} className="text-white" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-text-primary">
                    Next Cycle — {nextMonthName}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-sand-400 tabular-nums">
                      {formatAmount(nextCycleTotal)}
                    </span>
                    <span className="text-xs text-text-muted">
                      · {nextCycle.length} EMI{nextCycle.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>

              <div className="ml-[19px] pl-6 flex flex-col gap-3">
                {nextCycle.map((emi) => {
                  const orbSize = grandTotal > 0
                    ? Math.max(14, Math.min(36, (emi.monthlyAmount / grandTotal) * 100))
                    : 20;
                  return (
                    <div key={emi.id} className="flex items-center gap-3 opacity-75">
                      <div
                        className="rounded-full shrink-0"
                        style={{
                          width: `${orbSize}px`,
                          height: `${orbSize}px`,
                          background: `linear-gradient(135deg, ${emi.cardColor || "#7EB89E"}88, ${emi.cardColor || "#7EB89E"}44)`,
                        }}
                        title={emi.description}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm text-text-secondary truncate">
                            {emi.description}
                          </span>
                          <span className="font-mono text-sm text-text-secondary tabular-nums shrink-0">
                            {formatAmount(emi.monthlyAmount)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-text-muted">
                          <CreditCard size={10} style={{ color: emi.cardColor || "#7EB89E" }} />
                          <span>{emi.cardName}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {grandTotal > 0 && (
          <div className="mt-6 pt-4 border-t border-border/40">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Two-cycle projection</span>
              <span className="font-mono text-sm font-bold text-text-primary tabular-nums">
                {formatAmount(grandTotal)}
              </span>
            </div>
            <div className="flex h-2 mt-2 rounded-full overflow-hidden bg-surface-3">
              {thisCycleTotal > 0 && (
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${(thisCycleTotal / grandTotal) * 100}%`,
                    background: "linear-gradient(90deg, #7EB89E, #6BB0A8)",
                  }}
                />
              )}
              {nextCycleTotal > 0 && (
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${(nextCycleTotal / grandTotal) * 100}%`,
                    background: "linear-gradient(90deg, #C4AA78, #D4B878)",
                  }}
                />
              )}
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-text-muted">
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-sage-400" />
                {thisMonthName}
              </div>
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-sand-400" />
                {nextMonthName}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CardBreakdown({ cardGroups }: { cardGroups: ReturnType<typeof groupByCard> }) {
  if (cardGroups.length === 0) return null;
  const maxTotal = Math.max(...cardGroups.map((g) => g.total));

  return (
    <div className="rounded-card border border-border bg-surface-1 overflow-hidden">
      <div className="h-0.5 w-full bg-gradient-to-r from-sage-400/40 to-seafoam-400/40" />
      <div className="p-5">
        <h3 className="text-base font-semibold text-text-primary mb-4">
          EMI by Card
        </h3>
        <div className="flex flex-col gap-4">
          {cardGroups.map((group) => {
            const barWidth = maxTotal > 0 ? (group.total / maxTotal) * 100 : 0;
            return (
              <div key={group.cardName}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full shadow-sm"
                      style={{
                        background: `linear-gradient(135deg, ${group.cardColor}, ${group.cardColor}88)`,
                      }}
                    />
                    <span className="text-sm font-medium text-text-primary">
                      {group.cardName}
                    </span>
                    <span className="text-xs text-text-muted">
                      {group.emis.length} EMI{group.emis.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-semibold text-text-primary tabular-nums">
                    {formatAmount(group.total)}
                    <span className="text-xs font-normal text-text-muted">/mo</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-surface-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${barWidth}%`,
                      background: `linear-gradient(90deg, ${group.cardColor}, ${group.cardColor}88)`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function EmisPage() {
  const [activeTab, setActiveTab] = useState<TabId>("survival");
  const [activeEmis, setActiveEmis] = useState<EmiFullData[]>([]);
  const [completedEmis, setCompletedEmis] = useState<EmiFullData[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingEmi, setEditingEmi] = useState<EmiFullData | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const fetchEmis = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/emis?includeCompleted=true");
      const json = await res.json();
      if (json.success) {
        const all: EmiFullData[] = json.data;
        setActiveEmis(all.filter((e) => e.isActive === 1));
        setCompletedEmis(all.filter((e) => e.isActive === 0));
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmis();
  }, [fetchEmis]);

  function handleEdit(id: number) {
    const emi = activeEmis.find((e) => e.id === id) || completedEmis.find((e) => e.id === id);
    if (emi) {
      setEditingEmi(emi);
      setShowFormModal(true);
    }
  }

  async function handleMarkComplete(id: number) {
    try {
      const res = await fetch("/api/emis", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: 0 }),
      });
      const json = await res.json();
      if (json.success) {
        fetchEmis();
      }
    } catch {
      // Silently fail
    }
  }

  function handleFormSaved() {
    setShowFormModal(false);
    setEditingEmi(null);
    fetchEmis();
  }

  function handleAddNew() {
    setEditingEmi(null);
    setShowFormModal(true);
  }

  const { thisCycle, nextCycle } = groupEmisByCycle(activeEmis);
  const cardGroups = groupByCard(activeEmis);

  return (
    <AppShell>
      <PageTransition>
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">EMIs &amp; Survival</h2>
              <p className="text-sm text-text-secondary mt-0.5">
                {activeTab === "survival"
                  ? "Your monthly cost of living and how your EMI burden depletes over time"
                  : "Track installments and upcoming charges across your cards"}
              </p>
            </div>
            {activeTab === "tracker" && (
              <Button onClick={handleAddNew} size="md">
                <Plus size={16} />
                Add EMI
              </Button>
            )}
          </div>

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
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "survival" && <SurvivalSummary />}

              {activeTab === "tracker" && (
                <div className="flex flex-col gap-6">
                  {/* Generate prompt — appears when EMIs need generating */}
                  <EmiGeneratePrompt onGenerated={fetchEmis} />

                  {/* Summary strip */}
                  <EmiSummaryStrip />

                  {loading ? (
                    <SkeletonGrid count={3} />
                  ) : activeEmis.length === 0 ? (
                    <div className="rounded-card border border-border bg-surface-1 p-6">
                      <div className="flex flex-col items-center py-12">
                        <div className="h-16 w-16 rounded-full bg-sage-400/10 flex items-center justify-center mb-4">
                          <CalendarClock size={28} className="text-sage-400/50" />
                        </div>
                        <h3 className="text-base font-semibold text-text-primary mb-1">No active EMIs</h3>
                        <p className="text-sm text-text-muted mb-6 text-center max-w-xs">
                          Track your installment payments across all cards. Add an EMI to see cycle timelines and monthly projections.
                        </p>
                        <Button size="sm" onClick={handleAddNew}>
                          <Plus size={16} />
                          Add Your First EMI
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                        <CycleVisualization thisCycle={thisCycle} nextCycle={nextCycle} />
                        <CardBreakdown cardGroups={cardGroups} />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="h-4 w-1 rounded-full bg-gradient-to-b from-sage-400 to-seafoam-400" />
                          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
                            Active Installments
                          </h3>
                          <span className="text-xs text-text-muted">({activeEmis.length})</span>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                          {activeEmis.map((emi) => (
                            <EmiCard
                              key={emi.id}
                              emi={emi}
                              onEdit={handleEdit}
                              onMarkComplete={handleMarkComplete}
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {completedEmis.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => setShowCompleted((p) => !p)}
                        className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text-secondary transition-colors self-start"
                      >
                        <span
                          className={cn(
                            "inline-block transition-transform duration-150",
                            showCompleted ? "rotate-90" : ""
                          )}
                        >
                          ▶
                        </span>
                        Completed EMIs ({completedEmis.length})
                      </button>

                      {showCompleted && (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                          {completedEmis.map((emi) => (
                            <EmiCard
                              key={emi.id}
                              emi={emi}
                              onEdit={handleEdit}
                              onMarkComplete={handleMarkComplete}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </PageTransition>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingEmi(null);
        }}
        title={editingEmi ? "Edit EMI" : "Add New EMI"}
      >
        <EmiForm
          mode={editingEmi ? "edit" : "create"}
          initialData={
            editingEmi
              ? {
                  id: editingEmi.id,
                  cardId: String(editingEmi.cardId),
                  description: editingEmi.description,
                  originalAmount: String(editingEmi.originalAmount),
                  monthlyAmount: String(editingEmi.monthlyAmount),
                  totalMonths: String(editingEmi.totalMonths),
                  monthsRemaining: String(editingEmi.monthsRemaining),
                  startDate: editingEmi.startDate,
                  categoryId: editingEmi.categoryId ? String(editingEmi.categoryId) : "",
                  subcategoryId: editingEmi.subcategoryId ? String(editingEmi.subcategoryId) : "",
                  labelIds: editingEmi.labelIds,
                  autoGenerate: editingEmi.autoGenerate === 1,
                  notes: editingEmi.notes || "",
                }
              : undefined
          }
          onSaved={handleFormSaved}
          onCancel={() => {
            setShowFormModal(false);
            setEditingEmi(null);
          }}
        />
      </Modal>
    </AppShell>
  );
}
