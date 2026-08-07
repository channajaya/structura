/**
 * Shared types for STRUCTURA Material Calculator server engines.
 * Engines must only be imported from server routes / server modules.
 */

export type NumericInputs = Record<string, number | string>;

export type MetricResult = {
  label: string;
  value: number;
  unit: string;
};

export type MaterialLine = {
  label: string;
  exact: number;
  order: number;
  unit: string;
};

export type CalculationStep = {
  label: string;
  expression?: string;
  value?: number;
  unit?: string;
};

export type EngineResult = {
  metrics: MetricResult[];
  materials: MaterialLine[];
  notes: string[];
  steps: CalculationStep[];
  assumptions: string[];
};

export type CalculatorEngine = {
  id: string;
  version: string;
  title: string;
  category: string;
  compute: (inputs: NumericInputs) => EngineResult;
};

export function roundTo(x: number, inc: number): number {
  if (!Number.isFinite(x) || x <= 0) return 0;
  return Math.ceil((x - 1e-10) / inc) * inc;
}

export function asNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
