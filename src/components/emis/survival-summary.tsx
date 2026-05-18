"use client";

import { useState, useEffect, useMemo, useId } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import {
  Wallet,
  CreditCard,
  Home,
  ShoppingCart,
  Wifi,
  Pill,
  Zap,
  Calendar,
  TrendingDown,
  Settings as SettingsIcon,
  CheckCircle2,
  CalendarClock,
  type LucideIcon,
} from "lucide-react";
import { formatAmount, getCurrency } from "@/lib/utils";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { niceYDomain, formatYAxis } from "@/lib/chart-utils";
import { ChartTooltip } from "@/components/analytics/chart-tooltip";
import { CountUp } from "@/components/ui/count-up";
import { motion } from "framer-motion";

/* ── Types ─────────────────────────────────────────────── */

interface EmiData {
  id: number;
  description: string;
  monthlyAmount: number;
  totalMonths: number;
  monthsRemaining: number;
  startDate: string;
  lastGenerated: string | null;
  cardId: number;
  cardName: string;
  cardColor: string | null;
  isActive: number;
}

interface CardData {
  id: number;
  name: string;
  color: string | null;
  statementDay: number;
}

interface FixedCost {
  id: number;
  name: string;
  monthlyAmount: number;
  icon: string | null;
  color: string | null;
}

/* ── Icon map for fixed costs ──────────────────────────── */

const ICON_MAP: Record<string, LucideIcon> = {
  Home,
  Wifi,
  ShoppingCart,
  Pill,
  Zap,
  CreditCard,
  Wallet,
  Calendar,
};

function getIcon(name: string | null): LucideIcon {
  if (!name || !ICON_MAP[name]) return Wallet;
  return ICON_MAP[name];
}

/* ── Schedule computation ──────────────────────────────── */

interface ClosureEvent {
  date: Date;
  emi: EmiData;
  card: CardData;
}

/**
 * Computes the date of the EMI's final installment based on:
 *  - lastGenerated (if any) tells us which month already fired
 *  - monthsRemaining counts the unfired installments
 *  - card.statementDay is the cycle close date each month
 */
function computeLastInstallmentDate(emi: EmiData, card: CardData, today: Date): Date {
  const stmtDay = card.statementDay;
  let startYear: number;
  let startMonth: number; // 0-11

  if (emi.lastGenerated) {
    const [y, m] = emi.lastGenerated.split("-").map(Number);
    // Next fire is the month AFTER lastGenerated
    let nm = m; // 1-12 (m is the last fired month, so next is m+1; m as 0-11 = m+1-1 = m)
    let ny = y;
    if (nm > 11) {
      nm -= 12;
      ny += 1;
    }
    startYear = ny;
    startMonth = nm;
  } else {
    // No prior fire — next is the upcoming stmt close
    startYear = today.getFullYear();
    startMonth = today.getMonth();
    if (today.getDate() > stmtDay) {
      startMonth += 1;
      if (startMonth > 11) {
        startMonth -= 12;
        startYear += 1;
      }
    }
  }

  const lastIdx = Math.max(0, emi.monthsRemaining - 1);
  let lastYear = startYear;
  let lastMonth = startMonth + lastIdx;
  while (lastMonth > 11) {
    lastMonth -= 12;
    lastYear += 1;
  }

  const daysInLastMonth = new Date(lastYear, lastMonth + 1, 0).getDate();
  const day = Math.min(stmtDay, daysInLastMonth);
  return new Date(lastYear, lastMonth, day);
}

function ymKey(d: Date): number {
  return d.getFullYear() * 12 + d.getMonth();
}

/* ── Component ─────────────────────────────────────────── */

export function SurvivalSummary() {
  const colors = useThemeColors();
  const [emis, setEmis] = useState<EmiData[]>([]);
  const [cards, setCards] = useState<CardData[]>([]);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [emiRes, cardRes, fcRes] = await Promise.all([
          fetch("/api/emis").then((r) => r.json()),
          fetch("/api/cards").then((r) => r.json()),
          fetch("/api/fixed-costs").then((r) => r.json()),
        ]);
        if (emiRes.success) setEmis(emiRes.data.filter((e: EmiData) => e.isActive === 1));
        if (cardRes.success) setCards(cardRes.data);
        if (fcRes.success) setFixedCosts(fcRes.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* ── Derived ─────────────────────────────────────────── */

  const today = useMemo(() => new Date(), []);

  const cardMap = useMemo(() => {
    const m: Record<number, CardData> = {};
    for (const c of cards) m[c.id] = c;
    return m;
  }, [cards]);

  const cardBreakdown = useMemo(() => {
    const map: Record<number, { cardId: number; cardName: string; cardColor: string; count: number; total: number }> = {};
    for (const e of emis) {
      const cId = e.cardId;
      if (!map[cId]) {
        map[cId] = {
          cardId: cId,
          cardName: e.cardName,
          cardColor: e.cardColor || cardMap[cId]?.color || "#7EB89E",
          count: 0,
          total: 0,
        };
      }
      map[cId].count += 1;
      map[cId].total += e.monthlyAmount;
    }
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [emis, cardMap]);

  const totalEmiBurden = useMemo(
    () => emis.reduce((s, e) => s + e.monthlyAmount, 0),
    [emis]
  );

  const totalFixedCosts = useMemo(
    () => fixedCosts.reduce((s, f) => s + f.monthlyAmount, 0),
    [fixedCosts]
  );

  const totalSurvival = totalEmiBurden + totalFixedCosts;

  /* ── Closure schedule ────────────────────────────────── */

  const closures = useMemo<ClosureEvent[]>(() => {
    const events: ClosureEvent[] = [];
    for (const e of emis) {
      const card = cardMap[e.cardId];
      if (!card || e.monthsRemaining <= 0) continue;
      events.push({
        date: computeLastInstallmentDate(e, card, today),
        emi: e,
        card,
      });
    }
    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [emis, cardMap, today]);

  /* ── 18-month projection ─────────────────────────────── */

  const projection = useMemo(() => {
    const months: { label: string; date: Date; emi: number; fixed: number; total: number }[] = [];
    const start = new Date(today.getFullYear(), today.getMonth(), 1);

    // Precompute each EMI's "active until" month key
    const activeUntil: Map<number, number> = new Map();
    for (const e of emis) {
      const card = cardMap[e.cardId];
      if (!card) continue;
      activeUntil.set(e.id, ymKey(computeLastInstallmentDate(e, card, today)));
    }
    // Precompute each EMI's "first charge" month key
    const firstFire: Map<number, number> = new Map();
    for (const e of emis) {
      const card = cardMap[e.cardId];
      if (!card) continue;
      const last = computeLastInstallmentDate(e, card, today);
      const lastK = ymKey(last);
      const firstK = lastK - (e.monthsRemaining - 1);
      firstFire.set(e.id, firstK);
    }

    for (let i = 0; i < 18; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const k = ymKey(d);
      let emiSum = 0;
      for (const e of emis) {
        const until = activeUntil.get(e.id);
        const from = firstFire.get(e.id);
        if (until !== undefined && from !== undefined && k >= from && k <= until) {
          emiSum += e.monthlyAmount;
        }
      }
      months.push({
        label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        date: d,
        emi: Math.round(emiSum * 100) / 100,
        fixed: Math.round(totalFixedCosts * 100) / 100,
        total: Math.round((emiSum + totalFixedCosts) * 100) / 100,
      });
    }
    return months;
  }, [emis, cardMap, today, totalFixedCosts]);

  const projectionYDomain = useMemo(() => {
    const max = projection.reduce((m, p) => Math.max(m, p.total), 0);
    return niceYDomain(max);
  }, [projection]);

  const gradientEmiId = useId().replace(/:/g, "_");
  const gradientFixedId = useId().replace(/:/g, "_");

  /* ── Render ──────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <div className="h-32 rounded-card bg-surface-1 border border-border animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-64 rounded-card bg-surface-1 border border-border animate-pulse" />
          <div className="h-64 rounded-card bg-surface-1 border border-border animate-pulse" />
        </div>
        <div className="h-80 rounded-card bg-surface-1 border border-border animate-pulse" />
      </div>
    );
  }

  const firstReductionEvent = closures[0] ?? null;
  const lastClearedEvent = closures[closures.length - 1] ?? null;

  return (
    <div className="flex flex-col gap-5">
      {/* ── HERO: Monthly survival cost ──────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="relative overflow-hidden rounded-card border border-border bg-surface-1"
      >
        {/* Multi-gradient top bar */}
        <div className="h-1 w-full bg-gradient-to-r from-sage-400 via-seafoam-400 to-sand-400" />

        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Wallet size={14} className="text-sage-400" />
                <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
                  Monthly Cost of Living
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-base font-medium text-text-muted">{getCurrency()}</span>
                <CountUp
                  value={totalSurvival}
                  decimals={2}
                  duration={900}
                  className="font-mono text-3xl md:text-4xl font-bold text-text-primary tabular-nums leading-none tracking-tight"
                />
              </div>
              <p className="text-xs text-text-muted mt-2">
                What you need to keep the lights on each month at today&apos;s commitments.
              </p>
            </div>

            {/* Composition bar */}
            <div className="lg:w-[340px] w-full">
              <div className="flex items-center justify-between text-xs text-text-muted mb-1.5">
                <span>Composition</span>
                <span className="font-mono tabular-nums">{formatAmount(totalSurvival)}</span>
              </div>
              <div className="flex h-2.5 rounded-full overflow-hidden bg-surface-3">
                {totalEmiBurden > 0 && (
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${(totalEmiBurden / totalSurvival) * 100}%`,
                      background: "linear-gradient(90deg, #7EB89E, #6BB0A8)",
                    }}
                  />
                )}
                {totalFixedCosts > 0 && (
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${(totalFixedCosts / totalSurvival) * 100}%`,
                      background: "linear-gradient(90deg, #C4AA78, #D4B878)",
                    }}
                  />
                )}
              </div>
              <div className="flex justify-between mt-2 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-sage-400" />
                  <span className="text-text-secondary">EMI</span>
                  <span className="font-mono text-text-primary tabular-nums">
                    {formatAmount(totalEmiBurden)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-sand-400" />
                  <span className="text-text-secondary">Fixed</span>
                  <span className="font-mono text-text-primary tabular-nums">
                    {formatAmount(totalFixedCosts)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Two-column: EMI by card + Fixed costs ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: EMI burden by card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="rounded-card border border-border bg-surface-1 overflow-hidden"
        >
          <div className="h-0.5 w-full bg-gradient-to-r from-sage-400/40 to-seafoam-400/40" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                  <TrendingDown size={16} className="text-sage-400" />
                  EMI Burden by Card
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {emis.length} active plan{emis.length !== 1 ? "s" : ""} · {formatAmount(totalEmiBurden)}/mo
                </p>
              </div>
            </div>

            {cardBreakdown.length === 0 ? (
              <div className="py-8 text-center text-sm text-text-muted">
                No active EMIs.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {cardBreakdown.map((g) => {
                  const pct = totalEmiBurden > 0 ? (g.total / totalEmiBurden) * 100 : 0;
                  return (
                    <div key={g.cardId}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="h-3 w-3 rounded-full shrink-0 shadow-sm"
                            style={{
                              background: `linear-gradient(135deg, ${g.cardColor}, ${g.cardColor}88)`,
                            }}
                          />
                          <span className="text-sm font-medium text-text-primary truncate">
                            {g.cardName.replace(/ Card$/, "")}
                          </span>
                          <span className="text-xs text-text-muted shrink-0">
                            {g.count} plan{g.count !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1 shrink-0">
                          <span className="font-mono text-sm font-semibold text-text-primary tabular-nums">
                            {formatAmount(g.total)}
                          </span>
                          <span className="text-[10px] font-normal text-text-muted tabular-nums w-9 text-right">
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-surface-3 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.7, delay: 0.1 }}
                          className="h-full rounded-full"
                          style={{
                            background: `linear-gradient(90deg, ${g.cardColor}, ${g.cardColor}88)`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}

                <div className="pt-3 mt-1 border-t border-border/40 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
                    Total EMI
                  </span>
                  <span className="font-mono text-base font-bold text-text-primary tabular-nums">
                    {formatAmount(totalEmiBurden)}
                    <span className="text-xs font-normal text-text-muted">/mo</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Right: Fixed costs */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="rounded-card border border-border bg-surface-1 overflow-hidden"
        >
          <div className="h-0.5 w-full bg-gradient-to-r from-sand-400/40 to-[#D4B878]/40" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                  <Home size={16} className="text-sand-400" />
                  Fixed Monthly Costs
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {fixedCosts.length} item{fixedCosts.length !== 1 ? "s" : ""} · {formatAmount(totalFixedCosts)}/mo
                </p>
              </div>
              <Link
                href="/settings?section=fixed-costs"
                className="flex items-center gap-1.5 rounded-button px-2.5 py-1.5 text-xs font-medium text-text-muted hover:text-text-primary hover:bg-surface-2 transition-all"
              >
                <SettingsIcon size={12} />
                Edit
              </Link>
            </div>

            {fixedCosts.length === 0 ? (
              <div className="py-8 text-center text-sm text-text-muted">
                No fixed costs configured.
                <br />
                <Link
                  href="/settings?section=fixed-costs"
                  className="inline-flex items-center gap-1 text-sage-300 hover:text-sage-400 mt-2 text-xs"
                >
                  Add via Settings →
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {fixedCosts.map((fc) => {
                  const Icon = getIcon(fc.icon);
                  const pct = totalFixedCosts > 0 ? (fc.monthlyAmount / totalFixedCosts) * 100 : 0;
                  const color = fc.color || "#C4AA78";
                  return (
                    <div key={fc.id} className="flex items-center gap-3">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: `${color}1A` }}
                      >
                        <Icon size={14} style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-text-primary truncate">
                            {fc.name}
                          </span>
                          <span className="font-mono text-sm font-semibold text-text-primary tabular-nums shrink-0">
                            {formatAmount(fc.monthlyAmount)}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.7, delay: 0.15 }}
                            className="h-full rounded-full"
                            style={{
                              background: `linear-gradient(90deg, ${color}, ${color}88)`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="pt-3 mt-1 border-t border-border/40 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
                    Total Fixed
                  </span>
                  <span className="font-mono text-base font-bold text-text-primary tabular-nums">
                    {formatAmount(totalFixedCosts)}
                    <span className="text-xs font-normal text-text-muted">/mo</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── 18-month projection chart ────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.15 }}
        className="rounded-card border border-border bg-surface-1 overflow-hidden"
      >
        <div className="h-0.5 w-full bg-gradient-to-r from-sage-400/40 via-seafoam-400/40 to-sand-400/40" />
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-text-primary">
                18-Month Burden Projection
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Total monthly outflow as your EMIs deplete. Fixed costs stay constant.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-sage-400" />
                <span className="text-text-secondary">EMI</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-sand-400" />
                <span className="text-text-secondary">Fixed</span>
              </div>
            </div>
          </div>

          <div style={{ width: "100%", aspectRatio: "2.8/1", minHeight: 220, maxHeight: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projection} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientFixedId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C4AA78" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#C4AA78" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id={gradientEmiId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7EB89E" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#7EB89E" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={colors.border}
                  strokeOpacity={0.4}
                  horizontal
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: colors.textMuted, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: colors.textMuted, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  domain={projectionYDomain}
                  tickFormatter={formatYAxis}
                  width={56}
                />
                <Tooltip
                  content={(props) => {
                    if (!props.active || !props.payload || props.payload.length === 0) return null;
                    const data = props.payload[0].payload as (typeof projection)[0];
                    return (
                      <ChartTooltip
                        active={true}
                        payload={[
                          { name: "EMI", value: data.emi, color: "#7EB89E" },
                          { name: "Fixed", value: data.fixed, color: "#C4AA78" },
                        ]}
                        label={String(props.label ?? "")}
                        showTotal
                      />
                    );
                  }}
                  cursor={{ stroke: colors.border, strokeOpacity: 0.6, strokeDasharray: "3 3" }}
                />
                {/* Fixed first (bottom of stack), then EMI on top */}
                <Area
                  type="monotone"
                  dataKey="fixed"
                  stackId="1"
                  stroke="#C4AA78"
                  strokeWidth={1.5}
                  fill={`url(#${gradientFixedId})`}
                  isAnimationActive
                />
                <Area
                  type="monotone"
                  dataKey="emi"
                  stackId="1"
                  stroke="#7EB89E"
                  strokeWidth={1.5}
                  fill={`url(#${gradientEmiId})`}
                  isAnimationActive
                />
                {/* "Now" reference line on the first month */}
                {projection.length > 0 && (
                  <ReferenceLine
                    x={projection[0].label}
                    stroke={colors.textMuted}
                    strokeDasharray="2 4"
                    strokeOpacity={0.5}
                    label={{
                      value: "Now",
                      position: "insideTopLeft",
                      fill: colors.textMuted,
                      fontSize: 10,
                    }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* ── Closure schedule ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.2 }}
        className="rounded-card border border-border bg-surface-1 overflow-hidden"
      >
        <div className="h-0.5 w-full bg-gradient-to-r from-seafoam-400/40 to-sand-400/40" />
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                <CalendarClock size={16} className="text-seafoam-400" />
                EMI Closure Schedule
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                When each plan&apos;s final installment hits and your new monthly burden.
              </p>
            </div>
            {firstReductionEvent && (
              <div className="text-right hidden md:block">
                <div className="text-[10px] uppercase tracking-wider text-text-muted">
                  Next drop
                </div>
                <div className="text-xs font-medium text-text-primary mt-0.5">
                  {firstReductionEvent.date.toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
            )}
          </div>

          {closures.length === 0 ? (
            <div className="py-8 text-center text-sm text-text-muted">
              No active EMIs to schedule.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-text-muted">
                    <th className="text-left font-medium px-2 py-2">Date</th>
                    <th className="text-left font-medium px-2 py-2">Card</th>
                    <th className="text-left font-medium px-2 py-2">EMI</th>
                    <th className="text-right font-medium px-2 py-2">– {getCurrency()}</th>
                    <th className="text-right font-medium px-2 py-2">Burden after</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let running = totalEmiBurden + totalFixedCosts;
                    return closures.map((c, i) => {
                      running = running - c.emi.monthlyAmount;
                      const ms = c.date.toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      });
                      return (
                        <motion.tr
                          key={`${c.emi.id}-${i}`}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: 0.02 * i }}
                          className="border-t border-border/40 hover:bg-surface-2/30 transition-colors"
                        >
                          <td className="px-2 py-2.5 text-text-secondary whitespace-nowrap font-mono tabular-nums text-xs">
                            {ms}
                          </td>
                          <td className="px-2 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <div
                                className="h-2 w-2 rounded-full shrink-0"
                                style={{ background: c.emi.cardColor || c.card.color || "#7EB89E" }}
                              />
                              <span className="text-xs text-text-secondary truncate max-w-[180px]">
                                {c.emi.cardName.replace(/ Card$/, "")}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 py-2.5 text-text-primary truncate max-w-[280px]">
                            {c.emi.description}
                          </td>
                          <td className="px-2 py-2.5 text-right font-mono tabular-nums text-danger">
                            −{formatAmount(c.emi.monthlyAmount)}
                          </td>
                          <td className="px-2 py-2.5 text-right font-mono tabular-nums font-semibold text-text-primary">
                            {formatAmount(running)}
                          </td>
                        </motion.tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          )}

          {lastClearedEvent && (
            <div className="mt-5 pt-4 border-t border-border/40 flex items-center gap-2">
              <CheckCircle2 size={14} className="text-success" />
              <span className="text-xs text-text-secondary">
                Fully EMI-free on{" "}
                <span className="font-semibold text-text-primary">
                  {lastClearedEvent.date.toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                {" — "}
                burden drops to {formatAmount(totalFixedCosts)}/mo (fixed only).
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
