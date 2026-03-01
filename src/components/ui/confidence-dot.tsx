import { cn } from "@/lib/utils";

type ConfidenceLevel = "high" | "low" | "none";

interface ConfidenceDotProps {
  level: ConfidenceLevel;
  className?: string;
}

const dotStyles: Record<ConfidenceLevel, string> = {
  high: "bg-success",
  low: "bg-warning",
  none: "bg-text-muted/30",
};

const tooltips: Record<ConfidenceLevel, string> = {
  high: "Auto-filled with high confidence",
  low: "Auto-filled with low confidence",
  none: "Not auto-filled",
};

function ConfidenceDot({ level, className }: ConfidenceDotProps) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 shrink-0 rounded-full",
        dotStyles[level],
        className
      )}
      title={tooltips[level]}
      aria-label={tooltips[level]}
    />
  );
}

export { ConfidenceDot, type ConfidenceDotProps, type ConfidenceLevel };
