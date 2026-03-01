"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface InsightCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  /** Optional color for the value text (e.g. success green, danger red) */
  valueColor?: string;
}

export function InsightCard({ title, value, subtitle, icon: Icon, valueColor }: InsightCardProps) {
  return (
    <div className="rounded-card border border-border bg-surface-1 p-4 hover:bg-surface-2/40 transition-all duration-150">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-text-muted">{title}</span>
        <Icon size={16} className="text-text-muted/40 shrink-0" />
      </div>
      <p
        className="font-mono text-lg font-bold tabular-nums leading-tight truncate"
        style={{ color: valueColor }}
      >
        {value}
      </p>
      <p className="text-xs text-text-muted mt-1 truncate">{subtitle}</p>
    </div>
  );
}

interface InsightCardRowProps {
  cards: InsightCardProps[];
}

export function InsightCardRow({ cards }: InsightCardRowProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
        >
          <InsightCard {...card} />
        </motion.div>
      ))}
    </div>
  );
}
