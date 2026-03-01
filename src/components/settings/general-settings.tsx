"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";

const CURRENCIES = [
  "AED", "USD", "EUR", "GBP", "INR", "SAR", "QAR", "BHD", "KWD", "OMR",
  "EGP", "JOD", "LBP", "TRY", "PKR", "BDT", "LKR", "PHP", "MYR", "SGD",
  "AUD", "CAD", "JPY", "CNY", "CHF",
];

const DATE_FORMATS = [
  { value: "DD/MM", label: "DD/MM/YYYY", example: "01/03/2026" },
  { value: "MM/DD", label: "MM/DD/YYYY", example: "03/01/2026" },
];

const NUMBER_FORMATS = [
  { value: "comma_period", label: "1,234.56", description: "Comma thousands, period decimal" },
  { value: "period_comma", label: "1.234,56", description: "Period thousands, comma decimal" },
];

export function GeneralSettings() {
  const [currency, setCurrency] = useState("AED");
  const [customCurrency, setCustomCurrency] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [dateFormat, setDateFormat] = useState("DD/MM");
  const [numberFormat, setNumberFormat] = useState("comma_period");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const s = data.data;
          if (s.currency && CURRENCIES.includes(s.currency)) {
            setCurrency(s.currency);
          } else if (s.currency) {
            setUseCustom(true);
            setCustomCurrency(s.currency);
          }
          if (s.date_format) setDateFormat(s.date_format);
          if (s.number_format) setNumberFormat(s.number_format);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    try {
      const currencyValue = useCustom ? customCurrency.trim().toUpperCase() : currency;
      if (!currencyValue) {
        setSaving(false);
        return;
      }
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency: currencyValue,
          date_format: dateFormat,
          number_format: numberFormat,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        // Update client-side format cache
        const g = (window as unknown as Record<string, unknown>);
        g.__CP_FMT__ = {
          currency: currencyValue,
          numberFormat,
          dateFormat,
        };
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }, [currency, customCurrency, useCustom, dateFormat, numberFormat]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">General</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Currency, date format, and number format preferences.
        </p>
      </div>

      {/* Currency */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-text-primary">Currency</label>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input
              type="radio"
              checked={!useCustom}
              onChange={() => setUseCustom(false)}
              className="accent-sage-400"
            />
            Preset
          </label>
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input
              type="radio"
              checked={useCustom}
              onChange={() => setUseCustom(true)}
              className="accent-sage-400"
            />
            Custom
          </label>
        </div>
        {!useCustom ? (
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full max-w-xs rounded-button border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary focus:border-sage-400 focus:outline-none focus:ring-1 focus:ring-sage-400 [color-scheme:dark]"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c} className="bg-surface-2">
                {c}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={customCurrency}
            onChange={(e) => setCustomCurrency(e.target.value.slice(0, 5))}
            placeholder="e.g. BTC, NGN"
            className="w-full max-w-xs rounded-button border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-sage-400 focus:outline-none focus:ring-1 focus:ring-sage-400"
            maxLength={5}
          />
        )}
      </div>

      {/* Date Format */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-text-primary">Date Format</label>
        <div className="flex gap-3">
          {DATE_FORMATS.map((fmt) => (
            <button
              key={fmt.value}
              onClick={() => setDateFormat(fmt.value)}
              className={`rounded-button border px-4 py-2.5 text-sm transition-all ${
                dateFormat === fmt.value
                  ? "border-sage-400 bg-sage-400/10 text-sage-300"
                  : "border-border bg-surface-2 text-text-secondary hover:border-border-hover"
              }`}
            >
              <div className="font-medium">{fmt.label}</div>
              <div className="mt-0.5 text-xs opacity-70">{fmt.example}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Number Format */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-text-primary">Number Format</label>
        <div className="flex gap-3">
          {NUMBER_FORMATS.map((fmt) => (
            <button
              key={fmt.value}
              onClick={() => setNumberFormat(fmt.value)}
              className={`rounded-button border px-4 py-2.5 text-sm transition-all ${
                numberFormat === fmt.value
                  ? "border-sage-400 bg-sage-400/10 text-sage-300"
                  : "border-border bg-surface-2 text-text-secondary hover:border-border-hover"
              }`}
            >
              <div className="font-mono font-medium">{fmt.label}</div>
              <div className="mt-0.5 text-xs opacity-70">{fmt.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={handleSave} disabled={saving} size="md">
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
          ) : saved ? (
            <><Check className="h-4 w-4" /> Saved</>
          ) : (
            "Save Changes"
          )}
        </Button>
        {saved && (
          <span className="text-sm text-success">
            Settings saved. Reload pages to see changes.
          </span>
        )}
      </div>
    </div>
  );
}
