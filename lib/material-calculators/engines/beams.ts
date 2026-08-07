// @ts-nocheck
/**
 * AUTO-GENERATED server engine for beams.
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

function calculator(v){const effective=Math.max(0,v.depth-v.slabOverlap); const net=v.qty*v.length*v.width*effective; const order=net*(1+v.waste/100); const form=v.qty*v.length*(v.width+2*effective); const steel=net*v.rebarRate;
return result([m('Effective beam depth',effective,'m'),m('Concrete volume',net,'m³'),m('Concrete to order',order,'m³'),m('Soffit + side formwork',form,'m²'),m('Reinforcement allowance',steel,'kg')],[q('Concrete',order,'m³',0.1),q('Formwork',form,'m²',1),q('Reinforcement',steel,'kg',5)],[`Slab overlap deduction is applied to avoid double-counting the beam zone within the slab.`]);}

export function computeBeams(
  raw: NumericInputs,
): EngineResult {
  const v = coerceInputs(raw);
  const out = calculator(v);
  return toEngineResult(out, [
    "Server-backed STRUCTURA material quantity calculation.",
    "Beams Material Calculator",
  ]);
}

export const beamsEngine: CalculatorEngine = {
  id: "beams",
  version: "1.0",
  title: "Beams Material Calculator",
  category: "Reinforced Concrete",
  compute: computeBeams,
};
