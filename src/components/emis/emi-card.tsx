"use client";

import { cn, formatAmount } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Pencil, CheckCircle2, Calendar, Sparkles } from "lucide-react";

interface EmiCardData {
  id: number;
  cardName: string;
  cardColor: string | null;
  cardLastFour: string | null;
  description: string;
  originalAmount: number;
  monthlyAmount: number;
  totalMonths: number;
  monthsRemaining: number;
  monthsPaid: number;
  startDate: string;
  endDate: string | null;
  categoryName: string | null;
  subcategoryName: string | null;
  isActive: number;
  autoGenerate: number;
  progress: number;
}

interface EmiCardProps {
  emi: EmiCardData;
  onEdit: (id: number) => void;
  onMarkComplete: (id: number) => void;
}

/**
 * Generates an array of "orb" data for the visual timeline.
 * Each orb represents one month of the EMI tenure.
 */
function generateOrbs(totalMonths: number, monthsPaid: number) {
  const orbs = [];
  for (let i = 0; i < totalMonths; i++) {
    const isPaid = i < monthsPaid;
    const isCurrent = i === monthsPaid;
    const isUpcoming = i === monthsPaid + 1;
    orbs.push({ index: i, isPaid, isCurrent, isUpcoming });
  }
  return orbs;
}

function getCompletionDate(endDate: string | null): string {
  if (!endDate) return "—";
  const d = new Date(endDate + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function EmiCard({ emi, onEdit, onMarkComplete }: EmiCardProps) {
  const cardColor = emi.cardColor || "#7EB89E";
  const orbs = generateOrbs(emi.totalMonths, emi.monthsPaid);
  const amountPaid = emi.monthlyAmount * emi.monthsPaid;
  const amountRemaining = emi.monthlyAmount * emi.monthsRemaining;

  // Dynamic gradient based on progress
  const progressColor = emi.progress >= 75
    ? "#7DD3A8" // success mint
    : emi.progress >= 40
      ? "#D4B878" // warning gold
      : cardColor;

  return (
    <div className={cn(
      "group relative overflow-hidden rounded-card border transition-all duration-300",
      emi.isActive
        ? "border-border hover:border-border-hover hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/10 bg-surface-1"
        : "border-border/40 bg-surface-1/40 opacity-70"
    )}>
      {/* Ambient glow behind card — subtle radial gradient */}
      <div
        className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full opacity-[0.04] blur-3xl transition-opacity duration-500 group-hover:opacity-[0.08]"
        style={{ backgroundColor: cardColor }}
      />

      {/* Top accent with gradient */}
      <div
        className="h-1 w-full"
        style={{
          background: `linear-gradient(90deg, ${cardColor}, ${progressColor})`,
        }}
      />

      <div className="p-5">
        {/* Header: Description + Card */}
        <div className="flex items-start justify-between mb-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-text-primary truncate">
              {emi.description}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <CreditCard size={12} style={{ color: cardColor }} />
              <span className="text-sm text-text-secondary">{emi.cardName}</span>
              {emi.cardLastFour && (
                <span className="font-mono text-xs text-text-muted">····{emi.cardLastFour}</span>
              )}
            </div>
          </div>
          {!emi.isActive && (
            <Badge variant="category" className="shrink-0 ml-2 bg-success/15 text-success">
              Completed
            </Badge>
          )}
        </div>

        {/* Amount hero section */}
        <div className="mb-5 flex items-baseline gap-3">
          <span className="font-mono text-2xl font-bold tabular-nums text-text-primary">
            {formatAmount(emi.monthlyAmount)}
          </span>
          <span className="text-sm text-text-muted">/ month</span>
        </div>

        {/* ── Orb Timeline ────────────────────────────────────────
          Visual representation of each installment as gradient spheres
          Paid = solid colored, Current = pulsing, Future = dim
        */}
        <div className="mb-5">
          <div className="flex items-center gap-1 flex-wrap">
            {orbs.map((orb) => {
              // Size: current orb is bigger, paid are normal, future are smaller
              const size = orb.isCurrent ? "h-4 w-4" : orb.isPaid ? "h-3 w-3" : "h-2.5 w-2.5";

              return (
                <div
                  key={orb.index}
                  className={cn(
                    "rounded-full transition-all duration-300 shrink-0",
                    size,
                    orb.isPaid && "shadow-sm",
                    orb.isCurrent && "animate-pulse",
                  )}
                  style={{
                    background: orb.isPaid
                      ? `linear-gradient(135deg, ${cardColor}, ${progressColor})`
                      : orb.isCurrent
                        ? `linear-gradient(135deg, ${progressColor}, ${cardColor})`
                        : undefined,
                    boxShadow: orb.isCurrent
                      ? `0 0 0 2px var(--surface-1, #1A1F2E), 0 0 0 4px ${progressColor}`
                      : undefined,
                    backgroundColor: !orb.isPaid && !orb.isCurrent
                      ? orb.isUpcoming
                        ? `${cardColor}30`
                        : "#2A3145"
                      : undefined,
                  }}
                  title={
                    orb.isPaid
                      ? `Month ${orb.index + 1}: Paid`
                      : orb.isCurrent
                        ? `Month ${orb.index + 1}: Current`
                        : `Month ${orb.index + 1}: Upcoming`
                  }
                />
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-text-muted">
              {emi.monthsPaid} of {emi.totalMonths} paid
            </span>
            <span className="text-xs font-medium" style={{ color: progressColor }}>
              {emi.progress}%
            </span>
          </div>
        </div>

        {/* ── Separator with progress bar ────────────────────── */}
        <div className="relative mb-5">
          <div className="h-px bg-border" />
          <div
            className="absolute top-0 left-0 h-px transition-all duration-500"
            style={{
              width: `${emi.progress}%`,
              background: `linear-gradient(90deg, ${cardColor}, ${progressColor})`,
            }}
          />
        </div>

        {/* Financial breakdown */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-input bg-surface-2/60 border border-border/40 p-3">
            <p className="text-xs text-text-muted mb-0.5">Paid</p>
            <p className="font-mono text-sm font-semibold tabular-nums text-success">
              {formatAmount(amountPaid)}
            </p>
          </div>
          <div className="rounded-input bg-surface-2/60 border border-border/40 p-3">
            <p className="text-xs text-text-muted mb-0.5">Remaining</p>
            <p className="font-mono text-sm font-semibold tabular-nums text-text-primary">
              {formatAmount(amountRemaining)}
            </p>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-4 text-xs text-text-muted">
          {emi.categoryName && (
            <span>
              {emi.categoryName}
              {emi.subcategoryName && ` > ${emi.subcategoryName}`}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar size={10} />
            Completes: {getCompletionDate(emi.endDate)}
          </span>
          {emi.autoGenerate === 1 && (
            <span className="flex items-center gap-1 text-sage-400">
              <Sparkles size={10} />
              Auto-generate ON
            </span>
          )}
        </div>

        {/* Original amount (subtle) */}
        <div className="text-xs text-text-muted mb-4">
          Original: <span className="font-mono tabular-nums">{formatAmount(emi.originalAmount)}</span>
        </div>

        {/* Actions */}
        {emi.isActive === 1 && (
          <div className="flex items-center gap-2 pt-3 border-t border-border/40">
            <button
              onClick={() => onEdit(emi.id)}
              className="inline-flex items-center gap-1.5 rounded-button px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-all duration-150"
              aria-label="Edit EMI"
            >
              <Pencil size={12} />
              Edit
            </button>
            <button
              onClick={() => onMarkComplete(emi.id)}
              className="inline-flex items-center gap-1.5 rounded-button px-2.5 py-1.5 text-xs font-medium text-text-muted hover:text-success hover:bg-success/10 transition-all duration-150"
              aria-label="Mark complete"
            >
              <CheckCircle2 size={12} />
              Mark Complete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export { EmiCard, type EmiCardData, type EmiCardProps };
