"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface KeywordRule {
  id: number;
  keyword: string;
  categoryId: number | null;
  subcategoryId: number | null;
  labelIds: string | null;
  priority: number;
  isSystem: number;
}

interface Category {
  id: number;
  name: string;
  subcategories: { id: number; name: string }[];
}

interface Label {
  id: number;
  name: string;
}

export function KeywordRulesManager() {
  const [rules, setRules] = useState<KeywordRule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allLabels, setAllLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [testInput, setTestInput] = useState("");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  // Add form state
  const [newKeyword, setNewKeyword] = useState("");
  const [newCategoryId, setNewCategoryId] = useState<number | "">("");
  const [newSubcategoryId, setNewSubcategoryId] = useState<number | "">("");
  const [newLabelIds, setNewLabelIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [rulesRes, catsRes, labelsRes] = await Promise.all([
        fetch("/api/keywords"),
        fetch("/api/categories"),
        fetch("/api/labels"),
      ]);
      const [rulesData, catsData, labelsData] = await Promise.all([
        rulesRes.json(),
        catsRes.json(),
        labelsRes.json(),
      ]);
      if (rulesData.success) setRules(rulesData.data);
      if (catsData.success) setCategories(catsData.data);
      if (labelsData.success) setAllLabels(labelsData.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getCategoryName = useCallback(
    (id: number | null) => categories.find((c) => c.id === id)?.name ?? "—",
    [categories]
  );

  const getSubcategoryName = useCallback(
    (catId: number | null, subId: number | null) => {
      if (!catId || !subId) return "—";
      const cat = categories.find((c) => c.id === catId);
      return cat?.subcategories.find((s) => s.id === subId)?.name ?? "—";
    },
    [categories]
  );

  const selectedCategory = categories.find((c) => c.id === newCategoryId);

  const handleAdd = useCallback(async () => {
    setFormError("");
    if (!newKeyword.trim()) {
      setFormError("Keyword is required");
      return;
    }
    if (!newCategoryId || !newSubcategoryId) {
      setFormError("Category and subcategory are required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: newKeyword.trim().toLowerCase(),
          categoryId: newCategoryId,
          subcategoryId: newSubcategoryId,
          labelIds: newLabelIds.length > 0 ? newLabelIds : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddForm(false);
        setNewKeyword("");
        setNewCategoryId("");
        setNewSubcategoryId("");
        setNewLabelIds([]);
        fetchData();
      } else {
        setFormError(data.error || "Failed to add rule");
      }
    } catch {
      setFormError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }, [newKeyword, newCategoryId, newSubcategoryId, newLabelIds, fetchData]);

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        const res = await fetch(`/api/keywords?id=${id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          setRules((prev) => prev.filter((r) => r.id !== id));
        }
      } catch {
        // silently fail
      }
    },
    []
  );

  const handleTest = useCallback(async () => {
    if (!testInput.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: testInput }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const p = data.data;
        const parts: string[] = [];
        if (p.amount) parts.push(`Amount: ${p.amount}`);
        if (p.categoryName) parts.push(`Category: ${p.categoryName}`);
        if (p.subcategoryName) parts.push(`Sub: ${p.subcategoryName}`);
        if (p.cardName) parts.push(`Card: ${p.cardName}`);
        if (p.labels?.length) parts.push(`Labels: ${p.labels.join(", ")}`);
        setTestResult(parts.length > 0 ? parts.join(" | ") : "No matches found");
      } else {
        setTestResult("No matches found");
      }
    } catch {
      setTestResult("Test failed");
    } finally {
      setTesting(false);
    }
  }, [testInput]);

  const filteredRules = search
    ? rules.filter((r) => r.keyword.includes(search.toLowerCase()))
    : rules;

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
          <h2 className="text-lg font-semibold text-text-primary">Keyword Rules</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Rules for auto-categorizing transactions from Quick Add input.
          </p>
        </div>
        {!showAddForm && (
          <Button size="sm" onClick={() => setShowAddForm(true)}>
            <Plus size={14} />
            Add Rule
          </Button>
        )}
      </div>

      {/* Test a keyword */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-primary">Test a keyword</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleTest()}
            placeholder='e.g. "starbucks 45 fab"'
            className="flex-1 rounded-button border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-sage-400 focus:outline-none"
          />
          <Button size="sm" variant="secondary" onClick={handleTest} disabled={testing}>
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search size={14} />}
            Test
          </Button>
        </div>
        {testResult && (
          <div className="rounded-button border border-border bg-surface-2 px-3 py-2 text-xs font-mono text-text-secondary">
            {testResult}
          </div>
        )}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="space-y-4 rounded-card border border-border bg-surface-2 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-text-primary">New Keyword Rule</h3>
            <button onClick={() => setShowAddForm(false)} className="text-text-muted hover:text-text-primary">
              <X size={16} />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-text-secondary">Keyword</label>
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="e.g. starbucks"
                className="w-full rounded-button border border-border bg-surface-3 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-sage-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-text-secondary">Category</label>
              <select
                value={newCategoryId}
                onChange={(e) => {
                  setNewCategoryId(e.target.value ? parseInt(e.target.value) : "");
                  setNewSubcategoryId("");
                }}
                className="w-full rounded-button border border-border bg-surface-3 px-3 py-2 text-sm text-text-primary focus:border-sage-400 focus:outline-none [color-scheme:dark]"
              >
                <option value="" className="bg-surface-2">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-surface-2">{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-text-secondary">Subcategory</label>
              <select
                value={newSubcategoryId}
                onChange={(e) => setNewSubcategoryId(e.target.value ? parseInt(e.target.value) : "")}
                disabled={!selectedCategory}
                className="w-full rounded-button border border-border bg-surface-3 px-3 py-2 text-sm text-text-primary focus:border-sage-400 focus:outline-none disabled:opacity-50 [color-scheme:dark]"
              >
                <option value="" className="bg-surface-2">Select subcategory</option>
                {selectedCategory?.subcategories.map((s) => (
                  <option key={s.id} value={s.id} className="bg-surface-2">{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-text-secondary">Labels (optional)</label>
              <select
                multiple
                value={newLabelIds.map(String)}
                onChange={(e) => {
                  const vals = Array.from(e.target.selectedOptions, (o) => parseInt(o.value));
                  setNewLabelIds(vals);
                }}
                className="w-full rounded-button border border-border bg-surface-3 px-3 py-2 text-sm text-text-primary focus:border-sage-400 focus:outline-none [color-scheme:dark]"
                size={4}
              >
                {allLabels.map((l) => (
                  <option key={l.id} value={l.id} className="bg-surface-2">{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          {formError && <p className="text-sm text-danger">{formError}</p>}

          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Add Rule
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter rules..."
          className="w-full rounded-button border border-border bg-surface-2 py-2 pl-8 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-sage-400 focus:outline-none"
        />
      </div>

      {/* Rules Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-text-muted">
              <th className="pb-2 pr-4">Keyword</th>
              <th className="pb-2 pr-4">Category</th>
              <th className="pb-2 pr-4">Subcategory</th>
              <th className="pb-2 pr-4">Type</th>
              <th className="pb-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filteredRules.map((rule) => (
              <tr key={rule.id} className="border-b border-border/50 hover:bg-surface-2/50">
                <td className="py-2 pr-4 font-mono text-text-primary">{rule.keyword}</td>
                <td className="py-2 pr-4 text-text-secondary">{getCategoryName(rule.categoryId)}</td>
                <td className="py-2 pr-4 text-text-secondary">
                  {getSubcategoryName(rule.categoryId, rule.subcategoryId)}
                </td>
                <td className="py-2 pr-4">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs",
                      rule.isSystem
                        ? "bg-seafoam-400/15 text-seafoam-300"
                        : "bg-sand-400/15 text-sand-300"
                    )}
                  >
                    {rule.isSystem ? "System" : "Custom"}
                  </span>
                </td>
                <td className="py-2">
                  {!rule.isSystem && (
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="rounded-button p-1 text-text-muted hover:bg-danger/10 hover:text-danger"
                      aria-label={`Delete rule for ${rule.keyword}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filteredRules.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-text-muted">
                  {search ? "No rules match your filter" : "No keyword rules yet"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-text-muted">
        {rules.length} rules ({rules.filter((r) => r.isSystem).length} system, {rules.filter((r) => !r.isSystem).length} custom)
      </p>
    </div>
  );
}
