// @ts-nocheck
/**
 * AUTO-GENERATED server engine for slabs.
 * Source formula extracted from Stage-1 calculator HTML — do not edit lightly.
 */
import {
  coerceInputs,
  m,
  q,
  result,
  toEngineResult,
} from "../helpers";
import type { CalculatorEngine, EngineResult, NumericInputs } from "../types";

function calculator(v){const area=Math.max(0,v.length*v.width-v.openings)*v.qty; const net=area*v.thickness; const order=net*(1+v.waste/100); const steel=net*v.rebarRate;
return result([m('Net slab area',area,'m²'),m('Concrete volume',net,'m³'),m('Concrete to order',order,'m³'),m('Soffit formwork',area,'m²'),m('Reinforcement allowance',steel,'kg')],[q('Concrete',order,'m³',0.1),q('Soffit formwork',area,'m²',1),q('Reinforcement',steel,'kg',5)],[`Edge shutters and drop panels are not included unless entered as separate elements.`]);}

export function computeSlabs(
  raw: NumericInputs,
): EngineResult {
  const v = coerceInputs(raw);
  const out = calculator(v);
  return toEngineResult(out, [
    "Server-backed STRUCTURA material quantity calculation.",
    "Slabs Material Calculator",
  ]);
}

export const slabsEngine: CalculatorEngine = {
  id: "slabs",
  version: "1.0",
  title: "Slabs Material Calculator",
  category: "Reinforced Concrete",
  compute: computeSlabs,
};
