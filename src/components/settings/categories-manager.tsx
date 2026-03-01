"use client";

import { useState, useEffect } from "react";
import { Loader2, ChevronDown, ChevronRight } from "lucide-react";

interface Category {
  id: number;
  name: string;
  subcategories: { id: number; name: string }[];
}

export function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setCategories(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpanded(new Set(categories.map((c) => c.id)));
  };

  const collapseAll = () => {
    setExpanded(new Set());
  };

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
          <h2 className="text-lg font-semibold text-text-primary">Categories</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Pre-seeded categories and subcategories (read-only).
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="text-xs text-text-secondary hover:text-text-primary"
          >
            Expand all
          </button>
          <span className="text-text-muted">|</span>
          <button
            onClick={collapseAll}
            className="text-xs text-text-secondary hover:text-text-primary"
          >
            Collapse all
          </button>
        </div>
      </div>

      <div className="space-y-1">
        {categories.map((cat) => {
          const isExpanded = expanded.has(cat.id);
          return (
            <div key={cat.id}>
              <button
                onClick={() => toggleExpand(cat.id)}
                className="flex w-full items-center gap-2 rounded-button px-3 py-2 text-left text-sm transition-colors hover:bg-surface-2"
              >
                {isExpanded ? (
                  <ChevronDown size={14} className="text-text-muted" />
                ) : (
                  <ChevronRight size={14} className="text-text-muted" />
                )}
                <span className="font-medium text-text-primary">{cat.name}</span>
                <span className="text-xs text-text-muted">
                  ({cat.subcategories.length})
                </span>
              </button>
              {isExpanded && (
                <div className="mb-2 ml-9 space-y-0.5">
                  {cat.subcategories.map((sub) => (
                    <div
                      key={sub.id}
                      className="rounded-button px-3 py-1.5 text-sm text-text-secondary"
                    >
                      {sub.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-text-muted">
        {categories.length} categories, {categories.reduce((sum, c) => sum + c.subcategories.length, 0)} subcategories
      </p>
    </div>
  );
}
