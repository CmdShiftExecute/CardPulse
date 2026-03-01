"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Check } from "lucide-react";
import { cn, formatAmount } from "@/lib/utils";
import { getCycleInfo } from "@/lib/cycle-utils";
import type { CardCycleConfig } from "@/lib/cycle-utils";

interface CyclePaymentStatus {
  id: number;
  isPaid: boolean;
  amount: number;
  paidAt: string | null;
}

interface TickerCardData {
  cardId: number;
  cardName: string;
  bank: string;
  lastFour: string | null;
  color: string | null;
  creditLimit: number | null;
  cycleStart: number;
  cycleEnd: number;
  statementDay: number;
  dueDay: number;
  cycleSpend: number;
  emiMonthly: number;
  transactionCount: number;
  currentCyclePayment: CyclePaymentStatus | null;
  prevCyclePayment: CyclePaymentStatus | null;
}

interface TickerLabelData {
  labelName: string;
  total: number;
}

interface TickerPaymentItem {
  cardId: number;
  cardName: string;
  lastFour: string | null;
  color: string | null;
  amount: number;
  dueDateStr: string;
  daysUntil: number;
  isPaid: boolean;
  isPreviousCycle: boolean;
}

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

function PaymentTicker() {
  const [cards, setCards] = useState<TickerCardData[]>([]);
  const [labels, setLabels] = useState<TickerLabelData[]>([]);
  const [loading, setLoading] = useState(true);
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchTickerData() {
      try {
        const res = await fetch("/api/ticker");
        const json = await res.json();
        if (json.success && mounted) {
          setCards(json.data.cards);
          setLabels(json.data.topLabels);
        }
      } catch {
        // Silently fail — ticker is non-critical
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchTickerData();
    const interval = setInterval(fetchTickerData, REFRESH_INTERVAL);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Build ticker payment items from card cycle data
  const paymentItems = useMemo(() => {
    const items: TickerPaymentItem[] = [];

    for (const card of cards) {
      const cycle = getCycleInfo(card as CardCycleConfig);
      const estimatedBill = card.cycleSpend + card.emiMonthly;

      // Previous cycle due (if still upcoming)
      if (cycle.daysUntilPrevDue > 0) {
        items.push({
          cardId: card.cardId,
          cardName: card.cardName,
          lastFour: card.lastFour,
          color: card.color,
          amount: estimatedBill,
          dueDateStr: cycle.prevCycleDueDateStr,
          daysUntil: cycle.daysUntilPrevDue,
          isPaid: card.prevCyclePayment?.isPaid ?? false,
          isPreviousCycle: true,
        });
      }

      // Current cycle due (if in the future)
      if (cycle.daysUntilDue > 0) {
        items.push({
          cardId: card.cardId,
          cardName: card.cardName,
          lastFour: card.lastFour,
          color: card.color,
          amount: estimatedBill,
          dueDateStr: cycle.dueDateStr,
          daysUntil: cycle.daysUntilDue,
          isPaid: card.currentCyclePayment?.isPaid ?? false,
          isPreviousCycle: false,
        });
      }
    }

    // Sort: unpaid first (by days until due ascending), paid at the end
    items.sort((a, b) => {
      if (a.isPaid !== b.isPaid) return a.isPaid ? 1 : -1;
      return a.daysUntil - b.daysUntil;
    });

    return items;
  }, [cards]);

  // Calculate animation duration based on content
  const tickerDuration = useMemo(() => {
    const itemCount = paymentItems.length + labels.length;
    return Math.max(20, itemCount * 5);
  }, [paymentItems.length, labels.length]);

  if (loading || (paymentItems.length === 0 && labels.length === 0)) {
    return null;
  }

  return (
    <div className="hidden md:flex h-8 border-b border-border/50 bg-surface-2/80 backdrop-blur-sm items-center overflow-hidden">
      <div
        ref={tickerRef}
        className="ticker-scroll flex items-center whitespace-nowrap"
        style={{ "--ticker-duration": `${tickerDuration}s` } as React.CSSProperties}
      >
        {/* Render content twice for seamless looping */}
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center" aria-hidden={copy === 1}>
            {/* Section 1: Card payment items */}
            {paymentItems.map((item, idx) => (
              <TickerPaymentEntry
                key={`${copy}-pay-${item.cardId}-${item.isPreviousCycle}-${idx}`}
                item={item}
                showSeparator={idx < paymentItems.length - 1 || labels.length > 0}
              />
            ))}

            {/* Vertical divider + "Top Spends" header between payments and labels */}
            {paymentItems.length > 0 && labels.length > 0 && (
              <div className="flex items-center gap-2 px-4">
                <div className="h-4 w-px bg-border-hover" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  Top Spends
                </span>
                <div className="h-4 w-px bg-border-hover" />
              </div>
            )}

            {/* Section 2: Top label spends */}
            {labels.map((label, idx) => (
              <TickerLabelEntry
                key={`${copy}-label-${idx}`}
                label={label}
                showSeparator={idx < labels.length - 1}
              />
            ))}

            {/* End spacer before the duplicate starts */}
            <div className="px-6" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TickerPaymentEntry({
  item,
  showSeparator,
}: {
  item: TickerPaymentItem;
  showSeparator: boolean;
}) {
  // Unpaid cards: always neon red for amounts/dates; paid: green at reduced opacity
  const urgencyColor = item.isPaid
    ? "text-success/70"
    : "text-[#FF4D4D]";

  return (
    <div className="flex items-center">
      <div className={cn(
        "flex items-center gap-2 px-3",
        item.isPaid && "opacity-70"
      )}>
        {/* Card color dot */}
        <div
          className="h-1.5 w-1.5 rounded-full shrink-0"
          style={{ backgroundColor: item.color || "#7EB89E" }}
        />

        {/* Card name */}
        <span className="text-[11px] font-medium text-text-secondary">
          {item.cardName.replace(" Card", "")}
        </span>

        {/* Last four */}
        {item.lastFour && (
          <span className="font-mono text-[10px] text-text-muted tabular-nums">
            ··{item.lastFour}
          </span>
        )}

        {/* Amount */}
        <span className={cn(
          "font-mono text-[11px] font-semibold tabular-nums",
          item.isPaid ? "text-success/70" : urgencyColor
        )}>
          {formatAmount(item.amount)}
        </span>

        {/* Due date + days or Paid status */}
        {item.isPaid ? (
          <span className="flex items-center gap-0.5 text-[10px] text-success/70 font-medium">
            <Check size={9} />
            Paid
          </span>
        ) : (
          <span className={cn("text-[10px] font-medium", urgencyColor)}>
            Due: {item.dueDateStr} ({item.daysUntil}d)
          </span>
        )}
      </div>

      {/* Diamond separator */}
      {showSeparator && (
        <span className="text-text-muted/20 text-[10px] mx-1">&#x25C6;</span>
      )}
    </div>
  );
}

function TickerLabelEntry({
  label,
  showSeparator,
}: {
  label: TickerLabelData;
  showSeparator: boolean;
}) {
  return (
    <div className="flex items-center">
      <div className="flex items-center gap-2 px-3">
        {/* Label name */}
        <span className="text-[11px] font-medium text-chart-4">
          {label.labelName}
        </span>

        {/* Amount */}
        <span className="font-mono text-[11px] font-semibold tabular-nums text-sand-300">
          {formatAmount(label.total)}
        </span>
      </div>

      {/* Diamond separator */}
      {showSeparator && (
        <span className="text-text-muted/20 text-[10px] mx-1">&#x25C6;</span>
      )}
    </div>
  );
}

export { PaymentTicker };
