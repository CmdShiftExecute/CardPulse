"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { getCurrency } from "@/lib/format";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultYear: number;
  defaultMonth: number;
}

function ExportModal({ isOpen, onClose, defaultYear, defaultMonth }: ExportModalProps) {
  const now = new Date();
  const [year, setYear] = useState(defaultYear);
  const [month, setMonth] = useState(defaultMonth);
  const [conversionRate, setConversionRate] = useState("1");
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build month options
  const monthOptions: { value: string; label: string }[] = [];
  for (let m = 1; m <= 12; m++) {
    monthOptions.push({ value: String(m), label: MONTH_NAMES[m - 1] });
  }

  // Build year options (last 3 years)
  const yearOptions: { value: string; label: string }[] = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 2; y--) {
    yearOptions.push({ value: String(y), label: String(y) });
  }

  async function handleExport() {
    setExporting(true);
    setError(null);

    try {
      const rate = parseFloat(conversionRate) || 1;
      const url = `/api/export?year=${year}&month=${month}&rate=${rate}`;
      const res = await fetch(url);

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: "Export failed" }));
        throw new Error(errJson.error || "Export failed");
      }

      // Download the file
      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `CardPulse_${MONTH_NAMES[month - 1]}_${year}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Report">
      <div className="flex flex-col gap-5">
        {/* Icon + description */}
        <div className="flex items-center gap-3 rounded-input border border-border/50 bg-surface-3/30 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-sage-400/10 shrink-0">
            <FileSpreadsheet size={20} className="text-sage-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">Monthly Expense Report</p>
            <p className="text-xs text-text-muted">
              Exports a formatted .xlsx file with categories, labels, and totals
            </p>
          </div>
        </div>

        {/* Month / Year selectors */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="export-month" className="text-sm font-medium text-text-secondary">
              Month
            </label>
            <select
              id="export-month"
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value, 10))}
              className="w-full appearance-none rounded-input bg-surface-2 border border-border px-3 py-2 text-base text-text-primary focus:outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-glow transition-all duration-150"
            >
              {monthOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="export-year" className="text-sm font-medium text-text-secondary">
              Year
            </label>
            <select
              id="export-year"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="w-full appearance-none rounded-input bg-surface-2 border border-border px-3 py-2 text-base text-text-primary focus:outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-glow transition-all duration-150"
            >
              {yearOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Conversion rate */}
        <Input
          id="export-rate"
          label="Conversion Rate"
          type="number"
          placeholder="1"
          value={conversionRate}
          onChange={(e) => setConversionRate(e.target.value)}
          min="0.01"
          step="0.01"
          className="font-mono"
        />
        <p className="text-[10px] text-text-muted -mt-3">
          Used for reference only. Set to 1 for {getCurrency()} (default).
        </p>

        {/* Error */}
        {error && (
          <p className="text-xs text-danger">{error}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <Button onClick={handleExport} disabled={exporting} className="flex-1">
            {exporting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download size={16} />
                Download Report
              </>
            )}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export { ExportModal };
