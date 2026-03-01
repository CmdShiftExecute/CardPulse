"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { EntryModeToggle, type EntryMode } from "@/components/transactions/entry-mode-toggle";
import { QuickAddInput } from "@/components/transactions/quick-add-input";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionRow, type TransactionRowData } from "@/components/transactions/transaction-row";
import { TransactionFilters, type FilterState } from "@/components/transactions/transaction-filters";
import { Trash2, AlertTriangle, Receipt } from "lucide-react";
import { formatAmount } from "@/lib/utils";
import type { ParsedTransaction } from "@/types";
import { SkeletonList } from "@/components/ui/skeleton";
import { PageTransition } from "@/components/ui/page-transition";

export default function TransactionsPage() {
  // ── Entry mode state ────────────────────────────────────────────
  const [entryMode, setEntryMode] = useState<EntryMode>("quick");
  const [parsedData, setParsedData] = useState<ParsedTransaction | null>(null);
  const [showForm, setShowForm] = useState(false);

  // ── Transaction list state ──────────────────────────────────────
  const [transactions, setTransactions] = useState<TransactionRowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // ── Edit state ──────────────────────────────────────────────────
  const [editingTx, setEditingTx] = useState<TransactionRowData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // ── Delete state ────────────────────────────────────────────────
  const [deleteIds, setDeleteIds] = useState<number[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Filters ─────────────────────────────────────────────────────
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: "",
    dateTo: "",
    categoryId: "",
    subcategoryId: "",
    cardId: "",
    labelId: "",
    search: "",
    sortBy: "date",
    sortOrder: "desc",
  });

  // ── Fetch transactions ──────────────────────────────────────────
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      if (filters.categoryId) params.set("categoryId", filters.categoryId);
      if (filters.subcategoryId)
        params.set("subcategoryId", filters.subcategoryId);
      if (filters.cardId) params.set("cardId", filters.cardId);
      if (filters.labelId) params.set("labelId", filters.labelId);
      if (filters.search) params.set("search", filters.search);
      params.set("sortBy", filters.sortBy);
      params.set("sortOrder", filters.sortOrder);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setTransactions(json.data);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // ── NLP parse handler ───────────────────────────────────────────
  function handleParsed(result: ParsedTransaction) {
    setParsedData(result);
    setShowForm(true);
  }

  // ── Mode change handler ─────────────────────────────────────────
  function handleModeChange(mode: EntryMode) {
    setEntryMode(mode);
    setParsedData(null);
    if (mode === "manual") {
      setShowForm(true);
    } else {
      setShowForm(false);
    }
  }

  // ── Save handlers ───────────────────────────────────────────────
  function handleSaved() {
    setShowForm(false);
    setParsedData(null);
    fetchTransactions();
  }

  function handleSaveAndAddAnother() {
    setParsedData(null);
    fetchTransactions();
    // Keep form open
  }

  // ── Selection ───────────────────────────────────────────────────
  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAll() {
    if (selectedIds.size === transactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map((t) => t.id)));
    }
  }

  // ── Edit ────────────────────────────────────────────────────────
  function handleEdit(id: number) {
    const tx = transactions.find((t) => t.id === id);
    if (tx) {
      setEditingTx(tx);
      setShowEditModal(true);
    }
  }

  function handleEditSaved() {
    setShowEditModal(false);
    setEditingTx(null);
    fetchTransactions();
  }

  // ── Delete ──────────────────────────────────────────────────────
  function handleDeleteSingle(id: number) {
    setDeleteIds([id]);
    setShowDeleteConfirm(true);
  }

  function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    setDeleteIds(Array.from(selectedIds));
    setShowDeleteConfirm(true);
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: deleteIds }),
      });
      const json = await res.json();
      if (json.success) {
        setSelectedIds(new Set());
        fetchTransactions();
      }
    } catch {
      // Silently fail
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteIds([]);
    }
  }

  // ── Total amount ────────────────────────────────────────────────
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

  // ── Render ──────────────────────────────────────────────────────
  return (
    <AppShell>
      <PageTransition>
      <div className="flex flex-col gap-6">
        {/* Entry section */}
        <Card>
          <CardHeader>
            <CardTitle>Add Transaction</CardTitle>
            <EntryModeToggle mode={entryMode} onChange={handleModeChange} />
          </CardHeader>
          <CardContent>
            {entryMode === "quick" && (
              <div className="flex flex-col gap-4">
                <QuickAddInput onParsed={handleParsed} />
                {showForm && (
                  <TransactionForm
                    parsedData={parsedData}
                    mode="create"
                    onSaved={handleSaved}
                    onSaveAndAddAnother={handleSaveAndAddAnother}
                    onCancel={() => {
                      setShowForm(false);
                      setParsedData(null);
                    }}
                  />
                )}
              </div>
            )}

            {entryMode === "manual" && (
              <TransactionForm
                mode="create"
                onSaved={handleSaved}
                onSaveAndAddAnother={handleSaveAndAddAnother}
              />
            )}
          </CardContent>
        </Card>

        {/* Transaction list section */}
        <div className="flex flex-col gap-4">
          <TransactionFilters filters={filters} onChange={setFilters} />

          {/* Bulk actions bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {transactions.length > 0 && (
                <label className="flex items-center gap-2 text-sm text-text-secondary">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.size === transactions.length &&
                      transactions.length > 0
                    }
                    onChange={selectAll}
                    className="h-4 w-4 rounded border-border bg-surface-2 accent-sage-400"
                  />
                  {selectedIds.size > 0
                    ? `${selectedIds.size} selected`
                    : "Select all"}
                </label>
              )}

              {selectedIds.size > 0 && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 size={14} />
                  Delete ({selectedIds.size})
                </Button>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-text-secondary">
              <span>
                {transactions.length} transaction
                {transactions.length !== 1 ? "s" : ""}
              </span>
              {transactions.length > 0 && (
                <span className="font-mono text-sand-400 font-medium tabular-nums">
                  Total: {formatAmount(totalAmount)}
                </span>
              )}
            </div>
          </div>

          {/* Transaction list */}
          {loading ? (
            <SkeletonList rows={6} />
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-sage-400/10 flex items-center justify-center mb-1">
                <Receipt size={28} className="text-sage-400/50" />
              </div>
              <div>
                <p className="text-base font-semibold text-text-primary">
                  No transactions found
                </p>
                <p className="mt-1 text-sm text-text-muted max-w-xs mx-auto">
                  {filters.search || filters.categoryId || filters.cardId || filters.labelId || filters.dateFrom
                    ? "Try adjusting your filters to find what you\u2019re looking for."
                    : "Type something like \u201Ccoffee 12.50 on ADCB\u201D above to add your first transaction."}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {transactions.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  transaction={tx}
                  selected={selectedIds.has(tx.id)}
                  onSelect={toggleSelect}
                  onEdit={handleEdit}
                  onDelete={handleDeleteSingle}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      </PageTransition>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingTx(null);
        }}
        title="Edit Transaction"
      >
        {editingTx && (
          <TransactionForm
            mode="edit"
            initialData={{
              id: editingTx.id,
              amount: String(editingTx.amount),
              transactionDate: editingTx.transactionDate,
              categoryId: editingTx.categoryId ? String(editingTx.categoryId) : "",
              subcategoryId: editingTx.subcategoryId ? String(editingTx.subcategoryId) : "",
              cardId: editingTx.cardId ? String(editingTx.cardId) : "",
              labelIds: editingTx.labels.map((l) => l.id),
              notes: editingTx.notes || "",
              description: editingTx.description,
              merchant: editingTx.merchant || "",
            }}
            onSaved={handleEditSaved}
            onCancel={() => {
              setShowEditModal(false);
              setEditingTx(null);
            }}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteIds([]);
        }}
        title="Delete Transactions"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="shrink-0 text-danger mt-0.5" />
            <p className="text-sm text-text-secondary">
              Are you sure you want to delete{" "}
              <span className="font-medium text-text-primary">
                {deleteIds.length} transaction
                {deleteIds.length !== 1 ? "s" : ""}
              </span>
              ? This action cannot be undone.
            </p>
          </div>
          <div className="flex items-center gap-3 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeleteIds([]);
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
