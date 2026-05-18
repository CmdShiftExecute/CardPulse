"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatAmount, getCurrency } from "@/lib/utils";
import {
  Plus,
  Trash2,
  GripVertical,
  Home,
  Wifi,
  ShoppingCart,
  Pill,
  Zap,
  CreditCard,
  Wallet,
  Calendar,
  Car,
  Coffee,
  Activity,
  Save,
  X,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FixedCost {
  id: number;
  name: string;
  monthlyAmount: number;
  icon: string | null;
  color: string | null;
  notes: string | null;
  sortOrder: number;
  isActive: number;
}

interface DraftCost {
  name: string;
  monthlyAmount: string;
  icon: string;
  color: string;
}

const ICON_OPTIONS: Array<{ name: string; Icon: LucideIcon }> = [
  { name: "Home", Icon: Home },
  { name: "Wifi", Icon: Wifi },
  { name: "ShoppingCart", Icon: ShoppingCart },
  { name: "Pill", Icon: Pill },
  { name: "Zap", Icon: Zap },
  { name: "CreditCard", Icon: CreditCard },
  { name: "Wallet", Icon: Wallet },
  { name: "Calendar", Icon: Calendar },
  { name: "Car", Icon: Car },
  { name: "Coffee", Icon: Coffee },
  { name: "Activity", Icon: Activity },
];

const COLOR_OPTIONS = [
  "#7EB89E",
  "#6BB0A8",
  "#A8C0B0",
  "#C4AA78",
  "#D4B878",
  "#8B9DC3",
  "#B8A0C8",
  "#C87070",
  "#7DD3A8",
  "#90A8B8",
];

function getIconComponent(name: string | null): LucideIcon {
  const found = ICON_OPTIONS.find((o) => o.name === name);
  return found?.Icon ?? Wallet;
}

export function FixedCostsSettings() {
  const [costs, setCosts] = useState<FixedCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<DraftCost>({
    name: "",
    monthlyAmount: "",
    icon: "Wallet",
    color: "#7EB89E",
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<DraftCost | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/fixed-costs");
      const json = await res.json();
      if (json.success) setCosts(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const total = costs.reduce((s, c) => s + c.monthlyAmount, 0);

  async function handleCreate() {
    const amount = parseFloat(draft.monthlyAmount);
    if (!draft.name.trim() || Number.isNaN(amount) || amount < 0) return;
    const res = await fetch("/api/fixed-costs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: draft.name.trim(),
        monthlyAmount: amount,
        icon: draft.icon,
        color: draft.color,
      }),
    });
    const json = await res.json();
    if (json.success) {
      setDraft({ name: "", monthlyAmount: "", icon: "Wallet", color: "#7EB89E" });
      setAdding(false);
      load();
    }
  }

  async function handleSaveEdit(id: number) {
    if (!editDraft) return;
    const amount = parseFloat(editDraft.monthlyAmount);
    if (!editDraft.name.trim() || Number.isNaN(amount) || amount < 0) return;
    const res = await fetch("/api/fixed-costs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        name: editDraft.name.trim(),
        monthlyAmount: amount,
        icon: editDraft.icon,
        color: editDraft.color,
      }),
    });
    const json = await res.json();
    if (json.success) {
      setEditingId(null);
      setEditDraft(null);
      load();
    }
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/fixed-costs?id=${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) load();
  }

  function startEdit(c: FixedCost) {
    setEditingId(c.id);
    setEditDraft({
      name: c.name,
      monthlyAmount: String(c.monthlyAmount),
      icon: c.icon || "Wallet",
      color: c.color || "#7EB89E",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Fixed Monthly Costs</h2>
          <p className="text-sm text-text-secondary mt-1">
            Your baseline cost of living — rent, utilities, groceries, recurring obligations.
            These feed into the survival summary on the EMIs page.
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] uppercase tracking-wider text-text-muted">Total</div>
          <div className="font-mono text-lg font-bold tabular-nums text-text-primary">
            {formatAmount(total)}
          </div>
          <div className="text-[10px] text-text-muted">/month</div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-card bg-surface-2/60 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {costs.map((c) => {
              const Icon = getIconComponent(c.icon);
              const isEditing = editingId === c.id;
              return (
                <motion.div
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-card border border-border bg-surface-2/40 hover:bg-surface-2/70 transition-all overflow-hidden"
                >
                  {!isEditing ? (
                    <div className="flex items-center gap-3 p-3">
                      <GripVertical size={14} className="text-text-muted/40 shrink-0 hidden sm:block" />
                      <div
                        className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: `${c.color || "#7EB89E"}1A` }}
                      >
                        <Icon size={15} style={{ color: c.color || "#7EB89E" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-text-primary truncate">
                          {c.name}
                        </div>
                        <div className="text-xs text-text-muted">Monthly</div>
                      </div>
                      <div className="font-mono text-sm font-semibold tabular-nums text-text-primary">
                        {formatAmount(c.monthlyAmount)}
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => startEdit(c)}
                          className="text-xs px-2.5 py-1 rounded-button text-text-muted hover:text-text-primary hover:bg-surface-3 transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="text-text-muted hover:text-danger p-1.5 rounded-button hover:bg-danger/10 transition-all"
                          aria-label="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <EditForm
                      draft={editDraft!}
                      onChange={setEditDraft}
                      onSave={() => handleSaveEdit(c.id)}
                      onCancel={() => {
                        setEditingId(null);
                        setEditDraft(null);
                      }}
                    />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {!adding ? (
            <button
              onClick={() => setAdding(true)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-card border border-dashed border-border hover:border-sage-400/60 text-text-muted hover:text-sage-300 py-3 px-4 transition-all text-sm font-medium",
                "hover:bg-sage-400/5"
              )}
            >
              <Plus size={15} />
              Add fixed cost
            </button>
          ) : (
            <div className="rounded-card border border-sage-400/30 bg-surface-2/40 overflow-hidden">
              <EditForm
                draft={draft}
                onChange={(d) => setDraft(d!)}
                onSave={handleCreate}
                onCancel={() => {
                  setAdding(false);
                  setDraft({ name: "", monthlyAmount: "", icon: "Wallet", color: "#7EB89E" });
                }}
                isNew
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EditForm({
  draft,
  onChange,
  onSave,
  onCancel,
  isNew,
}: {
  draft: DraftCost;
  onChange: (d: DraftCost | null) => void;
  onSave: () => void;
  onCancel: () => void;
  isNew?: boolean;
}) {
  const currency = getCurrency();
  return (
    <div className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-3 mb-3">
        <div>
          <label className="text-[10px] font-medium uppercase tracking-wider text-text-muted mb-1 block">
            Name
          </label>
          <Input
            value={draft.name}
            onChange={(e) => onChange({ ...draft, name: e.target.value })}
            placeholder="e.g. Gym membership"
            autoFocus={isNew}
          />
        </div>
        <div>
          <label className="text-[10px] font-medium uppercase tracking-wider text-text-muted mb-1 block">
            {currency} / month
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-text-muted pointer-events-none">
              {currency}
            </span>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={draft.monthlyAmount}
              onChange={(e) => onChange({ ...draft, monthlyAmount: e.target.value })}
              placeholder="0.00"
              className="pl-12 font-mono tabular-nums"
            />
          </div>
        </div>
      </div>

      <div className="mb-3">
        <label className="text-[10px] font-medium uppercase tracking-wider text-text-muted mb-1.5 block">
          Icon
        </label>
        <div className="flex flex-wrap gap-1.5">
          {ICON_OPTIONS.map(({ name, Icon }) => (
            <button
              key={name}
              type="button"
              onClick={() => onChange({ ...draft, icon: name })}
              className={cn(
                "h-9 w-9 rounded-button flex items-center justify-center transition-all",
                draft.icon === name
                  ? "bg-sage-400/15 ring-1 ring-sage-400/60"
                  : "bg-surface-3 hover:bg-surface-3/80"
              )}
            >
              <Icon
                size={15}
                className={draft.icon === name ? "text-sage-300" : "text-text-muted"}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="text-[10px] font-medium uppercase tracking-wider text-text-muted mb-1.5 block">
          Color
        </label>
        <div className="flex flex-wrap gap-1.5">
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onChange({ ...draft, color })}
              className={cn(
                "h-7 w-7 rounded-full transition-all",
                draft.color === color
                  ? "ring-2 ring-offset-2 ring-offset-surface-2 ring-sage-400"
                  : "hover:scale-110"
              )}
              style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }}
              aria-label={`Color ${color}`}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X size={14} />
          Cancel
        </Button>
        <Button size="sm" onClick={onSave}>
          <Save size={14} />
          {isNew ? "Add" : "Save"}
        </Button>
      </div>
    </div>
  );
}
