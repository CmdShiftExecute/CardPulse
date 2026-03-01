"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, Trash2, AlertTriangle, Loader2 } from "lucide-react";

export function DataManagement() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleExport = useCallback(async () => {
    setExporting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings/backup");
      if (!res.ok) {
        setMessage({ type: "error", text: "Failed to export database" });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cardpulse-backup-${new Date().toISOString().slice(0, 10)}.db`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage({ type: "success", text: "Database exported successfully" });
    } catch {
      setMessage({ type: "error", text: "Failed to export database" });
    } finally {
      setExporting(false);
    }
  }, []);

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".db")) {
      setMessage({ type: "error", text: "Please select a .db file" });
      return;
    }

    if (!window.confirm("This will replace ALL your data with the imported database. This cannot be undone. Continue?")) {
      e.target.value = "";
      return;
    }

    setImporting(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/settings/backup", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Database imported. Reloading..." });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to import database" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to import database" });
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }, []);

  const handleReset = useCallback(async () => {
    setResetting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings/backup", {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Data reset complete. Reloading..." });
        setShowResetConfirm(false);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to reset data" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to reset data" });
    } finally {
      setResetting(false);
    }
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Data Management</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Export, import, or reset your database.
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`rounded-button border px-4 py-2 text-sm ${
            message.type === "success"
              ? "border-success/30 bg-success/10 text-success"
              : "border-danger/30 bg-danger/10 text-danger"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Export */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-text-primary">Export Database</h3>
        <p className="text-xs text-text-secondary">
          Download a copy of your entire database as a .db file.
        </p>
        <Button size="sm" variant="secondary" onClick={handleExport} disabled={exporting}>
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download size={14} />}
          Export Backup
        </Button>
      </div>

      {/* Import */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-text-primary">Import Database</h3>
        <p className="text-xs text-text-secondary">
          Replace your entire database with a previously exported .db file.
          This will overwrite all existing data.
        </p>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-button border border-border-hover bg-transparent px-4 py-2 text-sm font-medium text-text-primary transition-all hover:bg-surface-3">
          {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload size={14} />}
          Import Backup
          <input
            type="file"
            accept=".db"
            onChange={handleImport}
            className="hidden"
            disabled={importing}
          />
        </label>
      </div>

      {/* Reset */}
      <div className="space-y-2 border-t border-border pt-6">
        <h3 className="text-sm font-medium text-danger">Danger Zone</h3>
        <p className="text-xs text-text-secondary">
          Delete all transactions, cards, EMIs, and budgets. Categories, labels,
          and settings will be preserved. This cannot be undone.
        </p>

        {!showResetConfirm ? (
          <Button
            size="sm"
            variant="danger"
            onClick={() => setShowResetConfirm(true)}
          >
            <Trash2 size={14} />
            Reset All Data
          </Button>
        ) : (
          <div className="rounded-card border border-danger/30 bg-danger/5 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="mt-0.5 shrink-0 text-danger" />
              <div className="space-y-3">
                <p className="text-sm font-medium text-text-primary">
                  Are you sure? This will permanently delete:
                </p>
                <ul className="list-inside list-disc text-xs text-text-secondary">
                  <li>All transactions</li>
                  <li>All credit cards</li>
                  <li>All EMI plans</li>
                  <li>All budgets</li>
                  <li>All cycle payment records</li>
                </ul>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={handleReset}
                    disabled={resetting}
                  >
                    {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Yes, Delete Everything
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowResetConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
