export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export type ConfidenceLevel = "high" | "low" | "none";

export interface FieldConfidence {
  level: ConfidenceLevel;
  score: number;
}

export interface ParsedTransaction {
  amount: number | null;
  date: string | null;
  cardId: number | null;
  cardName: string | null;
  categoryId: number | null;
  categoryName: string | null;
  subcategoryId: number | null;
  subcategoryName: string | null;
  labelIds: number[];
  labelNames: string[];
  merchant: string | null;
  confidence: {
    amount: FieldConfidence;
    date: FieldConfidence;
    card: FieldConfidence;
    category: FieldConfidence;
  };
  remainingText: string;
}
