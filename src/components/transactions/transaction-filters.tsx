"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Search, SlidersHorizontal, X, ArrowUpDown } from "lucide-react";

interface CategoryOption {
  id: number;
  name: string;
  subcategories: { id: number; name: string }[];
}

interface CardOption {
  id: number;
  name: string;
}

interface LabelOption {
  id: number;
  name: string;
}

interface FilterState {
  dateFrom: string;
  dateTo: string;
  categoryId: string;
  subcategoryId: string;
  cardId: string;
  labelId: string;
  search: string;
  sortBy: string;
  sortOrder: string;
}

interface TransactionFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  className?: string;
}

function TransactionFilters({
  filters,
  onChange,
  className,
}: TransactionFiltersProps) {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [allCards, setAllCards] = useState<CardOption[]>([]);
  const [allLabels, setAllLabels] = useState<LabelOption[]>([]);
  const [showFilters, setShowFilters] = useState(false);

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
      } catch {
        // Silently fail
      }
    }
    load();
  }, []);

  function update(partial: Partial<FilterState>) {
    onChange({ ...filters, ...partial });
  }

  function clearFilters() {
    onChange({
      dateFrom: "",
      dateTo: "",
      categoryId: "",
      subcategoryId: "",
      cardId: "",
      labelId: "",
      search: filters.search,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    });
  }

  const selectedCategory = categories.find(
    (c) => String(c.id) === filters.categoryId
  );
  const subcategoryOptions = selectedCategory?.subcategories ?? [];

  const hasActiveFilters =
    filters.dateFrom ||
    filters.dateTo ||
    filters.categoryId ||
    filters.subcategoryId ||
    filters.cardId ||
    filters.labelId;

  function toggleSort(field: string) {
    if (filters.sortBy === field) {
      update({ sortOrder: filters.sortOrder === "desc" ? "asc" : "desc" });
    } else {
      update({ sortBy: field, sortOrder: "desc" });
    }
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Search bar + toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="Search transactions..."
            className={cn(
              "w-full rounded-input bg-surface-2 border border-border pl-9 pr-3 py-2 text-sm text-text-primary",
              "placeholder:text-text-muted",
              "focus:outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-glow",
              "transition-all duration-150"
            )}
          />
        </div>

        <button
          onClick={() => setShowFilters((p) => !p)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-button border px-3 py-2 text-sm font-medium transition-all duration-150",
            showFilters || hasActiveFilters
              ? "border-sage-400/30 bg-sage-400/10 text-sage-300"
              : "border-border text-text-secondary hover:text-text-primary hover:bg-surface-3"
          )}
          aria-label="Toggle filters"
        >
          <SlidersHorizontal size={14} />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-sage-400 text-[10px] font-bold text-text-on-accent">
              !
            </span>
          )}
        </button>

        {/* Sort buttons */}
        <div className="hidden sm:flex items-center gap-1">
          {(["date", "amount", "category"] as const).map((field) => (
            <button
              key={field}
              onClick={() => toggleSort(field)}
              className={cn(
                "inline-flex items-center gap-1 rounded-button px-2 py-1.5 text-xs font-medium transition-all duration-150",
                filters.sortBy === field
                  ? "bg-surface-3 text-text-primary"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              {field.charAt(0).toUpperCase() + field.slice(1)}
              {filters.sortBy === field && (
                <ArrowUpDown
                  size={10}
                  className={
                    filters.sortOrder === "asc" ? "rotate-180" : ""
                  }
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Expandable filters */}
      {showFilters && (
        <div className="grid grid-cols-2 gap-3 rounded-card border border-border bg-surface-1 p-4 sm:grid-cols-3 lg:grid-cols-6">
          {/* Date from */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-muted">From</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => update({ dateFrom: e.target.value })}
              className="rounded-input bg-surface-2 border border-border px-2 py-1.5 text-sm text-text-primary [color-scheme:dark] focus:outline-none focus:border-sage-400"
            />
          </div>

          {/* Date to */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-muted">To</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => update({ dateTo: e.target.value })}
              className="rounded-input bg-surface-2 border border-border px-2 py-1.5 text-sm text-text-primary [color-scheme:dark] focus:outline-none focus:border-sage-400"
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-muted">Category</label>
            <select
              value={filters.categoryId}
              onChange={(e) =>
                update({ categoryId: e.target.value, subcategoryId: "" })
              }
              className="rounded-input bg-surface-2 border border-border px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:border-sage-400 appearance-none"
            >
              <option value="">All</option>
              {categories.map((cat) => (
                <option key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-muted">Subcategory</label>
            <select
              value={filters.subcategoryId}
              onChange={(e) => update({ subcategoryId: e.target.value })}
              disabled={!filters.categoryId}
              className="rounded-input bg-surface-2 border border-border px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:border-sage-400 appearance-none disabled:opacity-50"
            >
              <option value="">All</option>
              {subcategoryOptions.map((sub) => (
                <option key={sub.id} value={String(sub.id)}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Card */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-muted">Card</label>
            <select
              value={filters.cardId}
              onChange={(e) => update({ cardId: e.target.value })}
              className="rounded-input bg-surface-2 border border-border px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:border-sage-400 appearance-none"
            >
              <option value="">All</option>
              {allCards.map((card) => (
                <option key={card.id} value={String(card.id)}>
                  {card.name}
                </option>
              ))}
            </select>
          </div>

          {/* Label */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-muted">Label</label>
            <select
              value={filters.labelId}
              onChange={(e) => update({ labelId: e.target.value })}
              className="rounded-input bg-surface-2 border border-border px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:border-sage-400 appearance-none"
            >
              <option value="">All</option>
              {allLabels.map((label) => (
                <option key={label.id} value={String(label.id)}>
                  {label.name}
                </option>
              ))}
            </select>
          </div>

          {/* Clear button */}
          {hasActiveFilters && (
            <div className="col-span-full flex justify-end">
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={12} />
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export {
  TransactionFilters,
  type TransactionFiltersProps,
  type FilterState,
};
