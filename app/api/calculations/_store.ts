type CalculationRecord = {
  id: string;
  calculatorId?: string;
  calculatorVersion?: string;
  projectId?: string | null;
  country?: string;
  language?: string;
  inputs?: unknown;
  results?: unknown;
  assumptions?: unknown;
  warnings?: unknown;
  timestamp?: string;
  savedAt: string;
};

/** In-memory Stage 1 store — replace with durable storage before production. */
export const calculationsStore = new Map<string, CalculationRecord>();
