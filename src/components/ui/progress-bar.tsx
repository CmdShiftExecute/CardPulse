import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function getProgressColor(percent: number): string {
  if (percent >= 100) return "bg-danger";
  if (percent >= 75) return "bg-warning";
  return "bg-success";
}

function ProgressBar({
  value,
  max = 100,
  showLabel = false,
  size = "md",
  className,
}: ProgressBarProps) {
  const percent = Math.min(Math.round((value / max) * 100), 100);

  const sizeStyles = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-text-secondary font-mono">
            {percent}%
          </span>
        </div>
      )}
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-surface-3",
          sizeStyles[size]
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-out",
            getProgressColor(percent)
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export { ProgressBar, type ProgressBarProps };
