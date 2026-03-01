"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { CardDisplay, type CardDisplayData } from "@/components/cards/card-display";
import { CardForm } from "@/components/cards/card-form";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Plus, CreditCard, ShieldCheck } from "lucide-react";
import { formatAmount, cn } from "@/lib/utils";
import { SkeletonGrid } from "@/components/ui/skeleton";
import { PageTransition } from "@/components/ui/page-transition";

export default function CardsPage() {
  const [activeCards, setActiveCards] = useState<CardDisplayData[]>([]);
  const [inactiveCards, setInactiveCards] = useState<CardDisplayData[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCard, setEditingCard] = useState<CardDisplayData | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cards?includeInactive=true&withSpend=true");
      const json = await res.json();
      if (json.success) {
        const all: CardDisplayData[] = json.data;
        setActiveCards(all.filter((c) => c.isActive === 1));
        setInactiveCards(all.filter((c) => c.isActive === 0));
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  function handleEdit(id: number) {
    const card =
      activeCards.find((c) => c.id === id) ||
      inactiveCards.find((c) => c.id === id);
    if (card) {
      setEditingCard(card);
      setShowFormModal(true);
    }
  }

  async function handleToggleActive(id: number, newStatus: number) {
    try {
      const res = await fetch("/api/cards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        fetchCards();
      }
    } catch {
      // Silently fail
    }
  }

  function handleFormSaved() {
    setShowFormModal(false);
    setEditingCard(null);
    fetchCards();
  }

  function handleAddNew() {
    setEditingCard(null);
    setShowFormModal(true);
  }

  // Credit summary calculations
  const cardsWithLimits = activeCards.filter(
    (c) => c.creditLimit && c.creditLimit > 0
  );
  const totalCredit = cardsWithLimits.reduce(
    (sum, c) => sum + (c.creditLimit || 0),
    0
  );
  const totalUsed = cardsWithLimits.reduce(
    (sum, c) => sum + (c.cycleSpend || 0) + (c.emiMonthly || 0),
    0
  );
  const totalAvailable = Math.max(totalCredit - totalUsed, 0);
  const totalUtilization = totalCredit > 0 ? (totalUsed / totalCredit) * 100 : 0;
  const isDanger = totalUtilization >= 100;
  const isWarning = totalUtilization >= 75;

  return (
    <AppShell>
      <PageTransition>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              Your Cards
            </h2>
            <p className="text-sm text-text-secondary mt-0.5">
              Manage your credit cards and billing cycles
            </p>
          </div>
          <Button onClick={handleAddNew} size="md">
            <Plus size={16} />
            Add Card
          </Button>
        </div>

        {/* Credit Summary Strip */}
        {!loading && cardsWithLimits.length > 0 && (
          <div className="rounded-card border border-border bg-surface-1 p-4">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={16} className="text-text-muted" />
              <span className="text-sm font-medium text-text-secondary">
                Credit Summary
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-3 max-sm:grid-cols-1 max-sm:gap-2">
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">
                  Total Limit
                </p>
                <p className="font-mono text-base font-bold tabular-nums text-text-primary">
                  {formatAmount(totalCredit)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">
                  Current Used
                </p>
                <p
                  className={cn(
                    "font-mono text-base font-bold tabular-nums",
                    isDanger
                      ? "text-danger"
                      : isWarning
                        ? "text-warning"
                        : "text-sand-400"
                  )}
                >
                  {formatAmount(totalUsed)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">
                  Available
                </p>
                <p className="font-mono text-base font-bold tabular-nums text-success">
                  {formatAmount(totalAvailable)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <ProgressBar value={totalUsed} max={totalCredit} size="sm" />
              </div>
              <span
                className={cn(
                  "font-mono text-xs font-semibold tabular-nums",
                  isDanger
                    ? "text-danger"
                    : isWarning
                      ? "text-warning"
                      : "text-success"
                )}
              >
                {totalUtilization.toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {/* Active cards grid */}
        {loading ? (
          <SkeletonGrid count={3} />
        ) : activeCards.length === 0 ? (
          <div className="rounded-card border border-border bg-surface-1 p-6">
            <div className="flex flex-col items-center py-12">
              <div className="h-16 w-16 rounded-full bg-sage-400/10 flex items-center justify-center mb-4">
                <CreditCard size={28} className="text-sage-400/50" />
              </div>
              <h3 className="text-base font-semibold text-text-primary mb-1">No cards added yet</h3>
              <p className="text-sm text-text-muted mb-6 text-center max-w-xs">
                Add your credit cards to track billing cycles, monitor utilization, and stay ahead of due dates.
              </p>
              <Button size="sm" onClick={handleAddNew}>
                <Plus size={16} />
                Add Your First Card
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeCards.map((card) => (
              <CardDisplay
                key={card.id}
                card={card}
                onEdit={handleEdit}
                onToggleActive={handleToggleActive}
              />
            ))}
          </div>
        )}

        {/* Inactive cards section */}
        {inactiveCards.length > 0 && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowInactive((p) => !p)}
              className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text-secondary transition-colors self-start"
            >
              <span
                className={`inline-block transition-transform duration-150 ${
                  showInactive ? "rotate-90" : ""
                }`}
              >
                ▶
              </span>
              Inactive Cards ({inactiveCards.length})
            </button>

            {showInactive && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {inactiveCards.map((card) => (
                  <CardDisplay
                    key={card.id}
                    card={card}
                    onEdit={handleEdit}
                    onToggleActive={handleToggleActive}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      </PageTransition>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingCard(null);
        }}
        title={editingCard ? "Edit Card" : "Add New Card"}
      >
        <CardForm
          mode={editingCard ? "edit" : "create"}
          initialData={
            editingCard
              ? {
                  id: editingCard.id,
                  name: editingCard.name,
                  bank: editingCard.bank,
                  lastFour: editingCard.lastFour || "",
                  cycleStart: String(editingCard.cycleStart),
                  cycleEnd: String(editingCard.cycleEnd),
                  statementDay: String(editingCard.statementDay),
                  dueDay: String(editingCard.dueDay),
                  creditLimit: editingCard.creditLimit
                    ? String(editingCard.creditLimit)
                    : "",
                  color: editingCard.color || "#7EB89E",
                  aliases: editingCard.aliases,
                }
              : undefined
          }
          onSaved={handleFormSaved}
          onCancel={() => {
            setShowFormModal(false);
            setEditingCard(null);
          }}
        />
      </Modal>
    </AppShell>
  );
}
