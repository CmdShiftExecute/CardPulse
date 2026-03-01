"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Loader2 } from "lucide-react";
import { getCurrency } from "@/lib/format";

interface Category {
  id: number;
  name: string;
  subcategories: { id: number; name: string }[];
}

interface BudgetFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (budget: {
    categoryId: number;
    subcategoryId: number | null;
    amount: number;
  }) => Promise<void>;
  categories: Category[];
  editData?: {
    id: number;
    categoryId: number;
    subcategoryId: number | null;
    amount: number;
  } | null;
}

function BudgetForm({ isOpen, onClose, onSave, categories, editData }: BudgetFormProps) {
  const [categoryId, setCategoryId] = useState<string>("");
  const [subcategoryId, setSubcategoryId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCategory = categories.find((c) => c.id === parseInt(categoryId, 10));
  const subcategories = selectedCategory?.subcategories || [];

  useEffect(() => {
    if (editData) {
      setCategoryId(String(editData.categoryId));
      setSubcategoryId(editData.subcategoryId ? String(editData.subcategoryId) : "");
      setAmount(String(editData.amount));
    } else {
      setCategoryId("");
      setSubcategoryId("");
      setAmount("");
    }
    setError(null);
  }, [editData, isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const catId = parseInt(categoryId, 10);
    if (!catId) {
      setError("Please select a category");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        categoryId: catId,
        subcategoryId: subcategoryId ? parseInt(subcategoryId, 10) : null,
        amount: parsedAmount,
      });
      onClose();
    } catch {
      setError("Failed to save budget");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editData ? "Edit Budget" : "Set Budget"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Select
          id="budget-category"
          label="Category"
          placeholder="Select category"
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setSubcategoryId("");
          }}
          options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
        />

        {subcategories.length > 0 && (
          <Select
            id="budget-subcategory"
            label="Subcategory (optional)"
            placeholder="Entire category"
            value={subcategoryId}
            onChange={(e) => setSubcategoryId(e.target.value)}
            options={subcategories.map((s) => ({ value: String(s.id), label: s.name }))}
          />
        )}

        <Input
          id="budget-amount"
          label={`Monthly Budget (${getCurrency()})`}
          type="number"
          placeholder="e.g. 5000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="1"
          step="0.01"
          className="font-mono"
        />

        {error && (
          <p className="text-xs text-danger">{error}</p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : editData ? (
              "Update Budget"
            ) : (
              "Set Budget"
            )}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export { BudgetForm };
