import type React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-card bg-surface-2",
        className
      )}
      style={style}
    />
  );
}

/* ── Pre-built skeleton layouts ──────────────────────────── */

/** Full-width card skeleton with title, subtitle, and content */
function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn("rounded-card border border-border bg-surface-1 p-5", className)}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-10 w-10 rounded-[10px]" />
        <div className="flex-1">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-3/4 mb-2" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

/** Dashboard hero skeleton */
function SkeletonHero() {
  return (
    <div className="rounded-card border border-border bg-surface-1 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-button" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-8 rounded-button" />
        </div>
        <Skeleton className="h-7 w-28 rounded-full" />
      </div>
      <div className="flex flex-col items-center py-4">
        <Skeleton className="h-3 w-20 mb-4" />
        <Skeleton className="h-9 w-56 mb-2" />
        <Skeleton className="h-3 w-36" />
      </div>
    </div>
  );
}

/** Chart skeleton — deterministic heights to avoid SSR hydration mismatch */
const CHART_BAR_HEIGHTS = [55, 72, 40, 85, 63, 48, 78, 35];

function SkeletonChart() {
  return (
    <div className="rounded-card border border-border bg-surface-1 p-6">
      <Skeleton className="h-5 w-40 mb-6" />
      <div className="flex items-end gap-2 h-[200px]">
        {CHART_BAR_HEIGHTS.map((h, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t-sm"
            style={{ height: `${h}%` } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}

/** Grid of skeleton cards */
function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/** Table/list skeleton */
function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-card border border-border bg-surface-1 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="h-4 w-4 rounded" />
              <div className="flex-1">
                <Skeleton className="h-4 w-48 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Dashboard layout skeleton */
function SkeletonDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <SkeletonHero />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart />
        <SkeletonCard />
      </div>
      <SkeletonCard />
      <SkeletonGrid count={3} />
    </div>
  );
}

export {
  Skeleton,
  SkeletonCard,
  SkeletonHero,
  SkeletonChart,
  SkeletonGrid,
  SkeletonList,
  SkeletonDashboard,
};
