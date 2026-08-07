import type {
  EngineResult,
  MaterialLine,
  MetricResult,
  NumericInputs,
} from "./types";
import { asNumber, roundTo } from "./types";

export { asNumber, roundTo };
export type { EngineResult, MaterialLine, MetricResult, NumericInputs };

export function fmt(x: unknown): string {
  if (!Number.isFinite(Number(x))) return "—";
  const n = Number(x);
  if (Math.abs(n) >= 1000) {
    return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
  }
  if (Math.abs(n) >= 100) {
    return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
  }
  if (Math.abs(n) >= 10) {
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  return n.toLocaleString(undefined, { maximumFractionDigits: 3 });
}

export function m(label: string, value: unknown, unit: string): MetricResult {
  return { label, value: Number(value), unit };
}

export function q(
  label: string,
  exact: unknown,
  unit: string,
  increment: number,
): MaterialLine {
  const e = Number(exact);
  return {
    label,
    exact: e,
    order: roundTo(e, increment),
    unit,
  };
}

export function result(
  metrics: MetricResult[],
  materials: MaterialLine[],
  notes: string[] | string,
): { metrics: MetricResult[]; materials: MaterialLine[]; notes: string[] } {
  return {
    metrics,
    materials,
    notes: Array.isArray(notes) ? notes : [String(notes)],
  };
}

/** Matches the Stage-1 frontend mix helper used by concrete calculators. */
export function mixMaterials(
  wet: number,
  cp: number,
  sp: number,
  ap: number,
  dryFactor: number,
  wastePct: number,
) {
  const orderWet = wet * (1 + wastePct / 100);
  const dry = orderWet * dryFactor;
  const total = cp + sp + ap;
  const cementVol = dry * cp / total;
  return {
    orderWet,
    dry,
    bags: (cementVol * 1440) / 50,
    sand: (dry * sp) / total,
    aggregate: (dry * ap) / total,
  };
}

export function coerceInputs(raw: NumericInputs): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw || {})) {
    out[key] = asNumber(value);
  }
  return out;
}

/** Matches Stage-1 note reused by mix calculators. */
export const mixNote =
  "Nominal mix quantities are indicative; use the project mix design or ready-mix supplier data for final procurement.";

let labelContext: Record<string, unknown> = {};

export function setLabelContext(v: Record<string, unknown>) {
  labelContext = v || {};
}

/**
 * Server stand-in for the DOM `labelOf(id)` helper.
 * Returns the selected/input value when available.
 */
export function labelOf(id: string): string {
  const value = labelContext[id];
  if (value == null || value === "") return id;
  return String(value);
}

export function toEngineResult(
  out: {
    metrics: MetricResult[];
    materials: MaterialLine[];
    notes?: string[];
  },
  assumptions: string[] = [],
): EngineResult {
  return {
    metrics: out.metrics,
    materials: out.materials,
    notes: out.notes || [],
    steps: (out.metrics || []).map((metric) => ({
      label: metric.label,
      value: metric.value,
      unit: metric.unit,
    })),
    assumptions:
      assumptions.length > 0
        ? assumptions
        : ["Server-backed STRUCTURA material quantity calculation."],
  };
}
