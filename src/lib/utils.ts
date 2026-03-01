import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export from central format module — all consumers keep the same import path
export { formatAmount, getCurrency } from "@/lib/format";
