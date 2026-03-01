"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Label {
  id: number;
  name: string;
  isSystem: number;
}

export function LabelsManager() {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchLabels = useCallback(async () => {
    try {
      const res = await fetch("/api/labels");
      const data = await res.json();
      if (data.success) setLabels(data.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  const handleAdd = useCallback(async () => {
    setError("");
    if (!newName.trim()) {
      setError("Label name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNewName("");
        setShowAdd(false);
        fetchLabels();
      } else {
        setError(data.error || "Failed to add label");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }, [newName, fetchLabels]);

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        const res = await fetch(`/api/labels?id=${id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          setLabels((prev) => prev.filter((l) => l.id !== id));
        }
      } catch {
        // silently fail
      }
    },
    []
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
      </div>
    );
  }

  const systemLabels = labels.filter((l) => l.isSystem);
  const customLabels = labels.filter((l) => !l.isSystem);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Labels</h2>
          <p className="mt-1 text-sm text-text-secondary">
            System labels cannot be edited. You can add custom labels.
          </p>
        </div>
        {!showAdd && (
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus size={14} />
            Add Label
          </Button>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="New label name"
            className="flex-1 rounded-button border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-sage-400 focus:outline-none"
            autoFocus
          />
          <Button size="sm" onClick={handleAdd} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
          </Button>
          <button onClick={() => { setShowAdd(false); setError(""); }} className="text-text-muted hover:text-text-primary">
            <X size={16} />
          </button>
        </div>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}

      {/* Custom Labels */}
      {customLabels.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wider text-text-muted">
            Custom ({customLabels.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {customLabels.map((label) => (
              <div
                key={label.id}
                className="group flex items-center gap-1.5 rounded-full border border-sand-400/30 bg-sand-400/10 px-3 py-1 text-sm text-sand-300"
              >
                {label.name}
                <button
                  onClick={() => handleDelete(label.id)}
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label={`Delete ${label.name}`}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Labels */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium uppercase tracking-wider text-text-muted">
          System ({systemLabels.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {systemLabels.map((label) => (
            <div
              key={label.id}
              className={cn(
                "rounded-full border border-seafoam-400/30 bg-seafoam-400/10 px-3 py-1 text-sm text-seafoam-300"
              )}
            >
              {label.name}
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-text-muted">
        {labels.length} total labels ({systemLabels.length} system, {customLabels.length} custom)
      </p>
    </div>
  );
}
