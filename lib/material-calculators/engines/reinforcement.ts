// @ts-nocheck
/**
 * AUTO-GENERATED server engine for reinforcement.
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

function calculator(v){const base=v.length*v.count; const cut=base*(1+(v.lap+v.bend)/100); const unit=v.diameter*v.diameter/162; const net=cut*unit; const order=net*(1+v.waste/100); const cost=order*v.price;
return result([m('Base length',base,'m'),m('Cutting length',cut,'m'),m('Unit mass',unit,'kg/m'),m('Net weight',net,'kg'),m('Order weight',order,'kg'),m('Estimated cost',cost,'currency')],[q(`${v.diameter} mm bars`,order,'kg',5)],[`Use the final bar bending schedule for procurement. Theoretical unit mass is d²/162 kg/m.`]);}

export function computeReinforcement(
  raw: NumericInputs,
): EngineResult {
  const v = coerceInputs(raw);
  const out = calculator(v);
  return toEngineResult(out, [
    "Server-backed STRUCTURA material quantity calculation.",
    "Reinforcement Material Calculator",
  ]);
}

export const reinforcementEngine: CalculatorEngine = {
  id: "reinforcement",
  version: "1.0",
  title: "Reinforcement Material Calculator",
  category: "Reinforced Concrete",
  compute: computeReinforcement,
};
