// @ts-nocheck
/**
 * AUTO-GENERATED server engine for foundationExcavation.
 * Source formula extracted from Stage-1 calculator HTML — do not edit lightly.
 */
import {
  coerceInputs,
  m,
  q,
  result,
  toEngineResult,
  fmt,
} from "../helpers";
import type { CalculatorEngine, EngineResult, NumericInputs } from "../types";

function calculator(v){const trenchWidth = v.width + 2*v.working;
const excavation = v.length * trenchWidth * v.depth;
const bulked = excavation * (1 + v.bulking/100);
const disposal = bulked * v.disposal/100;
const retained = Math.max(0, bulked - disposal);
return result([
 m('Excavation volume',excavation,'m³'),m('Bulked excavated material',bulked,'m³'),m('Material for disposal',disposal,'m³'),m('Material retained on site',retained,'m³')
],[
 q('Excavation',excavation,'m³',0.1),q('Cart-away / disposal',disposal,'m³',0.1)
],[`Calculated trench width: ${fmt(trenchWidth)} m. Confirm side slopes, shoring and actual ground conditions separately.`]);}

export function computeFoundationExcavation(
  raw: NumericInputs,
): EngineResult {
  const v = coerceInputs(raw);
  const out = calculator(v);
  return toEngineResult(out, [
    "Server-backed STRUCTURA material quantity calculation.",
    "Foundation Excavation Material Calculator",
  ]);
}

export const foundationExcavationEngine: CalculatorEngine = {
  id: "foundationExcavation",
  version: "1.0",
  title: "Foundation Excavation Material Calculator",
  category: "Foundations",
  compute: computeFoundationExcavation,
};
