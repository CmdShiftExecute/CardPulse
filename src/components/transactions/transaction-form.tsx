"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Chip } from "@/components/ui/chip";
import { ConfidenceDot } from "@/components/ui/confidence-dot";
import { LearnPrompt } from "./learn-prompt";
import { Plus, Search, Loader2 } from "lucide-react";
import { getCurrency } from "@/lib/format";
import type { ParsedTransaction, FieldConfidence, ConfidenceLevel } from "@/types";

// ── Types ──────────────────────────────────────────────────────────

interface CategoryOption {
  id: number;
  name: string;
  subcategories: { id: number; name: string }[];
}

interface CardOption {
  id: number;
  name: string;
  color: string | null;
}

interface LabelOption {
  id: number;
  name: string;
  isSystem: number;
}

interface TransactionFormData {
  id?: number;
  amount: string;
  transactionDate: string;
  categoryId: string;
  subcategoryId: string;
  cardId: string;
  labelIds: number[];
  notes: string;
  description: string;
  merchant: string;
}

interface TransactionFormProps {
  /** Pre-fill data from NLP parser or from an existing transaction */
  initialData?: Partial<TransactionFormData>;
  /** NLP parsed data — shows confidence dots + learn prompt */
  parsedData?: ParsedTransaction | null;
  /** "create" or "edit" mode */
  mode?: "create" | "edit";
  /** Called on successful save */
  onSaved?: () => void;
  /** Called to save another (only in create mode) */
  onSaveAndAddAnother?: () => void;
  /** Called to cancel edit */
  onCancel?: () => void;
  className?: string;
}

const DEFAULT_CONFIDENCE: FieldConfidence = { level: "none" as ConfidenceLevel, score: 0 };

function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

function TransactionForm({
  initialData,
  parsedData,
  mode = "create",
  onSaved,
  onSaveAndAddAnother,
  onCancel,
  className,
}: TransactionFormProps) {
  // ── Reference data ──────────────────────────────────────────────
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [allCards, setAllCards] = useState<CardOption[]>([]);
  const [allLabels, setAllLabels] = useState<LabelOption[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // ── Form state ──────────────────────────────────────────────────
  const [amount, setAmount] = useState(initialData?.amount ?? "");
  const [transactionDate, setTransactionDate] = useState(
    initialData?.transactionDate ?? todayString()
  );
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? "");
  const [subcategoryId, setSubcategoryId] = useState(
    initialData?.subcategoryId ?? ""
  );
  const [cardId, setCardId] = useState(initialData?.cardId ?? "");
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>(
    initialData?.labelIds ?? []
  );
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? ""
  );
  const [merchant, setMerchant] = useState(initialData?.merchant ?? "");

  // ── UI state ────────────────────────────────────────────────────
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [labelSearch, setLabelSearch] = useState("");
  const [showLabelDropdown, setShowLabelDropdown] = useState(false);
  const labelDropdownRef = useRef<HTMLDivElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  // ── Confidence / learning ───────────────────────────────────────
  const [confidence, setConfidence] = useState<{
    amount: FieldConfidence;
    date: FieldConfidence;
    card: FieldConfidence;
    category: FieldConfidence;
  }>({
    amount: DEFAULT_CONFIDENCE,
    date: DEFAULT_CONFIDENCE,
    card: DEFAULT_CONFIDENCE,
    category: DEFAULT_CONFIDENCE,
  });

  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set());
  const [learnKeyword, setLearnKeyword] = useState<string | null>(null);
  const isQuickAddMode = parsedData !== null && parsedData !== undefined;

  // ── Load reference data ─────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const [catRes, cardRes, labelRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/cards"),
          fetch("/api/labels"),
        ]);
        const [catJson, cardJson, labelJson] = await Promise.all([
          catRes.json(),
          cardRes.json(),
          labelRes.json(),
        ]);

        if (catJson.success) setCategories(catJson.data);
        if (cardJson.success) setAllCards(cardJson.data);
        if (labelJson.success) setAllLabels(labelJson.data);
        setDataLoaded(true);
      } catch {
        setDataLoaded(true);
      }
    }
    load();
  }, []);

  // ── Apply parsed data when it changes ───────────────────────────
  useEffect(() => {
    if (!parsedData) return;

    if (parsedData.amount !== null) {
      setAmount(String(parsedData.amount));
    }
    if (parsedData.date) {
      setTransactionDate(parsedData.date);
    }
    if (parsedData.cardId !== null) {
      setCardId(String(parsedData.cardId));
    }
    if (parsedData.categoryId !== null) {
      setCategoryId(String(parsedData.categoryId));
    }
    if (parsedData.subcategoryId !== null) {
      setSubcategoryId(String(parsedData.subcategoryId));
    }
    if (parsedData.labelIds.length > 0) {
      setSelectedLabelIds(parsedData.labelIds);
    }
    if (parsedData.merchant) {
      setMerchant(parsedData.merchant);
    }
    if (parsedData.remainingText) {
      setDescription(parsedData.remainingText);
    }

    setConfidence(parsedData.confidence);
    setModifiedFields(new Set());
    setLearnKeyword(null);

    // Focus amount if it wasn't parsed
    if (parsedData.amount === null) {
      setTimeout(() => amountRef.current?.focus(), 100);
    }
  }, [parsedData]);

  // ── Subcategory options based on selected category ──────────────
  const selectedCategory = categories.find(
    (c) => String(c.id) === categoryId
  );
  const subcategoryOptions = selectedCategory?.subcategories ?? [];

  // Reset subcategory when category changes
  function handleCategoryChange(newCatId: string) {
    setCategoryId(newCatId);
    setSubcategoryId("");
    trackModifiedField("category");
  }

  // ── Auto-add card labels when card is selected ──────────────────
  useEffect(() => {
    if (!cardId || !dataLoaded) return;

    const card = allCards.find((c) => String(c.id) === cardId);
    if (!card) return;

    // Find the card-specific label
    const cardLabel = allLabels.find((l) => l.name === card.name);
    // Find "Credit Card Purchase" label
    const ccpLabel = allLabels.find((l) => l.name === "Credit Card Purchase");

    const idsToAdd: number[] = [];
    if (cardLabel) idsToAdd.push(cardLabel.id);
    if (ccpLabel) idsToAdd.push(ccpLabel.id);

    if (idsToAdd.length > 0) {
      setSelectedLabelIds((prev) => {
        const merged = new Set([...prev, ...idsToAdd]);
        return Array.from(merged);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId, dataLoaded, allCards, allLabels]);

  // ── Close label dropdown on outside click ───────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        labelDropdownRef.current &&
        !labelDropdownRef.current.contains(e.target as Node)
      ) {
        setShowLabelDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Track modified fields for learn prompt ──────────────────────
  function trackModifiedField(field: string) {
    if (!isQuickAddMode) return;
    setModifiedFields((prev) => new Set(prev).add(field));

    // If user modified category, offer to learn the keyword
    if (field === "category" && parsedData?.remainingText) {
      const words = parsedData.remainingText.trim().split(/\s+/);
      if (words.length > 0 && words[0].length > 2) {
        setLearnKeyword(words[0].toLowerCase());
      }
    }
  }

  // ── Validation ──────────────────────────────────────────────────
  function validate(): boolean {
    const errs: Record<string, string> = {};

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      errs.amount = "Amount must be greater than 0";
    }
    if (!transactionDate) {
      errs.transactionDate = "Date is required";
    }
    if (!categoryId) {
      errs.categoryId = "Category is required";
    }
    if (!subcategoryId) {
      errs.subcategoryId = "Subcategory is required";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Submit ──────────────────────────────────────────────────────
  async function handleSave(addAnother: boolean) {
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        ...(mode === "edit" && initialData?.id ? { id: initialData.id } : {}),
        amount: parseFloat(amount),
        transactionDate,
        categoryId: parseInt(categoryId, 10),
        subcategoryId: parseInt(subcategoryId, 10),
        cardId: cardId ? parseInt(cardId, 10) : null,
        labelIds: selectedLabelIds,
        notes: notes || null,
        description: description || (isQuickAddMode ? parsedData?.remainingText : "Manual entry") || "Manual entry",
        merchant: merchant || null,
      };

      const res = await fetch("/api/transactions", {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        if (addAnother) {
          resetForm();
          onSaveAndAddAnother?.();
        } else {
          onSaved?.();
        }
      } else {
        setErrors({ form: json.error || "Failed to save transaction" });
      }
    } catch {
      setErrors({ form: "Network error — please try again" });
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setAmount("");
    setTransactionDate(todayString());
    setCategoryId("");
    setSubcategoryId("");
    setCardId("");
    setSelectedLabelIds([]);
    setNotes("");
    setDescription("");
    setMerchant("");
    setErrors({});
    setConfidence({
      amount: DEFAULT_CONFIDENCE,
      date: DEFAULT_CONFIDENCE,
      card: DEFAULT_CONFIDENCE,
      category: DEFAULT_CONFIDENCE,
    });
    setModifiedFields(new Set());
    setLearnKeyword(null);
    amountRef.current?.focus();
  }

  // ── Label helpers ───────────────────────────────────────────────
  const filteredLabels = allLabels.filter(
    (l) =>
      !selectedLabelIds.includes(l.id) &&
      l.name.toLowerCase().includes(labelSearch.toLowerCase())
  );

  function addLabel(id: number) {
    setSelectedLabelIds((prev) => Array.from(new Set([...prev, id])));
    setLabelSearch("");
    setShowLabelDropdown(false);
  }

  function removeLabel(id: number) {
    setSelectedLabelIds((prev) => prev.filter((lid) => lid !== id));
  }

  const selectedLabelNames = selectedLabelIds
    .map((id) => allLabels.find((l) => l.id === id))
    .filter(Boolean) as LabelOption[];

  // ── Render helpers ──────────────────────────────────────────────
  function renderConfidence(field: keyof typeof confidence) {
    if (!isQuickAddMode) return null;
    return (
      <ConfidenceDot
        level={confidence[field].level}
        className="ml-1.5"
      />
    );
  }

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Amount */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="tx-amount"
          className="flex items-center text-sm font-medium text-text-secondary"
        >
          Amount ({getCurrency()}) <span className="text-danger ml-0.5">*</span>
          {renderConfidence("amount")}
        </label>
        <input
          ref={amountRef}
          id="tx-amount"
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            trackModifiedField("amount");
            if (errors.amount) setErrors((prev) => ({ ...prev, amount: "" }));
          }}
          placeholder="0.00"
          className={cn(
            "w-full rounded-input bg-surface-2 border border-border px-3 py-2 text-base text-text-primary",
            "font-mono tabular-nums",
            "placeholder:text-text-muted",
            "focus:outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-glow",
            "transition-all duration-150",
            errors.amount && "border-danger"
          )}
        />
        {errors.amount && (
          <p className="text-xs text-danger">{errors.amount}</p>
        )}
      </div>

      {/* Date */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="tx-date"
          className="flex items-center text-sm font-medium text-text-secondary"
        >
          Date <span className="text-danger ml-0.5">*</span>
          {renderConfidence("date")}
        </label>
        <DatePicker
          id="tx-date"
          value={transactionDate}
          onChange={(e) => {
            setTransactionDate(e.target.value);
            trackModifiedField("date");
          }}
        />
      </div>

      {/* Category */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="tx-category"
          className="flex items-center text-sm font-medium text-text-secondary"
        >
          Category <span className="text-danger ml-0.5">*</span>
          {renderConfidence("category")}
        </label>
        <select
          id="tx-category"
          value={categoryId}
          onChange={(e) => {
            handleCategoryChange(e.target.value);
            if (errors.categoryId)
              setErrors((prev) => ({ ...prev, categoryId: "" }));
          }}
          className={cn(
            "w-full appearance-none rounded-input bg-surface-2 border border-border px-3 py-2 text-base text-text-primary",
            "focus:outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-glow",
            "transition-all duration-150",
            !categoryId && "text-text-muted",
            errors.categoryId && "border-danger"
          )}
        >
          <option value="">Select category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={String(cat.id)}>
              {cat.name}
            </option>
          ))}
        </select>
        {errors.categoryId && (
          <p className="text-xs text-danger">{errors.categoryId}</p>
        )}
      </div>

      {/* Subcategory */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="tx-subcategory"
          className="flex items-center text-sm font-medium text-text-secondary"
        >
          Subcategory <span className="text-danger ml-0.5">*</span>
        </label>
        <select
          id="tx-subcategory"
          value={subcategoryId}
          onChange={(e) => {
            setSubcategoryId(e.target.value);
            trackModifiedField("subcategory");
            if (errors.subcategoryId)
              setErrors((prev) => ({ ...prev, subcategoryId: "" }));
          }}
          disabled={!categoryId}
          className={cn(
            "w-full appearance-none rounded-input bg-surface-2 border border-border px-3 py-2 text-base text-text-primary",
            "focus:outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-glow",
            "transition-all duration-150",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            !subcategoryId && "text-text-muted",
            errors.subcategoryId && "border-danger"
          )}
        >
          <option value="">Select subcategory</option>
          {subcategoryOptions.map((sub) => (
            <option key={sub.id} value={String(sub.id)}>
              {sub.name}
            </option>
          ))}
        </select>
        {errors.subcategoryId && (
          <p className="text-xs text-danger">{errors.subcategoryId}</p>
        )}
      </div>

      {/* Card */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="tx-card"
          className="flex items-center text-sm font-medium text-text-secondary"
        >
          Card
          {renderConfidence("card")}
        </label>
        <select
          id="tx-card"
          value={cardId}
          onChange={(e) => {
            setCardId(e.target.value);
            trackModifiedField("card");
          }}
          className={cn(
            "w-full appearance-none rounded-input bg-surface-2 border border-border px-3 py-2 text-base text-text-primary",
            "focus:outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-glow",
            "transition-all duration-150",
            !cardId && "text-text-muted"
          )}
        >
          <option value="">None (Cash/Bank)</option>
          {allCards.map((card) => (
            <option key={card.id} value={String(card.id)}>
              {card.name}
            </option>
          ))}
        </select>
      </div>

      {/* Labels */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-secondary">
          Labels
        </label>

        {/* Selected labels as chips */}
        {selectedLabelNames.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedLabelNames.map((label) => (
              <Chip
                key={label.id}
                removable
                onRemove={() => removeLabel(label.id)}
              >
                {label.name}
              </Chip>
            ))}
          </div>
        )}

        {/* Label search + dropdown */}
        <div ref={labelDropdownRef} className="relative">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              value={labelSearch}
              onChange={(e) => {
                setLabelSearch(e.target.value);
                setShowLabelDropdown(true);
              }}
              onFocus={() => setShowLabelDropdown(true)}
              placeholder="Search or add label..."
              className={cn(
                "w-full rounded-input bg-surface-2 border border-border pl-8 pr-3 py-2 text-sm text-text-primary",
                "placeholder:text-text-muted",
                "focus:outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-glow",
                "transition-all duration-150"
              )}
            />
          </div>

          {showLabelDropdown && (
            <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-input border border-border-hover bg-surface-3 py-1 shadow-lg">
              {filteredLabels.length > 0 ? (
                filteredLabels.slice(0, 15).map((label) => (
                  <button
                    key={label.id}
                    onClick={() => addLabel(label.id)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-text-primary hover:bg-surface-2 transition-colors text-left"
                  >
                    <Plus size={12} className="text-text-muted shrink-0" />
                    {label.name}
                    {label.isSystem === 0 && (
                      <span className="ml-auto text-xs text-text-muted">
                        custom
                      </span>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-text-muted">
                  No labels found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="tx-notes"
          className="text-sm font-medium text-text-secondary"
        >
          Notes
        </label>
        <input
          id="tx-notes"
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes..."
          className={cn(
            "w-full rounded-input bg-surface-2 border border-border px-3 py-2 text-sm text-text-primary",
            "placeholder:text-text-muted",
            "focus:outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-glow",
            "transition-all duration-150"
          )}
        />
      </div>

      {/* Learn prompt (Quick Add mode only, when user modifies a field) */}
      {isQuickAddMode &&
        learnKeyword &&
        modifiedFields.has("category") &&
        categoryId &&
        subcategoryId && (
          <LearnPrompt
            keyword={learnKeyword}
            categoryId={parseInt(categoryId, 10)}
            subcategoryId={parseInt(subcategoryId, 10)}
            labelIds={selectedLabelIds}
            onDismiss={() => setLearnKeyword(null)}
            onSaved={() => setLearnKeyword(null)}
          />
        )}

      {/* Form error */}
      {errors.form && (
        <p className="text-sm text-danger">{errors.form}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          onClick={() => handleSave(false)}
          disabled={saving}
          size="md"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Saving...
            </>
          ) : mode === "edit" ? (
            "Update"
          ) : (
            "Save"
          )}
        </Button>

        {mode === "create" && (
          <Button
            variant="secondary"
            onClick={() => handleSave(true)}
            disabled={saving}
            size="md"
          >
            Save & Add Another
          </Button>
        )}

        {onCancel && (
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={saving}
            size="md"
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

export { TransactionForm, type TransactionFormProps, type TransactionFormData };
