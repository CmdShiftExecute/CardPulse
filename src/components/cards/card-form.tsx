"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { getCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface CardFormData {
  id?: number;
  name: string;
  bank: string;
  lastFour: string;
  cycleStart: string;
  cycleEnd: string;
  statementDay: string;
  dueDay: string;
  creditLimit: string;
  color: string;
  aliases?: string[];
}

interface CardFormProps {
  initialData?: Partial<CardFormData>;
  mode?: "create" | "edit";
  onSaved?: () => void;
  onCancel?: () => void;
}

const PRESET_COLORS = [
  "#7EB89E", "#6BB0A8", "#C4AA78", "#8B9DC3",
  "#B8A0C8", "#A8C0B0", "#C8B8A0", "#90A8B8",
  "#C87070", "#D4B878",
];

function CardForm({ initialData, mode = "create", onSaved, onCancel }: CardFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [bank, setBank] = useState(initialData?.bank ?? "");
  const [lastFour, setLastFour] = useState(initialData?.lastFour ?? "");
  const [cycleStart, setCycleStart] = useState(initialData?.cycleStart ?? "");
  const [cycleEnd, setCycleEnd] = useState(initialData?.cycleEnd ?? "");
  const [statementDay, setStatementDay] = useState(initialData?.statementDay ?? "");
  const [dueDay, setDueDay] = useState(initialData?.dueDay ?? "");
  const [creditLimit, setCreditLimit] = useState(initialData?.creditLimit ?? "");
  const [color, setColor] = useState(initialData?.color ?? "#7EB89E");
  const [aliasesText, setAliasesText] = useState(
    initialData?.aliases?.join(", ") ?? ""
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function validate(): boolean {
    const errs: Record<string, string> = {};

    if (!name.trim()) errs.name = "Card name is required";
    if (!bank.trim()) errs.bank = "Bank name is required";

    const cs = parseInt(cycleStart, 10);
    if (!cycleStart || isNaN(cs) || cs < 1 || cs > 31) {
      errs.cycleStart = "Enter a valid day (1-31)";
    }

    const ce = parseInt(cycleEnd, 10);
    if (!cycleEnd || isNaN(ce) || ce < 1 || ce > 31) {
      errs.cycleEnd = "Enter a valid day (1-31)";
    }

    const sd = parseInt(statementDay, 10);
    if (!statementDay || isNaN(sd) || sd < 1 || sd > 31) {
      errs.statementDay = "Enter a valid day (1-31)";
    }

    const dd = parseInt(dueDay, 10);
    if (!dueDay || isNaN(dd) || dd < 1 || dd > 31) {
      errs.dueDay = "Enter a valid day (1-31)";
    }

    if (lastFour && (lastFour.length !== 4 || !/^\d{4}$/.test(lastFour))) {
      errs.lastFour = "Must be exactly 4 digits";
    }

    if (creditLimit) {
      const cl = parseFloat(creditLimit);
      if (isNaN(cl) || cl < 0) errs.creditLimit = "Must be a positive number";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setSaving(true);
    try {
      // Parse aliases from comma-separated text, filter empties
      const aliases = aliasesText
        .split(",")
        .map(a => a.trim().toLowerCase())
        .filter(a => a.length > 0);

      const payload = {
        ...(mode === "edit" && initialData?.id ? { id: initialData.id } : {}),
        name: name.trim(),
        bank: bank.trim(),
        lastFour: lastFour || null,
        cycleStart: parseInt(cycleStart, 10),
        cycleEnd: parseInt(cycleEnd, 10),
        statementDay: parseInt(statementDay, 10),
        dueDay: parseInt(dueDay, 10),
        creditLimit: creditLimit ? parseFloat(creditLimit) : null,
        color,
        aliases,
      };

      const res = await fetch("/api/cards", {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        onSaved?.();
      } else {
        setErrors({ form: json.error || "Failed to save card" });
      }
    } catch {
      setErrors({ form: "Network error — please try again" });
    } finally {
      setSaving(false);
    }
  }

  const inputCn = (hasError: boolean) =>
    cn(
      "w-full rounded-input bg-surface-2 border border-border px-3 py-2 text-base text-text-primary",
      "placeholder:text-text-muted",
      "focus:outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-glow",
      "transition-all duration-150",
      hasError && "border-danger"
    );

  return (
    <div className="flex flex-col gap-4">
      {/* Card Name */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="card-name" className="text-sm font-medium text-text-secondary">
          Card Name <span className="text-danger">*</span>
        </label>
        <input
          id="card-name"
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((p) => ({ ...p, name: "" })); }}
          placeholder="e.g. ENBD Platinum Card"
          className={inputCn(!!errors.name)}
        />
        {errors.name && <p className="text-xs text-danger">{errors.name}</p>}
      </div>

      {/* Bank */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="card-bank" className="text-sm font-medium text-text-secondary">
          Bank <span className="text-danger">*</span>
        </label>
        <input
          id="card-bank"
          type="text"
          value={bank}
          onChange={(e) => { setBank(e.target.value); if (errors.bank) setErrors((p) => ({ ...p, bank: "" })); }}
          placeholder="e.g. Emirates NBD"
          className={inputCn(!!errors.bank)}
        />
        {errors.bank && <p className="text-xs text-danger">{errors.bank}</p>}
      </div>

      {/* Last Four + Credit Limit row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="card-last-four" className="text-sm font-medium text-text-secondary">
            Last 4 Digits
          </label>
          <input
            id="card-last-four"
            type="text"
            maxLength={4}
            value={lastFour}
            onChange={(e) => { setLastFour(e.target.value.replace(/\D/g, "").slice(0, 4)); if (errors.lastFour) setErrors((p) => ({ ...p, lastFour: "" })); }}
            placeholder="1234"
            className={inputCn(!!errors.lastFour)}
          />
          {errors.lastFour && <p className="text-xs text-danger">{errors.lastFour}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="card-limit" className="text-sm font-medium text-text-secondary">
            Credit Limit ({getCurrency()})
          </label>
          <input
            id="card-limit"
            type="number"
            step="1000"
            min="0"
            value={creditLimit}
            onChange={(e) => { setCreditLimit(e.target.value); if (errors.creditLimit) setErrors((p) => ({ ...p, creditLimit: "" })); }}
            placeholder="Optional"
            className={cn(inputCn(!!errors.creditLimit), "font-mono tabular-nums")}
          />
          {errors.creditLimit && <p className="text-xs text-danger">{errors.creditLimit}</p>}
        </div>
      </div>

      {/* Billing Cycle */}
      <div>
        <p className="text-sm font-medium text-text-secondary mb-2">
          Billing Cycle <span className="text-danger">*</span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="card-cycle-start" className="text-xs text-text-muted">
              Cycle Start Day
            </label>
            <input
              id="card-cycle-start"
              type="number"
              min="1"
              max="31"
              value={cycleStart}
              onChange={(e) => { setCycleStart(e.target.value); if (errors.cycleStart) setErrors((p) => ({ ...p, cycleStart: "" })); }}
              placeholder="1"
              className={inputCn(!!errors.cycleStart)}
            />
            {errors.cycleStart && <p className="text-xs text-danger">{errors.cycleStart}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="card-cycle-end" className="text-xs text-text-muted">
              Cycle End Day
            </label>
            <input
              id="card-cycle-end"
              type="number"
              min="1"
              max="31"
              value={cycleEnd}
              onChange={(e) => { setCycleEnd(e.target.value); if (errors.cycleEnd) setErrors((p) => ({ ...p, cycleEnd: "" })); }}
              placeholder="31"
              className={inputCn(!!errors.cycleEnd)}
            />
            {errors.cycleEnd && <p className="text-xs text-danger">{errors.cycleEnd}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="card-statement" className="text-xs text-text-muted">
              Statement Day
            </label>
            <input
              id="card-statement"
              type="number"
              min="1"
              max="31"
              value={statementDay}
              onChange={(e) => { setStatementDay(e.target.value); if (errors.statementDay) setErrors((p) => ({ ...p, statementDay: "" })); }}
              placeholder="9"
              className={inputCn(!!errors.statementDay)}
            />
            {errors.statementDay && <p className="text-xs text-danger">{errors.statementDay}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="card-due" className="text-xs text-text-muted">
              Due Day
            </label>
            <input
              id="card-due"
              type="number"
              min="1"
              max="31"
              value={dueDay}
              onChange={(e) => { setDueDay(e.target.value); if (errors.dueDay) setErrors((p) => ({ ...p, dueDay: "" })); }}
              placeholder="3"
              className={inputCn(!!errors.dueDay)}
            />
            {errors.dueDay && <p className="text-xs text-danger">{errors.dueDay}</p>}
          </div>
        </div>
      </div>

      {/* Aliases */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="card-aliases" className="text-sm font-medium text-text-secondary">
          NLP Aliases
        </label>
        <textarea
          id="card-aliases"
          value={aliasesText}
          onChange={(e) => setAliasesText(e.target.value)}
          placeholder="e.g. fab, fab card, fab indulge, indulge"
          rows={2}
          className={cn(
            inputCn(false),
            "resize-none text-sm"
          )}
        />
        <p className="text-xs text-text-muted">
          Comma-separated shortcuts for Quick Add. Auto-generated if left empty on create.
        </p>
      </div>

      {/* Color Picker */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-secondary">Card Color</label>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn(
                "h-8 w-8 rounded-full border-2 transition-all duration-150",
                color === c
                  ? "border-text-primary scale-110"
                  : "border-transparent hover:border-border-hover"
              )}
              style={{ backgroundColor: c }}
              aria-label={`Color ${c}`}
            />
          ))}
          <div className="flex items-center gap-1.5 ml-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
              aria-label="Custom color"
            />
            <span className="text-xs text-text-muted font-mono">{color}</span>
          </div>
        </div>
      </div>

      {/* Preview strip */}
      <div
        className="h-2 rounded-full transition-all duration-150"
        style={{ backgroundColor: color }}
      />

      {/* Form error */}
      {errors.form && <p className="text-sm text-danger">{errors.form}</p>}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Saving...
            </>
          ) : mode === "edit" ? (
            "Update Card"
          ) : (
            "Add Card"
          )}
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

export { CardForm, type CardFormProps, type CardFormData };
