"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  CreditCard,
  Wallet,
  Settings as SettingsIcon,
  Info,
} from "lucide-react";
import { cn, formatAmount, getCurrency } from "@/lib/utils";
import { CountUp } from "@/components/ui/count-up";
import {
  MoodFace,
  ratioToMood,
  moodColorClass,
  moodLabel,
  moodCopy,
  type MoodLevel,
} from "./mood-face";

/** Shape of card cycle data passed in from the dashboard. */
interface CardCycleData {
  cardId: number;
  cardName: string;
  lastFour: string | null;
  color: string | null;
  cycleSpend: number;     // current cycle's regular purchases (already billed-side)
  emiMonthly: number;     // EMI installments charged in current cycle for this card
}

interface FixedCost {
  id: number;
  name: string;
  monthlyAmount: number;
}

interface FinancialHealthCardProps {
  cards: CardCycleData[];
}

export function FinancialHealthCard({ cards }: FinancialHealthCardProps) {
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [income, setIncome] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [fcRes, settingsRes] = await Promise.all([
          fetch("/api/fixed-costs").then((r) => r.json()),
          fetch("/api/settings").then((r) => r.json()),
        ]);
        if (fcRes?.success) setFixedCosts(fcRes.data);
        if (settingsRes?.success) {
          const raw = settingsRes.data?.household_income;
          const parsed = raw ? parseFloat(raw) : NaN;
          if (Number.isFinite(parsed) && parsed > 0) setIncome(parsed);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* ── Derived metrics ────────────────────────────────── */

  const perCardOutstanding = useMemo(
    () =>
      [...cards]
        .map((c) => ({
          ...c,
          outstanding: (c.cycleSpend || 0) + (c.emiMonthly || 0),
        }))
        .sort((a, b) => b.outstanding - a.outstanding),
    [cards]
  );

  const totalCardBills = useMemo(
    () => perCardOutstanding.reduce((s, c) => s + c.outstanding, 0),
    [perCardOutstanding]
  );

  const totalEmiThisCycle = useMemo(
    () => cards.reduce((s, c) => s + (c.emiMonthly || 0), 0),
    [cards]
  );

  const totalFixedCosts = useMemo(
    () => fixedCosts.reduce((s, f) => s + f.monthlyAmount, 0),
    [fixedCosts]
  );

  /**
   * Next-month cash-out. EMI is already inside card bills (this cycle's installments
   * are part of cycleSpend/emiMonthly), so we do NOT add it again. We surface EMI
   * as an informational sub-row so the user can see how much of card debt is EMI.
   */
  const totalNeeded = totalCardBills + totalFixedCosts;

  const ratio = income && income > 0 ? totalNeeded / income : 0;
  const ratioPct = ratio * 100;
  const mood: MoodLevel = income && income > 0 ? ratioToMood(ratio) : "neutral";
  const moodCls = moodColorClass(mood);
  const incomeSet = income !== null && income > 0;

  /* ── Render ─────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="h-44 rounded-card border border-border bg-surface-1 animate-pulse" />
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="relative overflow-hidden rounded-card border border-border bg-surface-1"
    >
      {/* Top accent — color shifts with mood */}
      <div
        className={cn(
          "h-1 w-full bg-gradient-to-r",
          mood === "ecstatic" && "from-success via-sage-300 to-seafoam-400",
          mood === "happy" && "from-sage-400 via-seafoam-400 to-sage-300",
          mood === "neutral" && "from-seafoam-400 via-sand-400 to-seafoam-300",
          mood === "concerned" && "from-sand-400 via-warning to-sand-300",
          mood === "sad" && "from-warning via-danger to-warning",
          mood === "crying" && "from-danger via-danger to-warning"
        )}
      />

      <div className="p-5 md:p-6">
        {/* ─── Top row: Mood + headline + composition ─── */}
        <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-6">
          {/* Left: Mood face — uses currentColor → theme-aware */}
          <div className={cn("shrink-0 flex flex-col items-center md:items-start gap-2", moodCls)}>
            <MoodFace level={mood} size={88} animate={mood === "crying" || mood === "sad"} />
            <span className="text-xs font-semibold uppercase tracking-wider">
              {moodLabel(mood)}
            </span>
          </div>

          {/* Middle/right: headline + composition */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={12} className="text-text-muted" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
                Required to survive next month
              </span>
            </div>

            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-base font-medium text-text-muted">{getCurrency()}</span>
              <CountUp
                value={totalNeeded}
                decimals={2}
                duration={900}
                className="font-mono text-3xl md:text-4xl font-bold tabular-nums text-text-primary tracking-tight leading-none"
              />
            </div>

            {/* Ratio sub-line */}
            <div className="mt-2">
              {incomeSet ? (
                <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                  <span className={cn("font-mono font-semibold tabular-nums", moodCls)}>
                    {ratioPct.toFixed(0)}%
                  </span>
                  <span>of your</span>
                  <span className="font-mono font-medium tabular-nums text-text-primary">
                    {formatAmount(income!)}
                  </span>
                  <span>income</span>
                  <span className="text-text-muted">·</span>
                  <span className="text-text-muted">{moodCopy(mood, ratioPct)}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs">
                  <Info size={12} className="text-warning shrink-0" />
                  <span className="text-text-secondary">
                    Set your household income to see your financial-health score.
                  </span>
                  <Link
                    href="/settings?section=general"
                    className="inline-flex items-center gap-1 text-sage-300 hover:text-sage-400 font-medium"
                  >
                    <SettingsIcon size={11} />
                    Set income
                  </Link>
                </div>
              )}
            </div>

            {/* Ratio progress bar (only when income is set) */}
            {incomeSet && (
              <div className="mt-3">
                <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, ratioPct)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={cn(
                      "h-full rounded-full",
                      mood === "ecstatic" && "bg-success",
                      mood === "happy" && "bg-sage-400",
                      mood === "neutral" && "bg-sand-400",
                      mood === "concerned" && "bg-warning",
                      (mood === "sad" || mood === "crying") && "bg-danger"
                    )}
                  />
                  {/* Indicator that ratio exceeded 100% */}
                  {ratio > 1 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="absolute inset-0 flex items-center justify-end pr-2"
                    >
                      <span className="text-[9px] font-bold text-text-on-accent uppercase tracking-wider">
                        Overdrawn
                      </span>
                    </motion.div>
                  )}
                </div>
                <div className="flex justify-between text-[10px] text-text-muted mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100% income</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Composition row ─── */}
        <div className="mt-5 pt-5 border-t border-border/40 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <CompositionCell
            icon={<CreditCard size={12} />}
            label="Card bills next month"
            value={totalCardBills}
            color="#7EB89E"
            sub={
              totalEmiThisCycle > 0
                ? `incl. ${formatAmount(totalEmiThisCycle)} EMI`
                : undefined
            }
          />
          <CompositionCell
            icon={<Wallet size={12} />}
            label="Fixed monthly costs"
            value={totalFixedCosts}
            color="#C4AA78"
            sub={
              fixedCosts.length === 0
                ? "Not configured"
                : `${fixedCosts.length} item${fixedCosts.length !== 1 ? "s" : ""}`
            }
            href={fixedCosts.length === 0 ? "/settings?section=fixed-costs" : undefined}
          />
          <CompositionCell
            icon={<TrendingUp size={12} />}
            label="Total cash required"
            value={totalNeeded}
            color="#6BB0A8"
            highlight
          />
        </div>

        {/* ─── Per-card outstanding strip ─── */}
        {perCardOutstanding.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="h-3 w-1 rounded-full bg-gradient-to-b from-sage-400 to-seafoam-400" />
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                Per-card outstanding
              </h3>
              <span className="text-[10px] text-text-muted">
                ({perCardOutstanding.length} card{perCardOutstanding.length !== 1 ? "s" : ""})
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {perCardOutstanding.map((c, i) => (
                <motion.div
                  key={c.cardId}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.05 + 0.04 * i }}
                  className="relative overflow-hidden rounded-input border border-border bg-surface-2/40 hover:bg-surface-2/80 transition-all p-2.5"
                >
                  {/* Color strip */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-0.5"
                    style={{ background: c.color || "#7EB89E" }}
                  />
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ background: c.color || "#7EB89E" }}
                    />
                    <span className="text-[11px] font-medium text-text-secondary truncate">
                      {c.cardName.replace(/ Card$/, "")}
                    </span>
                  </div>
                  <div className="font-mono text-sm font-bold tabular-nums text-text-primary leading-tight">
                    {formatAmount(c.outstanding)}
                  </div>
                  {c.emiMonthly > 0 && (
                    <div className="text-[10px] text-text-muted mt-0.5 truncate">
                      EMI: {formatAmount(c.emiMonthly)}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}

/* ── Composition sub-cell ───────────────────────────────── */

function CompositionCell({
  icon,
  label,
  value,
  color,
  sub,
  highlight,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  sub?: string;
  highlight?: boolean;
  href?: string;
}) {
  const inner = (
    <div
      className={cn(
        "rounded-input border p-3 transition-all h-full",
        highlight
          ? "border-sage-400/40 bg-sage-400/5"
          : "border-border bg-surface-2/40 hover:bg-surface-2/70"
      )}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span style={{ color }}>{icon}</span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted truncate">
          {label}
        </span>
      </div>
      <div className="font-mono text-base font-bold tabular-nums text-text-primary">
        {formatAmount(value)}
      </div>
      {sub && (
        <div className="text-[10px] text-text-muted mt-0.5 truncate">{sub}</div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block hover:opacity-90 transition-opacity">
        {inner}
      </Link>
    );
  }
  return inner;
}
