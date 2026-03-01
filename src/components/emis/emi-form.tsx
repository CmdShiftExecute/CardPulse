"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Loader2, Plus, Search } from "lucide-react";

interface EmiFormData {
  id?: number;
  cardId: string;
  description: string;
  originalAmount: string;
  monthlyAmount: string;
  totalMonths: string;
  monthsRemaining: string;
  startDate: string;
  categoryId: string;
  subcategoryId: string;
  labelIds: number[];
  autoGenerate: boolean;
  notes: string;
}

interface EmiFormProps {
  initialData?: Partial<EmiFormData>;
  mode?: "create" | "edit";
  onSaved?: () => void;
  onCancel?: () => void;
}

interface CardOption { id: number; name: string; color: string | null }
interface CategoryOption { id: number; name: string; subcategories: { id: number; name: string }[] }
interface LabelOption { id: number; name: string }

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function EmiForm({ initialData, mode = "create", onSaved, onCancel }: EmiFormProps) {
  const [cards, setCards] = useState<CardOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [allLabels, setAllLabels] = useState<LabelOption[]>([]);

  const [cardId, setCardId] = useState(initialData?.cardId ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [originalAmount, setOriginalAmount] = useState(initialData?.originalAmount ?? "");
  const [monthlyAmount, setMonthlyAmount] = useState(initialData?.monthlyAmount ?? "");
  const [totalMonths, setTotalMonths] = useState(initialData?.totalMonths ?? "");
  const [monthsRemaining, setMonthsRemaining] = useState(initialData?.monthsRemaining ?? "");
  const [startDate, setStartDate] = useState(initialData?.startDate ?? todayStr());
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? "");
  const [subcategoryId, setSubcategoryId] = useState(initialData?.subcategoryId ?? "");
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>(initialData?.labelIds ?? []);
  const [autoGenerate, setAutoGenerate] = useState(initialData?.autoGenerate ?? true);
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [labelSearch, setLabelSearch] = useState("");
  const [showLabelDropdown, setShowLabelDropdown] = useState(false);

  useEffect(() => {
    async function load() {
      const [catRes, cardRes, labelRes] = await Promise.all([
        fetch("/api/categories"), fetch("/api/cards"), fetch("/api/labels"),
      ]);
      const [catJson, cardJson, labelJson] = await Promise.all([
        catRes.json(), cardRes.json(), labelRes.json(),
      ]);
      if (catJson.success) setCategories(catJson.data);
      if (cardJson.success) setCards(cardJson.data);
      if (labelJson.success) setAllLabels(labelJson.data);
    }
    load();
  }, []);

  // Auto-set months remaining when total months changes (create mode)
  useEffect(() => {
    if (mode === "create" && totalMonths && !monthsRemaining) {
      setMonthsRemaining(totalMonths);
    }
  }, [totalMonths, mode, monthsRemaining]);

  const selectedCat = categories.find((c) => String(c.id) === categoryId);
  const subOptions = selectedCat?.subcategories ?? [];

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!cardId) errs.cardId = "Card is required";
    if (!description.trim()) errs.description = "Description is required";
    if (!monthlyAmount || parseFloat(monthlyAmount) <= 0) errs.monthlyAmount = "Monthly amount must be > 0";
    if (!totalMonths || parseInt(totalMonths) <= 0) errs.totalMonths = "Total months must be > 0";
    if (!monthsRemaining && monthsRemaining !== "0") errs.monthsRemaining = "Months remaining is required";
    if (!startDate) errs.startDate = "Start date is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...(mode === "edit" && initialData?.id ? { id: initialData.id } : {}),
        cardId: parseInt(cardId, 10),
        description: description.trim(),
        originalAmount: originalAmount ? parseFloat(originalAmount) : parseFloat(monthlyAmount) * parseInt(totalMonths),
        monthlyAmount: parseFloat(monthlyAmount),
        totalMonths: parseInt(totalMonths, 10),
        monthsRemaining: parseInt(monthsRemaining, 10),
        startDate,
        categoryId: categoryId ? parseInt(categoryId, 10) : null,
        subcategoryId: subcategoryId ? parseInt(subcategoryId, 10) : null,
        labelIds: selectedLabelIds,
        autoGenerate: autoGenerate ? 1 : 0,
        notes: notes || null,
      };

      const res = await fetch("/api/emis", {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        onSaved?.();
      } else {
        setErrors({ form: json.error || "Failed to save EMI" });
      }
    } catch {
      setErrors({ form: "Network error" });
    } finally {
      setSaving(false);
    }
  }

  const inputCn = (err: boolean) => cn(
    "w-full rounded-input bg-surface-2 border border-border px-3 py-2 text-base text-text-primary",
    "placeholder:text-text-muted focus:outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-glow transition-all duration-150",
    err && "border-danger"
  );

  const filteredLabels = allLabels.filter(
    (l) => !selectedLabelIds.includes(l.id) && l.name.toLowerCase().includes(labelSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
      {/* Card */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-secondary">Card <span className="text-danger">*</span></label>
        <select value={cardId} onChange={(e) => { setCardId(e.target.value); if (errors.cardId) setErrors((p) => ({...p, cardId: ""})); }}
          className={cn(inputCn(!!errors.cardId), "appearance-none", !cardId && "text-text-muted")}>
          <option value="">Select card</option>
          {cards.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
        </select>
        {errors.cardId && <p className="text-xs text-danger">{errors.cardId}</p>}
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-secondary">Description <span className="text-danger">*</span></label>
        <input type="text" value={description} onChange={(e) => { setDescription(e.target.value); if (errors.description) setErrors((p) => ({...p, description: ""})); }}
          placeholder='e.g. "iPhone 16 Pro Max"' className={inputCn(!!errors.description)} />
        {errors.description && <p className="text-xs text-danger">{errors.description}</p>}
      </div>

      {/* Amount row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">Original Amount ({getCurrency()})</label>
          <input type="number" step="0.01" min="0" value={originalAmount} onChange={(e) => setOriginalAmount(e.target.value)}
            placeholder="Auto-calculated" className={cn(inputCn(false), "font-mono tabular-nums")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">Monthly Amount <span className="text-danger">*</span></label>
          <input type="number" step="0.01" min="0" value={monthlyAmount} onChange={(e) => { setMonthlyAmount(e.target.value); if (errors.monthlyAmount) setErrors((p) => ({...p, monthlyAmount: ""})); }}
            placeholder="375.00" className={cn(inputCn(!!errors.monthlyAmount), "font-mono tabular-nums")} />
          {errors.monthlyAmount && <p className="text-xs text-danger">{errors.monthlyAmount}</p>}
        </div>
      </div>

      {/* Tenure row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">Total Months <span className="text-danger">*</span></label>
          <input type="number" min="1" value={totalMonths} onChange={(e) => { setTotalMonths(e.target.value); if (errors.totalMonths) setErrors((p) => ({...p, totalMonths: ""})); }}
            placeholder="12" className={inputCn(!!errors.totalMonths)} />
          {errors.totalMonths && <p className="text-xs text-danger">{errors.totalMonths}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">Remaining <span className="text-danger">*</span></label>
          <input type="number" min="0" value={monthsRemaining} onChange={(e) => { setMonthsRemaining(e.target.value); if (errors.monthsRemaining) setErrors((p) => ({...p, monthsRemaining: ""})); }}
            placeholder="12" className={inputCn(!!errors.monthsRemaining)} />
          {errors.monthsRemaining && <p className="text-xs text-danger">{errors.monthsRemaining}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">Start Date <span className="text-danger">*</span></label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className={cn(inputCn(!!errors.startDate), "[color-scheme:dark]")} />
          {errors.startDate && <p className="text-xs text-danger">{errors.startDate}</p>}
        </div>
      </div>

      {/* Category + Subcategory */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">Category</label>
          <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setSubcategoryId(""); }}
            className={cn(inputCn(false), "appearance-none", !categoryId && "text-text-muted")}>
            <option value="">None</option>
            {categories.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">Subcategory</label>
          <select value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value)} disabled={!categoryId}
            className={cn(inputCn(false), "appearance-none disabled:opacity-50", !subcategoryId && "text-text-muted")}>
            <option value="">None</option>
            {subOptions.map((s) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Labels */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-secondary">Labels</label>
        {selectedLabelIds.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedLabelIds.map((lid) => {
              const label = allLabels.find((l) => l.id === lid);
              return label ? (
                <Chip key={lid} removable onRemove={() => setSelectedLabelIds((p) => p.filter((x) => x !== lid))}>
                  {label.name}
                </Chip>
              ) : null;
            })}
          </div>
        )}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input type="text" value={labelSearch} onChange={(e) => { setLabelSearch(e.target.value); setShowLabelDropdown(true); }}
            onFocus={() => setShowLabelDropdown(true)} onBlur={() => setTimeout(() => setShowLabelDropdown(false), 200)}
            placeholder="Search labels..." className={cn(inputCn(false), "pl-8 text-sm")} />
          {showLabelDropdown && filteredLabels.length > 0 && (
            <div className="absolute z-20 mt-1 w-full max-h-36 overflow-y-auto rounded-input border border-border-hover bg-surface-3 py-1">
              {filteredLabels.slice(0, 10).map((l) => (
                <button key={l.id} onMouseDown={() => { setSelectedLabelIds((p) => [...p, l.id]); setLabelSearch(""); }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-text-primary hover:bg-surface-2 text-left">
                  <Plus size={12} className="text-text-muted" />{l.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Auto-generate toggle */}
      <button
        type="button"
        onClick={() => setAutoGenerate((p) => !p)}
        className="flex items-center gap-3 cursor-pointer text-left"
        aria-label="Toggle auto-generate"
      >
        <div className={cn(
          "relative h-5 w-9 rounded-full transition-colors duration-200 shrink-0",
          autoGenerate ? "bg-sage-400" : "bg-surface-3 border border-border"
        )}>
          <div className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-200",
            autoGenerate ? "translate-x-4" : "translate-x-0.5"
          )} />
        </div>
        <span className="text-sm text-text-secondary">
          Auto-generate monthly transactions
        </span>
      </button>

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-secondary">Notes</label>
        <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..."
          className={cn(inputCn(false), "text-sm")} />
      </div>

      {errors.form && <p className="text-sm text-danger">{errors.form}</p>}

      <div className="flex items-center gap-3 pt-2">
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? <><Loader2 size={16} className="animate-spin" />Saving...</> : mode === "edit" ? "Update EMI" : "Add EMI"}
        </Button>
        {onCancel && <Button variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>}
      </div>
    </div>
  );
}

export { EmiForm, type EmiFormProps, type EmiFormData };
