"use client";

import { formatAmount, cn } from "@/lib/utils";
import { Calendar, Clock, Layers, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

interface EmiLandscapeItem {
  id: number;
  description: string;
  cardId: number;
  cardName: string;
  cardColor: string;
  monthlyAmount: number;
  originalAmount: number;
  totalMonths: number;
  monthsRemaining: number;
  monthsPaid: number;
  progress: number;
  startDate: string;
  endDate: string | null;
  categoryName: string | null;
  isActive: number;
}

interface EmiLandscapeProps {
  data: EmiLandscapeItem[];
}

/** Classify EMI by remaining months */
function getTimeClass(monthsRemaining: number): { label: string; color: string } {
  if (monthsRemaining <= 3) return { label: "Ending Soon", color: "#7DD3A8" };
  if (monthsRemaining <= 6) return { label: "Mid-Term", color: "#D4B878" };
  return { label: "Long-Term", color: "#C87070" };
}

/** Classify EMI by amount relative to max */
function getSizeClass(amount: number, maxAmount: number): "large" | "medium" | "small" {
  if (maxAmount === 0) return "medium";
  const ratio = amount / maxAmount;
  if (ratio >= 0.6) return "large";
  if (ratio >= 0.25) return "medium";
  return "small";
}

function getOrbDimensions(sizeClass: "large" | "medium" | "small"): { w: number; h: number } {
  switch (sizeClass) {
    case "large": return { w: 100, h: 100 };
    case "medium": return { w: 72, h: 72 };
    case "small": return { w: 52, h: 52 };
  }
}

function formatEndDate(endDate: string | null): string {
  if (!endDate) return "—";
  const d = new Date(endDate + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function EmiOrb({
  emi,
  maxAmount,
  index,
}: {
  emi: EmiLandscapeItem;
  maxAmount: number;
  index: number;
}) {
  const sizeClass = getSizeClass(emi.monthlyAmount, maxAmount);
  const dims = getOrbDimensions(sizeClass);
  const timeClass = getTimeClass(emi.monthsRemaining);
  const isCompleted = emi.isActive === 0;

  // The orb fill represents progress
  const fillHeight = Math.round((emi.progress / 100) * dims.h);

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 300, damping: 20 }}
      className="group relative flex flex-col items-center"
    >
      {/* The orb */}
      <div
        className={cn(
          "relative rounded-full overflow-hidden transition-transform duration-200 hover:scale-105",
          isCompleted && "opacity-40"
        )}
        style={{
          width: dims.w,
          height: dims.h,
          background: `${emi.cardColor}15`,
          border: `2px solid ${emi.cardColor}40`,
        }}
      >
        {/* Fill from bottom (progress) */}
        <div
          className="absolute bottom-0 left-0 right-0 transition-all duration-500"
          style={{
            height: fillHeight,
            background: `linear-gradient(180deg, ${emi.cardColor}60, ${emi.cardColor}30)`,
          }}
        />
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-mono text-xs font-bold tabular-nums"
            style={{ color: emi.cardColor, fontSize: sizeClass === "small" ? 10 : 12 }}
          >
            {emi.monthlyAmount >= 1000
              ? `${(emi.monthlyAmount / 1000).toFixed(1)}k`
              : emi.monthlyAmount.toFixed(0)}
          </span>
          {sizeClass !== "small" && (
            <span className="text-[9px] text-text-muted">/mo</span>
          )}
        </div>
      </div>

      {/* Label below orb */}
      <div className="mt-2 text-center max-w-[100px]">
        <p className="text-[10px] font-medium text-text-secondary truncate">{emi.description}</p>
        <p className="text-[9px] text-text-muted">{emi.monthsRemaining}mo left</p>
      </div>

      {/* Hover card */}
      <div className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20">
        <div className="rounded-card border border-border-hover bg-surface-3 px-4 py-3 shadow-xl whitespace-nowrap min-w-[200px]">
          <p className="text-sm font-semibold text-text-primary mb-1">{emi.description}</p>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: emi.cardColor }} />
            <span className="text-xs text-text-secondary">{emi.cardName}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-text-muted">Monthly</p>
              <p className="font-mono font-semibold tabular-nums text-text-primary">{formatAmount(emi.monthlyAmount)}</p>
            </div>
            <div>
              <p className="text-text-muted">Original</p>
              <p className="font-mono tabular-nums text-text-secondary">{formatAmount(emi.originalAmount)}</p>
            </div>
            <div>
              <p className="text-text-muted">Progress</p>
              <p className="font-mono tabular-nums" style={{ color: timeClass.color }}>{emi.progress}%</p>
            </div>
            <div>
              <p className="text-text-muted">Ends</p>
              <p className="text-text-secondary">{formatEndDate(emi.endDate)}</p>
            </div>
          </div>
          {emi.categoryName && (
            <p className="text-[10px] text-text-muted mt-2 border-t border-border/30 pt-1.5">{emi.categoryName}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function EmiLandscape({ data }: EmiLandscapeProps) {
  const activeEmis = data.filter((e) => e.isActive === 1);
  const completedEmis = data.filter((e) => e.isActive === 0);
  const maxAmount = activeEmis.length > 0
    ? Math.max(...activeEmis.map((e) => e.monthlyAmount))
    : 1;

  const totalMonthly = activeEmis.reduce((s, e) => s + e.monthlyAmount, 0);
  const totalRemaining = activeEmis.reduce((s, e) => s + e.monthlyAmount * e.monthsRemaining, 0);

  // Group by card
  const cardGroups: Record<string, { cardName: string; cardColor: string; emis: EmiLandscapeItem[] }> = {};
  for (const emi of activeEmis) {
    if (!cardGroups[emi.cardName]) {
      cardGroups[emi.cardName] = { cardName: emi.cardName, cardColor: emi.cardColor, emis: [] };
    }
    cardGroups[emi.cardName].emis.push(emi);
  }

  // Sort EMIs within each card group: largest first (verticality = importance)
  for (const group of Object.values(cardGroups)) {
    group.emis.sort((a, b) => b.monthlyAmount - a.monthlyAmount);
  }

  // Time-based classification for the timeline row
  const endingSoon = activeEmis.filter((e) => e.monthsRemaining <= 3).sort((a, b) => a.monthsRemaining - b.monthsRemaining);
  const midTerm = activeEmis.filter((e) => e.monthsRemaining > 3 && e.monthsRemaining <= 6).sort((a, b) => a.monthsRemaining - b.monthsRemaining);
  const longTerm = activeEmis.filter((e) => e.monthsRemaining > 6).sort((a, b) => a.monthsRemaining - b.monthsRemaining);

  if (data.length === 0) {
    return (
      <div className="rounded-card border border-border bg-surface-1 p-6 text-center">
        <div className="flex flex-col items-center py-8">
          <div className="h-14 w-14 rounded-full bg-surface-3 flex items-center justify-center mb-3">
            <Layers size={24} className="text-text-muted/40" />
          </div>
          <p className="text-sm text-text-muted">No EMIs recorded yet</p>
        </div>
      </div>
    );
  }

  let orbIndex = 0;

  return (
    <div className="space-y-6">
      {/* Summary strip */}
      <div className="rounded-card border border-border bg-surface-1 p-5 max-md:p-4">
        <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
          <div className="text-center">
            <p className="text-xs text-text-muted mb-1">Monthly EMI Burden</p>
            <p className="font-mono text-xl font-bold tabular-nums text-sand-400">
              {formatAmount(totalMonthly)}
            </p>
            <p className="text-xs text-text-muted mt-0.5">{activeEmis.length} active EMI{activeEmis.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="text-center border-x border-border/40 max-md:border-x-0 max-md:border-y max-md:py-3">
            <p className="text-xs text-text-muted mb-1">Total Remaining</p>
            <p className="font-mono text-xl font-bold tabular-nums text-text-primary">
              {formatAmount(totalRemaining)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-text-muted mb-1">Next Completing</p>
            {endingSoon.length > 0 ? (
              <div>
                <p className="text-sm font-medium text-success">{endingSoon[0].description}</p>
                <p className="text-xs text-text-muted mt-0.5 flex items-center justify-center gap-1">
                  <Clock size={10} /> {endingSoon[0].monthsRemaining} month{endingSoon[0].monthsRemaining !== 1 ? "s" : ""} left
                </p>
              </div>
            ) : (
              <p className="text-sm text-text-muted">—</p>
            )}
          </div>
        </div>
      </div>

      {/* Card-grouped orb view */}
      <div className="rounded-card border border-border bg-surface-1 p-6 max-md:p-4">
        <h3 className="text-lg font-semibold text-text-primary mb-6">EMI Distribution by Card</h3>
        <div className="space-y-8">
          {Object.values(cardGroups).map((group) => (
            <div key={group.cardName}>
              {/* Card header */}
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: group.cardColor }}
                />
                <span className="text-sm font-medium text-text-secondary">{group.cardName}</span>
                <span className="text-xs text-text-muted">
                  ({group.emis.length} EMI{group.emis.length !== 1 ? "s" : ""} — {formatAmount(group.emis.reduce((s, e) => s + e.monthlyAmount, 0))}/mo)
                </span>
              </div>
              {/* Orbs */}
              <div className="flex flex-wrap items-end gap-4 pl-5">
                {group.emis.map((emi) => {
                  const idx = orbIndex++;
                  return (
                    <EmiOrb key={emi.id} emi={emi} maxAmount={maxAmount} index={idx} />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time horizon view */}
      <div className="rounded-card border border-border bg-surface-1 p-6 max-md:p-4">
        <h3 className="text-lg font-semibold text-text-primary mb-6">EMI Timeline Horizon</h3>
        <div className="space-y-6">
          {/* Ending Soon */}
          {endingSoon.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown size={14} className="text-success" />
                <span className="text-sm font-medium text-success">Ending Soon</span>
                <span className="text-xs text-text-muted">(1–3 months)</span>
              </div>
              <div className="flex flex-wrap items-end gap-4 pl-5">
                {endingSoon.map((emi, i) => (
                  <EmiOrb key={emi.id} emi={emi} maxAmount={maxAmount} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Separator */}
          {endingSoon.length > 0 && (midTerm.length > 0 || longTerm.length > 0) && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gradient-to-r from-success/30 via-warning/30 to-transparent" />
            </div>
          )}

          {/* Mid-term */}
          {midTerm.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={14} className="text-warning" />
                <span className="text-sm font-medium text-warning">Mid-Term</span>
                <span className="text-xs text-text-muted">(4–6 months)</span>
              </div>
              <div className="flex flex-wrap items-end gap-4 pl-5">
                {midTerm.map((emi, i) => (
                  <EmiOrb key={emi.id} emi={emi} maxAmount={maxAmount} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Separator */}
          {midTerm.length > 0 && longTerm.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gradient-to-r from-warning/30 via-danger/30 to-transparent" />
            </div>
          )}

          {/* Long-term */}
          {longTerm.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Layers size={14} className="text-danger" />
                <span className="text-sm font-medium text-danger">Long-Term</span>
                <span className="text-xs text-text-muted">(6+ months)</span>
              </div>
              <div className="flex flex-wrap items-end gap-4 pl-5">
                {longTerm.map((emi, i) => (
                  <EmiOrb key={emi.id} emi={emi} maxAmount={maxAmount} index={i} />
                ))}
              </div>
            </div>
          )}

          {activeEmis.length === 0 && (
            <p className="text-xs text-text-muted text-center py-4">All EMIs completed</p>
          )}
        </div>
      </div>

      {/* Completed EMIs */}
      {completedEmis.length > 0 && (
        <div className="rounded-card border border-border/50 bg-surface-1/50 p-5 max-md:p-4">
          <h4 className="text-sm font-medium text-text-muted mb-3">
            Completed ({completedEmis.length})
          </h4>
          <div className="flex flex-wrap items-end gap-3">
            {completedEmis.map((emi, i) => (
              <EmiOrb key={emi.id} emi={emi} maxAmount={maxAmount} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { EmiLandscape };
