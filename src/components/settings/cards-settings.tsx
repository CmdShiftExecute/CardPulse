"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CardForm } from "@/components/cards/card-form";
import { Loader2, Plus, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CardData {
  id: number;
  name: string;
  bank: string;
  lastFour: string | null;
  cycleStart: number;
  cycleEnd: number;
  statementDay: number;
  dueDay: number;
  creditLimit: number | null;
  color: string | null;
  isActive: number;
  aliases: string[];
}

export function CardsSettings() {
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState<CardData | null>(null);

  const fetchCards = useCallback(async () => {
    try {
      const res = await fetch("/api/cards");
      const data = await res.json();
      if (data.success) {
        setCards(data.data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleSaved = useCallback(() => {
    setShowForm(false);
    setEditingCard(null);
    fetchCards();
  }, [fetchCards]);

  const handleCancel = useCallback(() => {
    setShowForm(false);
    setEditingCard(null);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Cards</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Manage your credit cards and billing cycles.
          </p>
        </div>
        {!showForm && !editingCard && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus size={14} />
            Add Card
          </Button>
        )}
      </div>

      {/* Card Form (add or edit) */}
      {(showForm || editingCard) && (
        <div className="rounded-card border border-border bg-surface-2 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-text-primary">
              {editingCard ? `Edit: ${editingCard.name}` : "Add New Card"}
            </h3>
            <button onClick={handleCancel} className="text-text-muted hover:text-text-primary">
              <X size={16} />
            </button>
          </div>
          <CardForm
            mode={editingCard ? "edit" : "create"}
            initialData={
              editingCard
                ? {
                    id: editingCard.id,
                    name: editingCard.name,
                    bank: editingCard.bank,
                    lastFour: editingCard.lastFour ?? "",
                    cycleStart: String(editingCard.cycleStart),
                    cycleEnd: String(editingCard.cycleEnd),
                    statementDay: String(editingCard.statementDay),
                    dueDay: String(editingCard.dueDay),
                    creditLimit: editingCard.creditLimit ? String(editingCard.creditLimit) : "",
                    color: editingCard.color ?? "#7EB89E",
                    aliases: editingCard.aliases,
                  }
                : undefined
            }
            onSaved={handleSaved}
            onCancel={handleCancel}
          />
        </div>
      )}

      {/* Card List */}
      {cards.length === 0 && !showForm ? (
        <div className="py-8 text-center text-sm text-text-muted">
          No cards added yet. Add your first card to start tracking.
        </div>
      ) : (
        <div className="space-y-2">
          {cards.map((card) => (
            <div
              key={card.id}
              className={cn(
                "flex items-center justify-between rounded-button border border-border px-4 py-3 transition-colors hover:bg-surface-2",
                !card.isActive && "opacity-50"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: card.color ?? "#7EB89E" }}
                />
                <div>
                  <div className="text-sm font-medium text-text-primary">
                    {card.name}
                    {card.lastFour && (
                      <span className="ml-2 text-text-muted">····{card.lastFour}</span>
                    )}
                  </div>
                  <div className="text-xs text-text-secondary">{card.bank}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingCard(card);
                  setShowForm(false);
                }}
                className="rounded-button p-1.5 text-text-muted hover:bg-surface-3 hover:text-text-primary"
                aria-label={`Edit ${card.name}`}
              >
                <Pencil size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
